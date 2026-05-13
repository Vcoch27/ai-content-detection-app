import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Upload,
  AlertCircle,
  CheckCircle2,
  Zap,
  Sparkles,
  Eye,
  Sliders,
  Info,
  Cpu,
  BarChart3,
  Video,
  Activity,
} from 'lucide-react';
import { MainLayout } from '../layouts/MainLayout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { apiClient, handleApiError } from '../utils/api';

const VIDEO_TRIM_MIN_SECONDS = 5;
const VIDEO_TRIM_MAX_SECONDS = 10;
const MAX_VIDEO_UPLOAD_BYTES = 20 * 1024 * 1024;

const trimVideoSegment = async (sourceFile, startSeconds, endSeconds) => {
  const sourceUrl = URL.createObjectURL(sourceFile);
  const videoEl = document.createElement('video');
  videoEl.preload = 'auto';
  videoEl.src = sourceUrl;
  videoEl.muted = true;
  videoEl.playsInline = true;

  try {
    await new Promise((resolve, reject) => {
      videoEl.onloadedmetadata = resolve;
      videoEl.onerror = () => reject(new Error('Failed to read video metadata'));
    });

    const captureStream = videoEl.captureStream || videoEl.mozCaptureStream;
    if (!captureStream) {
      throw new Error(
        'Browser does not support in-browser video trimming. Please use Chrome or Edge.'
      );
    }

    const stream = captureStream.call(videoEl);
    const mimeCandidates = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'];
    const selectedMimeType =
      mimeCandidates.find((type) => MediaRecorder.isTypeSupported(type)) || 'video/webm';
    const mediaRecorder = new MediaRecorder(stream, { mimeType: selectedMimeType });
    const recordedChunks = [];

    mediaRecorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        recordedChunks.push(event.data);
      }
    };

    const safeStart = Math.max(0, Math.min(startSeconds, Math.max(videoEl.duration - 0.1, 0)));
    const safeEnd = Math.max(
      safeStart + VIDEO_TRIM_MIN_SECONDS,
      Math.min(endSeconds, videoEl.duration)
    );
    const clipEnd = Math.min(videoEl.duration, safeEnd);
    const recordDurationMs = Math.max(500, Math.round((clipEnd - safeStart) * 1000));

    await new Promise((resolve, reject) => {
      let stopTimer;

      mediaRecorder.onerror = () => reject(new Error('Failed while recording trimmed clip'));
      mediaRecorder.onstop = () => {
        if (stopTimer) {
          clearTimeout(stopTimer);
        }
        resolve();
      };

      videoEl.currentTime = safeStart;
      videoEl.onseeked = async () => {
        mediaRecorder.start();
        try {
          await videoEl.play();
        } catch (error) {
          reject(new Error('Unable to play video for trimming'));
          return;
        }

        stopTimer = setTimeout(() => {
          videoEl.pause();
          if (mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
          }
        }, recordDurationMs);
      };
    });

    const trimmedBlob = new Blob(recordedChunks, { type: selectedMimeType });
    if (trimmedBlob.size === 0) {
      throw new Error('Trimmed video is empty. Please choose a different segment.');
    }

    const baseName = (sourceFile.name || 'trimmed-video').replace(/\.[^.]+$/, '');
    return new File([trimmedBlob], `${baseName}-trimmed.webm`, { type: selectedMimeType });
  } finally {
    URL.revokeObjectURL(sourceUrl);
    videoEl.remove();
  }
};

/**
 * DetectPage - Main image detection page
 */
export const DetectPage = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedVideoFile, setSelectedVideoFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);
  const [videoDuration, setVideoDuration] = useState(0);
  const [videoTrimStart, setVideoTrimStart] = useState(0);
  const [videoTrimEnd, setVideoTrimEnd] = useState(VIDEO_TRIM_MIN_SECONDS);
  const [trimmedVideoInfo, setTrimmedVideoInfo] = useState(null);
  const [imageUrl, setImageUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [activeTab, setActiveTab] = useState('upload'); // 'upload', 'url', 'video'
  const [error, setError] = useState(null);
  const [heatmapOpacity, setHeatmapOpacity] = useState(0.7);
  const canDetectFromUrl = false;
  const videoPlayerRef = useRef(null);
  const videoLoopEndRef = useRef(0);

  const selectedFileLabel = useMemo(() => selectedFile?.name || '', [selectedFile]);
  const maxTrimStart = useMemo(
    () => Math.max(videoDuration - VIDEO_TRIM_MIN_SECONDS, 0),
    [videoDuration]
  );

  const syncVideoPreviewToTrim = (startSeconds, endSeconds = videoTrimEnd) => {
    const player = videoPlayerRef.current;
    if (!player || !Number.isFinite(player.duration) || player.duration <= 0) {
      return;
    }

    const safeStart = Math.max(0, Math.min(startSeconds, Math.max(player.duration - 0.1, 0)));
    const loopEnd = Math.min(
      player.duration,
      Math.max(endSeconds, safeStart + VIDEO_TRIM_MIN_SECONDS)
    );

    videoLoopEndRef.current = loopEnd;
    player.currentTime = safeStart;

    const playPromise = player.play();
    if (playPromise && typeof playPromise.catch === 'function') {
      playPromise.catch(() => {
        // Ignore autoplay restrictions; user can hit play manually.
      });
    }
  };

  useEffect(() => {
    return () => {
      if (videoPreview) {
        URL.revokeObjectURL(videoPreview);
      }
    };
  }, [videoPreview]);

  // Handle file upload
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
      setError('File size must be less than 20MB');
      return;
    }

    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }

    setError(null);
    setSelectedFile(file);

    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.readAsDataURL(file);
  };

  // Handle video file upload
  const handleVideoFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      setError('Please upload a video file');
      return;
    }

    setError(null);
    setResult(null);
    setPreview(null);
    setSelectedVideoFile(file);
    setVideoDuration(0);
    setVideoTrimStart(0);
    setVideoTrimEnd(VIDEO_TRIM_MIN_SECONDS);
    setTrimmedVideoInfo(null);
    videoLoopEndRef.current = 0;
    setVideoPreview((currentPreview) => {
      if (currentPreview) {
        URL.revokeObjectURL(currentPreview);
      }
      return URL.createObjectURL(file);
    });
  };

  const triggerFileInput = () => {
    const el = document.getElementById('file-upload');
    if (el) el.click();
  };

  const triggerVideoInput = () => {
    const el = document.getElementById('video-upload');
    if (el) el.click();
  };

  // Handle drag and drop
  const handleDragOver = (e) => {
    e.preventDefault();
    e.currentTarget.classList.add('bg-blue-50');
  };

  const handleDragLeave = (e) => {
    e.currentTarget.classList.remove('bg-blue-50');
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.currentTarget.classList.remove('bg-blue-50');
    const file = e.dataTransfer.files?.[0];
    if (file) {
      const event = { target: { files: [file] } };
      handleFileChange(event);
    }
  };

  // Handle detect button
  const handleDetect = async () => {
    if (!selectedFile) {
      setError('Please select an image first');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.detectImage(selectedFile);
      setResult(response);
    } catch (err) {
      const errorResponse = handleApiError(err);
      setError(errorResponse.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle detect video
  const handleDetectVideo = async () => {
    if (!selectedVideoFile) {
      setError('Please select a video first');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const trimmedFile = await trimVideoSegment(selectedVideoFile, videoTrimStart, videoTrimEnd);
      if (trimmedFile.size > MAX_VIDEO_UPLOAD_BYTES) {
        throw new Error(
          'Trimmed video segment exceeds 20MB. Please choose a shorter or lower-resolution segment.'
        );
      }

      const response = await apiClient.detectVideo(trimmedFile);
      setTrimmedVideoInfo({
        name: trimmedFile.name,
        sizeBytes: trimmedFile.size,
      });
      setResult({
        ...response,
        isVideo: true,
      });
      // Use key frame as preview if available
      if (response.key_frame_base64) {
        setPreview(response.key_frame_base64);
      }
    } catch (err) {
      const errorResponse = handleApiError(err);
      setError(errorResponse.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle detect from URL
  const handleDetectFromUrl = async () => {
    setError('Detect from URL is coming soon. Please upload an image file for now.');
  };

  const clearResult = () => {
    setPreview(null);
    setVideoPreview((currentPreview) => {
      if (currentPreview) {
        URL.revokeObjectURL(currentPreview);
      }
      return null;
    });
    setSelectedFile(null);
    setSelectedVideoFile(null);
    setVideoDuration(0);
    setVideoTrimStart(0);
    setVideoTrimEnd(VIDEO_TRIM_MIN_SECONDS);
    setTrimmedVideoInfo(null);
    videoLoopEndRef.current = 0;
    setImageUrl('');
    setResult(null);
    setError(null);
  };

  useEffect(() => {
    if (activeTab === 'video' && selectedVideoFile && videoDuration > 0) {
      syncVideoPreviewToTrim(videoTrimStart, videoTrimEnd);
    }
  }, [activeTab, selectedVideoFile, videoDuration, videoTrimStart, videoTrimEnd]);

  return (
    <MainLayout>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">AI Content Detector</h1>
            <p className="text-gray-600 mb-8">
              Upload an image or provide a URL to detect if it was created by AI
            </p>

            {/* Tabs */}
            {/* Tabs */}
            <div className="flex gap-4 mb-6 border-b border-gray-200">
              <button
                onClick={() => {
                  if (activeTab !== 'upload') {
                    clearResult();
                    setActiveTab('upload');
                  }
                }}
                className={`py-2 px-4 font-semibold transition-colors ${
                  activeTab === 'upload'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Upload Image
              </button>
              <button
                onClick={() => {
                  if (activeTab !== 'video') {
                    clearResult();
                    setVideoDuration(0);
                    setVideoTrimStart(0);
                    setVideoTrimEnd(VIDEO_TRIM_MIN_SECONDS);
                    setTrimmedVideoInfo(null);
                    setActiveTab('video');
                  }
                }}
                className={`py-2 px-4 font-semibold transition-colors ${
                  activeTab === 'video'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Detect Video
              </button>
              <button
                onClick={() => {
                  if (activeTab !== 'url') {
                    clearResult();
                    setActiveTab('url');
                  }
                }}
                className={`py-2 px-4 font-semibold transition-colors ${
                  activeTab === 'url'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Image URL
              </button>
            </div>

            {/* Upload Tab */}
            {activeTab === 'upload' && (
              <>
                {!preview ? (
                  <Card className="p-8 border-2 border-dashed border-gray-300 hover:border-blue-500 cursor-pointer transition-colors">
                    <div
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      className="flex flex-col items-center justify-center gap-4"
                    >
                      <div className="p-4 bg-blue-100 rounded-full">
                        <Upload size={32} className="text-blue-600" />
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-semibold text-gray-900">
                          Drag and drop your image here
                        </p>
                        <p className="text-gray-600">or click to browse</p>
                      </div>
                      <input
                        type="file"
                        onChange={handleFileChange}
                        accept="image/*"
                        className="hidden"
                        id="file-upload"
                      />
                      <div className="mt-2">
                        <Button onClick={triggerFileInput}>Choose File</Button>
                      </div>
                      {selectedFileLabel && (
                        <p className="text-xs text-gray-500">Selected: {selectedFileLabel}</p>
                      )}
                    </div>
                  </Card>
                ) : (
                  <Card className="overflow-hidden border-0 shadow-lg ring-1 ring-gray-200">
                    <div className="relative group">
                      <div className="relative bg-gray-100 flex justify-center items-center py-4">
                        <div className="relative inline-block overflow-hidden rounded-lg shadow-2xl">
                          <img
                            src={preview}
                            alt="Preview"
                            className="block max-w-full max-h-[70vh] w-auto h-auto"
                          />
                          {result?.heatmap_base64 && (
                            <img
                              src={result.heatmap_base64}
                              alt="Heatmap Overlay"
                              className="absolute top-0 left-0 w-full h-full pointer-events-none transition-opacity duration-300"
                              style={{
                                opacity: heatmapOpacity,
                                mixBlendMode: 'multiply',
                              }}
                            />
                          )}
                        </div>
                      </div>

                      {/* Grad-CAM Overlay Controls - Only show if heatmap exists */}
                      {result?.heatmap_base64 && (
                        <div className="p-5 bg-gray-950 text-white flex flex-col md:flex-row justify-between items-center gap-6">
                          <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-600/20 rounded-2xl border border-blue-500/30 shadow-inner">
                              <Eye size={24} className="text-blue-400" />
                            </div>
                            <div>
                              <h4 className="text-base font-bold tracking-tight text-blue-50">
                                Grad-CAM Visual Analysis
                              </h4>
                              <p className="text-xs text-gray-400 font-medium">
                                Move the slider to inspect the regions most impacting the results
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-5 bg-gray-900/90 backdrop-blur-md px-5 py-3 rounded-[1.25rem] border border-white/10 w-full md:w-auto shadow-2xl">
                            <div className="flex items-center gap-4 min-w-[180px]">
                              <span className="text-xs font-black text-blue-400 uppercase tracking-[0.2em]">
                                OPACITY: {Math.round(heatmapOpacity * 100)}%
                              </span>
                              <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.01"
                                value={heatmapOpacity}
                                onChange={(e) => setHeatmapOpacity(parseFloat(e.target.value))}
                                className="w-32 h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500 hover:accent-blue-400 transition-all shadow-[0_0_15px_rgba(59,130,246,0.5)]"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Grad-CAM Legend - Only show if heatmap exists */}
                      {result?.heatmap_base64 && (
                        <div className="grid grid-cols-3 gap-3 p-3 bg-gray-950 border-t border-white/5">
                          <div className="bg-gradient-to-br from-gray-900 to-gray-950 p-2.5 rounded-xl border border-red-500/20 text-center shadow-lg group/legend">
                            <div className="text-[10px] font-black text-red-500 uppercase tracking-tighter mb-0.5 group-hover/legend:scale-110 transition-transform">
                              Red Zone
                            </div>
                            <div className="text-[9px] text-gray-500 font-medium">High Impact</div>
                          </div>
                          <div className="bg-gradient-to-br from-gray-900 to-gray-950 p-2.5 rounded-xl border border-yellow-500/20 text-center shadow-lg group/legend">
                            <div className="text-[10px] font-black text-yellow-500 uppercase tracking-tighter mb-0.5 group-hover/legend:scale-110 transition-transform">
                              Yellow Zone
                            </div>
                            <div className="text-[9px] text-gray-500 font-medium">
                              Medium Impact
                            </div>
                          </div>
                          <div className="bg-gradient-to-br from-gray-900 to-gray-950 p-2.5 rounded-xl border border-blue-500/20 text-center shadow-lg group/legend">
                            <div className="text-[10px] font-black text-blue-500 uppercase tracking-tighter mb-0.5 group-hover/legend:scale-110 transition-transform">
                              Blue Zone
                            </div>
                            <div className="text-[9px] text-gray-500 font-medium">Low Impact</div>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="p-6 flex gap-3">
                      <Button onClick={clearResult} variant="secondary" className="flex-1">
                        Change Image
                      </Button>
                      <Button
                        onClick={handleDetect}
                        loading={isLoading}
                        disabled={isLoading}
                        className="flex-1"
                      >
                        <Zap size={20} />
                        Detect Now
                      </Button>
                    </div>
                  </Card>
                )}
              </>
            )}

            {/* Video Tab */}
            {activeTab === 'video' && (
              <>
                {!videoPreview && !result ? (
                  <Card className="p-8 border-2 border-dashed border-gray-300 hover:border-blue-500 cursor-pointer transition-colors">
                    <div
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.currentTarget.classList.remove('bg-blue-50');
                        const file = e.dataTransfer.files?.[0];
                        if (file) {
                          const event = { target: { files: [file] } };
                          handleVideoFileChange(event);
                        }
                      }}
                      className="flex flex-col items-center justify-center gap-4"
                    >
                      <div className="p-4 bg-purple-100 rounded-full">
                        <Video size={32} className="text-purple-600" />
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-semibold text-gray-900">
                          Drag and drop your video here
                        </p>
                        <p className="text-gray-600">or click to browse</p>
                      </div>
                      <input
                        type="file"
                        onChange={handleVideoFileChange}
                        accept="video/*"
                        className="hidden"
                        id="video-upload"
                      />
                      <div className="mt-2">
                        <Button onClick={triggerVideoInput}>Choose Video</Button>
                      </div>
                      {selectedVideoFile && (
                        <p className="text-xs text-gray-500">Selected: {selectedVideoFile.name}</p>
                      )}
                    </div>
                  </Card>
                ) : (
                  <Card className="overflow-hidden border-0 shadow-lg ring-1 ring-gray-200">
                    <div className="relative">
                      {!result ? (
                        <div className="bg-gray-950 aspect-video flex items-center justify-center">
                          <video
                            src={videoPreview}
                            controls
                            ref={videoPlayerRef}
                            onLoadedMetadata={(event) => {
                              const duration = Number(event.currentTarget.duration || 0);
                              setVideoDuration(duration);
                              setVideoTrimStart(0);
                              setVideoTrimEnd(Math.min(duration, VIDEO_TRIM_MIN_SECONDS));
                              videoLoopEndRef.current = Math.min(duration, VIDEO_TRIM_MIN_SECONDS);
                              event.currentTarget.currentTime = 0;
                            }}
                            onTimeUpdate={(event) => {
                              const player = event.currentTarget;
                              if (
                                videoLoopEndRef.current > 0 &&
                                player.currentTime >= videoLoopEndRef.current
                              ) {
                                player.currentTime = videoTrimStart;
                                const playPromise = player.play();
                                if (playPromise && typeof playPromise.catch === 'function') {
                                  playPromise.catch(() => {
                                    // ignore autoplay restrictions while looping
                                  });
                                }
                              }
                            }}
                            onSeeked={(event) => {
                              const player = event.currentTarget;
                              if (
                                player.currentTime < videoTrimStart ||
                                player.currentTime >= videoLoopEndRef.current
                              ) {
                                player.currentTime = videoTrimStart;
                              }
                            }}
                            className="max-w-full max-h-full"
                          />
                        </div>
                      ) : (
                        <div className="relative group">
                          <div className="relative bg-gray-100 flex justify-center items-center py-4">
                            <div className="relative inline-block overflow-hidden rounded-lg shadow-2xl">
                              <img
                                src={preview}
                                alt="Key Frame Preview"
                                className="block max-w-full max-h-[70vh] w-auto h-auto"
                              />
                              {result?.heatmap_base64 && (
                                <img
                                  src={result.heatmap_base64}
                                  alt="Heatmap Overlay"
                                  className="absolute top-0 left-0 w-full h-full pointer-events-none transition-opacity duration-300"
                                  style={{
                                    opacity: heatmapOpacity,
                                    mixBlendMode: 'multiply',
                                  }}
                                />
                              )}
                            </div>
                          </div>
                          {/* XAI Controls for Video Keyframe */}
                          {result?.heatmap_base64 && (
                            <div className="p-5 bg-gray-950 text-white flex flex-col md:flex-row justify-between items-center gap-6">
                              <div className="flex items-center gap-4">
                                <div className="p-3 bg-blue-600/20 rounded-2xl border border-blue-500/30 shadow-inner">
                                  <Eye size={24} className="text-blue-400" />
                                </div>
                                <div>
                                  <h4 className="text-base font-bold tracking-tight text-blue-50">
                                    Keyframe Analysis
                                  </h4>
                                  <p className="text-xs text-gray-400 font-medium">
                                    Move the slider to inspect impacting regions on the keyframe
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-5 bg-gray-900/90 backdrop-blur-md px-5 py-3 rounded-[1.25rem] border border-white/10 w-full md:w-auto shadow-2xl">
                                <div className="flex items-center gap-4 min-w-[180px]">
                                  <span className="text-xs font-black text-blue-400 uppercase tracking-[0.2em]">
                                    OPACITY: {Math.round(heatmapOpacity * 100)}%
                                  </span>
                                  <input
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.01"
                                    value={heatmapOpacity}
                                    onChange={(e) => setHeatmapOpacity(parseFloat(e.target.value))}
                                    className="w-32 h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500 hover:accent-blue-400 transition-all shadow-[0_0_15px_rgba(59,130,246,0.5)]"
                                  />
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Grad-CAM Legend for Video - Only show if heatmap exists */}
                          {result?.heatmap_base64 && (
                            <div className="grid grid-cols-3 gap-3 p-3 bg-gray-950 border-t border-white/5">
                              <div className="bg-gradient-to-br from-gray-900 to-gray-950 p-2.5 rounded-xl border border-red-500/20 text-center shadow-lg group/legend">
                                <div className="text-[10px] font-black text-red-500 uppercase tracking-tighter mb-0.5 group-hover/legend:scale-110 transition-transform">
                                  Red Zone
                                </div>
                                <div className="text-[9px] text-gray-500 font-medium">
                                  High Impact
                                </div>
                              </div>
                              <div className="bg-gradient-to-br from-gray-900 to-gray-950 p-2.5 rounded-xl border border-yellow-500/20 text-center shadow-lg group/legend">
                                <div className="text-[10px] font-black text-yellow-500 uppercase tracking-tighter mb-0.5 group-hover/legend:scale-110 transition-transform">
                                  Yellow Zone
                                </div>
                                <div className="text-[9px] text-gray-500 font-medium">
                                  Medium Impact
                                </div>
                              </div>
                              <div className="bg-gradient-to-br from-gray-900 to-gray-950 p-2.5 rounded-xl border border-blue-500/20 text-center shadow-lg group/legend">
                                <div className="text-[10px] font-black text-blue-500 uppercase tracking-tighter mb-0.5 group-hover/legend:scale-110 transition-transform">
                                  Blue Zone
                                </div>
                                <div className="text-[9px] text-gray-500 font-medium">
                                  Low Impact
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="p-6 flex gap-3">
                      <Button onClick={clearResult} variant="secondary" className="flex-1">
                        Change Video
                      </Button>
                      {!result && (
                        <Button
                          onClick={handleDetectVideo}
                          loading={isLoading}
                          disabled={isLoading}
                          className="flex-1 bg-purple-600 hover:bg-purple-700"
                        >
                          <Zap size={20} />
                          Analyze Video
                        </Button>
                      )}
                    </div>
                    {!result && (
                      <div className="px-6 pb-6 space-y-3">
                        <div className="p-3 rounded-lg bg-purple-50 border border-purple-100 text-sm text-purple-800">
                          Choose a clip between {VIDEO_TRIM_MIN_SECONDS} and{' '}
                          {VIDEO_TRIM_MAX_SECONDS} seconds. Only the selected clip is sent for AI
                          detection. Backend accepts clips up to 20MB.
                        </div>
                        {videoDuration > 0 && (
                          <>
                            <label className="block text-sm font-semibold text-gray-700">
                              Clip range: {videoTrimStart.toFixed(1)}s - {videoTrimEnd.toFixed(1)}s
                            </label>
                            <input
                              type="range"
                              min="0"
                              max={maxTrimStart}
                              step="0.1"
                              value={videoTrimStart}
                              onChange={(event) => {
                                const nextStart = Number(event.target.value);
                                const maxAllowedEnd = Math.min(
                                  nextStart + VIDEO_TRIM_MAX_SECONDS,
                                  videoDuration
                                );
                                const nextEnd = Math.max(
                                  Math.min(videoTrimEnd, maxAllowedEnd),
                                  nextStart + VIDEO_TRIM_MIN_SECONDS
                                );
                                setVideoTrimStart(nextStart);
                                setVideoTrimEnd(nextEnd);
                                syncVideoPreviewToTrim(nextStart, nextEnd);
                              }}
                              className="w-full"
                            />
                            <input
                              type="range"
                              min={Math.min(videoTrimStart + VIDEO_TRIM_MIN_SECONDS, videoDuration)}
                              max={Math.min(videoTrimStart + VIDEO_TRIM_MAX_SECONDS, videoDuration)}
                              step="0.1"
                              value={videoTrimEnd}
                              onChange={(event) => {
                                const nextEnd = Number(event.target.value);
                                setVideoTrimEnd(nextEnd);
                                syncVideoPreviewToTrim(videoTrimStart, nextEnd);
                              }}
                              className="w-full"
                            />
                            <div className="flex justify-between text-xs text-gray-500">
                              <span>Min 5s</span>
                              <span>Max 10s</span>
                            </div>
                          </>
                        )}
                        {trimmedVideoInfo && (
                          <p className="text-xs text-gray-500">
                            Last uploaded clip: {trimmedVideoInfo.name} (
                            {(trimmedVideoInfo.sizeBytes / (1024 * 1024)).toFixed(2)} MB)
                          </p>
                        )}
                      </div>
                    )}
                  </Card>
                )}
              </>
            )}

            {/* URL Tab */}
            {activeTab === 'url' && (
              <>
                <Card className="p-6">
                  <div className="space-y-4">
                    <Input
                      label="Image URL"
                      placeholder="https://example.com/image.jpg"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      error={error && activeTab === 'url' ? error : ''}
                    />
                    <div className="flex gap-3">
                      <Button
                        onClick={() => {
                          setPreview(imageUrl);
                        }}
                        disabled={!imageUrl.trim()}
                      >
                        Preview
                      </Button>
                      <Button
                        onClick={handleDetectFromUrl}
                        loading={isLoading}
                        disabled={true}
                        className="flex-1"
                      >
                        <Sparkles size={20} />
                        Coming soon
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500">
                      URL-based detection is not wired to the backend yet. Upload an image file to
                      use the current contract.
                    </p>
                  </div>
                </Card>

                {preview && (
                  <Card className="overflow-hidden mt-4">
                    <img
                      src={preview}
                      alt="Preview"
                      className="w-full max-h-[60vh] object-contain"
                    />
                    <div className="p-6 flex gap-3">
                      <Button onClick={clearResult} variant="secondary" className="flex-1">
                        Clear Preview
                      </Button>
                      <Button
                        onClick={handleDetectFromUrl}
                        loading={isLoading}
                        disabled={true}
                        className="flex-1"
                      >
                        <Sparkles size={20} />
                        Coming soon
                      </Button>
                    </div>
                  </Card>
                )}
              </>
            )}

            {/* Error Message */}
            {error && (activeTab === 'upload' || activeTab === 'video') && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
                <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
                <p className="text-red-700">{error}</p>
              </div>
            )}

            {/* Result and Analysis */}
            {result && (
              <div className="mt-8 space-y-8">
                <ResultDisplay result={result} onClear={clearResult} />

                {/* CV Feature Analysis Section */}
                {result.cv_analysis && result.cv_analysis.length > 0 && (
                  <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-8">
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                          <BarChart3 size={24} />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-gray-900 tracking-tight">
                            CV Feature Analysis
                          </h3>
                          <p className="text-sm text-gray-500 font-medium">
                            Detailed Computer Vision auxiliary algorithms
                          </p>
                        </div>
                      </div>
                      <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-full border border-gray-100">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        <span className="text-xs font-bold text-gray-600 uppercase tracking-widest">
                          Live Analysis
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {result.cv_analysis.map((feat, idx) => {
                        const score = feat.impact_score || 0;
                        return (
                          <div key={idx} className="relative group transition-all duration-500">
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-indigo-600/20 rounded-[2rem] opacity-0 group-hover:opacity-100 blur-2xl transition-opacity duration-500 -z-10" />
                            <div className="h-full bg-gray-50/50 hover:bg-white p-8 rounded-[2rem] border border-gray-100 group-hover:border-blue-200 transition-all duration-500 flex flex-col gap-6 shadow-sm group-hover:shadow-2xl">
                              <div className="flex justify-between items-center">
                                <span className="px-4 py-1.5 bg-white text-[12px] font-black text-blue-600 rounded-xl shadow-sm uppercase tracking-widest border border-blue-50">
                                  {feat.category}
                                </span>
                                <div className="p-2.5 bg-blue-50 text-blue-500 rounded-xl">
                                  <Cpu size={24} />
                                </div>
                              </div>

                              <div className="flex flex-col gap-3">
                                <h4 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors tracking-tight">
                                  {feat.feature_name}
                                </h4>
                                <div className="flex items-center gap-4 mt-1">
                                  <div className="flex-1 bg-gray-200 h-2.5 rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                                      style={{ width: `${score}%` }}
                                    />
                                  </div>
                                  <span className="text-lg font-black text-blue-600">
                                    {Math.round(score)}%
                                  </span>
                                </div>
                              </div>

                              <p className="text-sm text-gray-600 group-hover:text-gray-700 leading-relaxed font-medium">
                                {feat.description}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="mt-8 pt-6 border-t border-gray-50 flex items-center gap-2 text-gray-400">
                      <Info size={14} />
                      <p className="text-[10px] font-medium italic">
                        These features are extracted using OpenCV and Skimage (FFT, GLCM, etc.)
                        libraries to support the CNN model.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar - Info */}
        <aside className="space-y-6">
          <Card padding="lg">
            <h3 className="text-lg font-bold text-gray-900 mb-4">How it works</h3>
            <ol className="space-y-4 text-sm text-gray-600">
              <li className="flex gap-3">
                <span className="font-bold text-blue-600">1.</span>
                <span>Upload an image or provide a URL</span>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-blue-600">2.</span>
                <span>Our AI analyzes the image using advanced techniques</span>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-blue-600">3.</span>
                <span>Get instant results with confidence percentage</span>
              </li>
            </ol>
          </Card>

          <Card padding="lg" className="bg-gradient-to-br from-blue-50 to-blue-100">
            <h3 className="text-lg font-bold text-gray-900 mb-2">💡 Pro Tips</h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li>• Clear, high-quality images work best</li>
              <li>• File size must be under 20MB</li>
              <li>• Supports JPEG, PNG, and BMP formats</li>
              <li>• Results are processed in real-time</li>
            </ul>
          </Card>

          <Card padding="lg" className="bg-gray-900 text-white">
            <h3 className="text-lg font-bold mb-3">🚀 About HyperID</h3>
            <p className="text-sm text-gray-300 leading-relaxed">
              Powered by advanced machine learning combining CNN feature extraction with computer
              vision techniques for accurate AI content detection.
            </p>
          </Card>
        </aside>
      </div>
    </MainLayout>
  );
};

/**
 * Result Display Component
 */
const ResultDisplay = ({ result, onClear }) => {
  const isAI = result.prediction?.includes('AI') || result.prediction?.includes('GENERATED');
  const confidence =
    typeof result.confidence === 'string' ? parseFloat(result.confidence) : result.confidence;

  return (
    <Card
      className={`
        p-8 border-l-8
        ${isAI ? 'border-l-red-500 bg-red-50' : 'border-l-green-500 bg-green-50'}
      `}
    >
      <div className="flex items-start gap-4 mb-6">
        <div
          className={`p-3 rounded-full ${
            isAI ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
          }`}
        >
          {isAI ? <AlertCircle size={32} /> : <CheckCircle2 size={32} />}
        </div>
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <div>
              <h3 className={`text-2xl font-bold mb-1 ${isAI ? 'text-red-900' : 'text-green-900'}`}>
                {isAI
                  ? result.isVideo
                    ? 'AI-Generated Video'
                    : 'AI-Generated Content'
                  : result.isVideo
                    ? 'Authentic Video'
                    : 'Authentic Image'}
              </h3>
              <p className={`${isAI ? 'text-red-700' : 'text-green-700'}`}>
                Confidence: {confidence.toFixed(2)}%
              </p>
            </div>
            {result.isVideo && (
              <div className="px-4 py-2 bg-white/50 rounded-xl border border-gray-200 shadow-sm">
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">
                  Consistency
                </p>
                <div className="flex items-center gap-2">
                  <Activity size={14} className="text-blue-500" />
                  <span className="text-sm font-bold text-gray-900">
                    {typeof result.consistency === 'number' ? Math.round(result.consistency) : 0}%
                  </span>
                </div>
              </div>
            )}
          </div>
          {result.message && <p className="mt-2 text-sm text-gray-600">{result.message}</p>}
        </div>
      </div>

      {/* Confidence Bar */}
      <div className="mb-6">
        <div className="w-full bg-gray-300 rounded-full h-3 overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${isAI ? 'bg-red-500' : 'bg-green-500'}`}
            style={{ width: `${confidence}%` }}
          />
        </div>
      </div>

      {/* Video Specific: Votes/Timeline */}
      {result.isVideo && result.votes && (
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="p-4 bg-white/80 rounded-2xl border border-red-100">
            <p className="text-red-500 text-[10px] font-black uppercase tracking-widest mb-1">
              AI Frames
            </p>
            <p className="text-2xl font-black text-red-600">{result.votes.AI || 0}</p>
          </div>
          <div className="p-4 bg-white/80 rounded-2xl border border-green-100">
            <p className="text-green-500 text-[10px] font-black uppercase tracking-widest mb-1">
              Real Frames
            </p>
            <p className="text-2xl font-black text-green-600">{result.votes.REAL || 0}</p>
          </div>
        </div>
      )}

      {/* Details */}
      {!result.isVideo && (
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="p-3 bg-white rounded-lg">
            <p className="text-gray-600 text-sm">AI Probability</p>
            <p className="text-lg font-bold text-gray-900">
              {(result.ai_probability || 0).toFixed(2)}%
            </p>
          </div>
          <div className="p-3 bg-white rounded-lg">
            <p className="text-gray-600 text-sm">Real Probability</p>
            <p className="text-lg font-bold text-gray-900">
              {(result.real_probability || 0).toFixed(2)}%
            </p>
          </div>
        </div>
      )}

      <Button onClick={onClear} variant="secondary" className="w-full">
        Analyze Another {result.isVideo ? 'Video' : 'Image'}
      </Button>
    </Card>
  );
};

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
  AlertCircle,
  BarChart3,
  CheckCircle2,
  Cpu,
  Eye,
  FileVideo,
  Globe2,
  Image as ImageIcon,
  Info,
  Layers3,
  Lightbulb,
  PlayCircle,
  RefreshCw,
  Scissors,
  ShieldCheck,
  Sparkles,
  Upload,
  Video,
  Zap,
} from 'lucide-react';
import { MainLayout } from '../layouts/MainLayout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Progress } from '../components/ui/Progress';
import { PageHeader } from '../components/ui/PageHeader';
import {
  formatSeconds,
  getDefaultClipRange,
  VideoClipRangeSelector,
} from '../components/VideoClipRangeSelector';
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
  const selectedClipDuration = useMemo(
    () => Math.max(0, videoTrimEnd - videoTrimStart),
    [videoTrimEnd, videoTrimStart]
  );
  const isVideoTooShort = videoDuration > 0 && videoDuration < VIDEO_TRIM_MIN_SECONDS;
  const isVideoClipValid =
    selectedVideoFile &&
    videoDuration >= VIDEO_TRIM_MIN_SECONDS &&
    selectedClipDuration >= VIDEO_TRIM_MIN_SECONDS &&
    selectedClipDuration <= VIDEO_TRIM_MAX_SECONDS &&
    videoTrimStart >= 0 &&
    videoTrimEnd <= videoDuration;

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

    if (!isVideoClipValid) {
      setError('Please choose a valid 5-10 second video clip before analysis.');
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

  const handleVideoRangeChange = ([nextStart, nextEnd]) => {
    setVideoTrimStart(nextStart);
    setVideoTrimEnd(nextEnd);
    syncVideoPreviewToTrim(nextStart, nextEnd);
  };

  const tabs = [
    { key: 'upload', label: 'Upload Image', icon: ImageIcon },
    { key: 'video', label: 'Detect Video', icon: FileVideo },
    { key: 'url', label: 'Image URL', icon: Globe2 },
  ];

  const selectTab = (tabKey) => {
    if (activeTab === tabKey) return;
    clearResult();
    if (tabKey === 'video') {
      setVideoDuration(0);
      setVideoTrimStart(0);
      setVideoTrimEnd(VIDEO_TRIM_MIN_SECONDS);
      setTrimmedVideoInfo(null);
    }
    setActiveTab(tabKey);
  };

  return (
    <MainLayout>
      <PageHeader
        badge="Image / Video / URL Analysis"
        title="AI Content Detector"
        subtitle="Upload media and inspect model confidence, Grad-CAM focus regions, and computer vision feature evidence."
      />

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="min-w-0">
          <Card className="mb-6 p-2">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => selectTab(tab.key)}
                    className={`inline-flex h-12 items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-all ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/20'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950'
                    }`}
                  >
                    <Icon size={18} />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </Card>

          {activeTab === 'upload' && (
            <>
              {!preview ? (
                <UploadDropzone
                  icon={Upload}
                  title="Drag and drop your image here"
                  subtitle="JPEG, PNG, BMP. Maximum file size 20MB."
                  inputId="file-upload"
                  accept="image/*"
                  onChange={handleFileChange}
                  onClick={triggerFileInput}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  buttonText="Choose Image"
                  selectedLabel={selectedFileLabel}
                />
              ) : (
                <AnalysisPreview
                  preview={preview}
                  result={result}
                  heatmapOpacity={heatmapOpacity}
                  setHeatmapOpacity={setHeatmapOpacity}
                  title="Grad-CAM Visual Analysis"
                  description="Move the slider to inspect regions that most influenced the result."
                  actions={
                    <>
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
                    </>
                  }
                />
              )}
            </>
          )}

          {activeTab === 'video' && (
            <>
              {!videoPreview && !result ? (
                <UploadDropzone
                  icon={Video}
                  title="Drag and drop your video here"
                  subtitle="The selected 5-10 second clip is sent for analysis. Maximum upload 20MB."
                  inputId="video-upload"
                  accept="video/*"
                  onChange={handleVideoFileChange}
                  onClick={triggerVideoInput}
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
                  buttonText="Choose Video"
                  selectedLabel={selectedVideoFile?.name}
                />
              ) : (
                <Card className="overflow-hidden p-0 shadow-lg">
                  {!result ? (
                    <>
                      <div className="border-b border-slate-200 bg-white p-5">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                          <div className="flex min-w-0 items-center gap-3">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-white">
                              <PlayCircle size={22} />
                            </div>
                            <div className="min-w-0">
                              <h2 className="text-lg font-bold text-slate-950">Video Preview</h2>
                              <p className="truncate text-sm text-slate-500">
                                {selectedVideoFile?.name || 'Selected video'}
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Badge variant="primary">
                              Duration {formatSeconds(videoDuration)}
                            </Badge>
                            <Badge variant={isVideoTooShort ? 'error' : 'success'}>
                              Clip {formatSeconds(selectedClipDuration)}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      <div className="bg-slate-950 p-4 sm:p-5">
                        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-slate-950 shadow-2xl shadow-slate-950/20">
                          <div className="absolute left-4 top-4 z-10 rounded-full border border-white/10 bg-slate-950/80 px-3 py-1 text-xs font-bold text-slate-100 backdrop-blur">
                            Selected Clip Preview
                          </div>
                          <video
                            src={videoPreview}
                            controls
                            ref={videoPlayerRef}
                            onLoadedMetadata={(event) => {
                              const duration = Number(event.currentTarget.duration || 0);
                              const [defaultStart, defaultEnd] = getDefaultClipRange({
                                duration,
                                minClipDuration: VIDEO_TRIM_MIN_SECONDS,
                                maxClipDuration: VIDEO_TRIM_MAX_SECONDS,
                              });
                              setVideoDuration(duration);
                              setVideoTrimStart(defaultStart);
                              setVideoTrimEnd(defaultEnd);
                              videoLoopEndRef.current = defaultEnd;
                              event.currentTarget.currentTime = defaultStart;
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
                            className="mx-auto aspect-video max-h-[62vh] w-full bg-slate-950 object-contain"
                          />
                        </div>
                      </div>
                    </>
                  ) : (
                    <AnalysisPreview
                      preview={preview}
                      result={result}
                      heatmapOpacity={heatmapOpacity}
                      setHeatmapOpacity={setHeatmapOpacity}
                      title="Keyframe Analysis"
                      description="Inspect the keyframe regions that influenced the video prediction."
                    />
                  )}

                  <div className="grid gap-3 border-t border-slate-200 p-5 sm:grid-cols-2">
                    <Button
                      onClick={clearResult}
                      variant="secondary"
                      size="lg"
                      className="w-full"
                      aria-label="Change selected video"
                    >
                      <RefreshCw size={18} />
                      Change Video
                    </Button>
                    {!result && (
                      <Button
                        onClick={handleDetectVideo}
                        loading={isLoading}
                        disabled={isLoading || !isVideoClipValid}
                        size="lg"
                        className="w-full"
                        aria-label="Analyze selected video clip"
                      >
                        <Zap size={20} />
                        {isLoading ? 'Analyzing Video' : 'Analyze Video'}
                      </Button>
                    )}
                  </div>

                  {!result && (
                    <div className="space-y-4 border-t border-slate-100 bg-slate-50/70 p-5">
                      <div className="grid gap-3 text-sm md:grid-cols-3">
                        <div className="rounded-2xl border border-slate-200 bg-white p-4">
                          <p className="text-xs font-bold uppercase text-slate-500">File name</p>
                          <p className="mt-1 truncate font-semibold text-slate-900">
                            {selectedVideoFile?.name || 'Video file'}
                          </p>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-white p-4">
                          <p className="text-xs font-bold uppercase text-slate-500">Range</p>
                          <p className="mt-1 font-semibold text-slate-900">
                            {formatSeconds(videoTrimStart)} - {formatSeconds(videoTrimEnd)}
                          </p>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-white p-4">
                          <p className="text-xs font-bold uppercase text-slate-500">Clip sent</p>
                          <p className="mt-1 inline-flex items-center gap-2 font-semibold text-slate-900">
                            <Scissors size={16} className="text-blue-600" />
                            {formatSeconds(selectedClipDuration)}
                          </p>
                        </div>
                      </div>
                      {videoDuration > 0 && (
                        <VideoClipRangeSelector
                          duration={videoDuration}
                          value={[videoTrimStart, videoTrimEnd]}
                          onChange={handleVideoRangeChange}
                          minClipDuration={VIDEO_TRIM_MIN_SECONDS}
                          maxClipDuration={VIDEO_TRIM_MAX_SECONDS}
                          step={0.1}
                          disabled={isLoading}
                        />
                      )}
                      {trimmedVideoInfo && (
                        <p className="text-xs text-slate-500">
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
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Button
                      onClick={() => {
                        setPreview(imageUrl);
                      }}
                      disabled={!imageUrl.trim()}
                      variant="secondary"
                    >
                      Preview
                    </Button>
                    <Button
                      onClick={handleDetectFromUrl}
                      loading={isLoading}
                      disabled={!canDetectFromUrl}
                      className="flex-1"
                    >
                      <Sparkles size={20} />
                      Coming soon
                    </Button>
                  </div>
                  <p className="text-sm text-slate-500">
                    URL-based detection is not wired to the backend yet. Upload an image file to
                    use the current contract.
                  </p>
                </div>
              </Card>

              {preview && (
                <Card className="mt-4 overflow-hidden p-0">
                  <div className="bg-slate-100 p-4">
                    <img
                      src={preview}
                      alt="Preview"
                      className="mx-auto max-h-[60vh] rounded-2xl object-contain"
                    />
                  </div>
                  <div className="flex flex-col gap-3 border-t border-slate-200 p-5 sm:flex-row">
                    <Button onClick={clearResult} variant="secondary" className="flex-1">
                      Clear Preview
                    </Button>
                    <Button
                      onClick={handleDetectFromUrl}
                      loading={isLoading}
                      disabled={!canDetectFromUrl}
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

          {error && (activeTab === 'upload' || activeTab === 'video') && (
            <div className="mt-4 flex gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4">
              <AlertCircle className="mt-0.5 flex-shrink-0 text-rose-600" size={20} />
              <p className="text-sm font-medium text-rose-700">{error}</p>
            </div>
          )}

          {result && (
            <div className="mt-8 space-y-8">
              <ResultDisplay result={result} onClear={clearResult} />

              {result.cv_analysis && result.cv_analysis.length > 0 && (
                <Card className="p-6 sm:p-8">
                  <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                        <BarChart3 size={24} />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold tracking-tight text-slate-950">
                          CV Feature Analysis
                        </h3>
                        <p className="text-sm text-slate-500">
                          Computer vision signals that support the prediction.
                        </p>
                      </div>
                    </div>
                    <Badge variant="success">Live Analysis</Badge>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">
                    {result.cv_analysis.map((feat, idx) => {
                      const score = Math.max(0, Math.min(Number(feat.impact_score || 0), 100));
                      return (
                        <div
                          key={idx}
                          className="flex h-full flex-col gap-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-5 transition-all hover:-translate-y-0.5 hover:bg-white hover:shadow-md"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <Badge variant="primary">{feat.category || 'Feature'}</Badge>
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-blue-700 shadow-sm">
                              <Cpu size={20} />
                            </div>
                          </div>
                          <div>
                            <h4 className="text-base font-bold text-slate-950">
                              {feat.feature_name}
                            </h4>
                            <div className="mt-3 flex items-center gap-3">
                              <Progress value={score} className="h-2" />
                              <span className="w-12 text-right text-sm font-bold text-blue-700">
                                {Math.round(score)}%
                              </span>
                            </div>
                          </div>
                          <p className="text-sm leading-6 text-slate-600">{feat.description}</p>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-6 flex items-start gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                    <Info size={16} className="mt-0.5 text-slate-400" />
                    <p>
                      Feature evidence is extracted from OpenCV and Skimage-style signals and should
                      be read alongside the model confidence.
                    </p>
                  </div>
                </Card>
              )}
            </div>
          )}
        </div>

        <aside className="space-y-5 xl:sticky xl:top-24 xl:self-start">
          <InfoCard
            icon={Layers3}
            title="How it works"
            items={[
              'Upload an image or video clip.',
              'HyperID extracts model and CV evidence.',
              'Review confidence, heatmaps, and feature impact.',
            ]}
          />
          <InfoCard
            icon={Lightbulb}
            title="Pro Tips"
            items={[
              'Use clear, high-quality media when possible.',
              'Keep files under 20MB.',
              'For videos, choose a representative 5-10 second segment.',
            ]}
          />
          <Card className="overflow-hidden bg-slate-950 p-6 text-white">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 shadow-lg shadow-blue-600/30">
              <ShieldCheck size={24} />
            </div>
            <h3 className="text-lg font-bold">About HyperID</h3>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              A detection dashboard combining trained models, Grad-CAM visual evidence, and CV
              feature analysis for media verification workflows.
            </p>
          </Card>
        </aside>
      </div>
    </MainLayout>
  );
};

const UploadDropzone = ({
  icon: Icon,
  title,
  subtitle,
  inputId,
  accept,
  onChange,
  onClick,
  onDragOver,
  onDragLeave,
  onDrop,
  buttonText,
  selectedLabel,
}) => (
  <Card className="border-2 border-dashed border-slate-300 bg-white p-8 transition-all hover:border-blue-400 hover:bg-blue-50/40">
    <div
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className="flex min-h-80 flex-col items-center justify-center gap-5 rounded-2xl"
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 shadow-sm">
        <Icon size={32} />
      </div>
      <div className="max-w-md text-center">
        <p className="text-xl font-bold text-slate-950">{title}</p>
        <p className="mt-2 text-sm text-slate-500">{subtitle}</p>
      </div>
      <input type="file" onChange={onChange} accept={accept} className="hidden" id={inputId} />
      <Button type="button" onClick={onClick}>
        <Upload size={18} /> {buttonText}
      </Button>
      {selectedLabel && (
        <p className="max-w-full truncate rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
          Selected: {selectedLabel}
        </p>
      )}
    </div>
  </Card>
);

const AnalysisPreview = ({
  preview,
  result,
  heatmapOpacity,
  setHeatmapOpacity,
  title,
  description,
  actions,
}) => (
  <Card className="overflow-hidden p-0">
    <div className="bg-slate-100 p-4">
      <div className="relative mx-auto inline-block max-w-full overflow-hidden rounded-2xl bg-white shadow-sm">
        <img src={preview} alt="Preview" className="block max-h-[68vh] max-w-full object-contain" />
        {result?.heatmap_base64 && (
          <img
            src={result.heatmap_base64}
            alt="Heatmap Overlay"
            className="absolute left-0 top-0 h-full w-full pointer-events-none transition-opacity duration-300"
            style={{ opacity: heatmapOpacity, mixBlendMode: 'multiply' }}
          />
        )}
      </div>
    </div>

    {result?.heatmap_base64 && (
      <div className="border-t border-slate-200 bg-white p-5">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
              <Eye size={22} />
            </div>
            <div>
              <h4 className="font-bold text-slate-950">{title}</h4>
              <p className="mt-1 text-sm text-slate-500">{description}</p>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="mb-2 flex items-center justify-between gap-4 text-xs font-bold uppercase tracking-wide text-slate-500">
              <span>Overlay opacity</span>
              <span>{Math.round(heatmapOpacity * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={heatmapOpacity}
              onChange={(e) => setHeatmapOpacity(parseFloat(e.target.value))}
              className="w-56 accent-blue-600"
            />
          </div>
        </div>
        <div className="mt-5 grid gap-2 sm:grid-cols-3">
          <Badge variant="error" className="justify-center py-2">Red Zone: high impact</Badge>
          <Badge variant="warning" className="justify-center py-2">Yellow Zone: medium impact</Badge>
          <Badge variant="primary" className="justify-center py-2">Blue Zone: low impact</Badge>
        </div>
      </div>
    )}

    {actions && <div className="flex flex-col gap-3 border-t border-slate-200 p-5 sm:flex-row">{actions}</div>}
  </Card>
);

const InfoCard = ({ icon: Icon, title, items }) => (
  <Card className="p-6">
    <div className="mb-4 flex items-center gap-3">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
        <Icon size={22} />
      </div>
      <h3 className="font-bold text-slate-950">{title}</h3>
    </div>
    <ul className="space-y-3 text-sm text-slate-600">
      {items.map((item) => (
        <li key={item} className="flex gap-3">
          <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-blue-600" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  </Card>
);

/**
 * Result Display Component
 */
const ResultDisplay = ({ result, onClear }) => {
  const isAI = result.prediction?.includes('AI') || result.prediction?.includes('GENERATED');
  const rawConfidence =
    typeof result.confidence === 'string' ? parseFloat(result.confidence) : result.confidence;
  const confidence = Math.max(0, Math.min(Number(rawConfidence || 0), 100));
  const theme = isAI
    ? {
        label: result.isVideo ? 'AI-Generated Video' : 'AI-Generated Content',
        border: 'border-rose-200',
        bg: 'bg-rose-50',
        text: 'text-rose-700',
        iconBg: 'bg-rose-100',
        bar: 'bg-rose-600',
        icon: AlertCircle,
      }
    : {
        label: result.isVideo ? 'Authentic Video' : 'Authentic Image',
        border: 'border-emerald-200',
        bg: 'bg-emerald-50',
        text: 'text-emerald-700',
        iconBg: 'bg-emerald-100',
        bar: 'bg-emerald-600',
        icon: CheckCircle2,
      };
  const StatusIcon = theme.icon;

  return (
    <Card className={`border ${theme.border} ${theme.bg} p-6 sm:p-8`}>
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex gap-4">
          <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${theme.iconBg} ${theme.text}`}>
            <StatusIcon size={30} />
          </div>
          <div>
            <Badge variant={isAI ? 'error' : 'success'}>{isAI ? 'AI signal detected' : 'Authentic signal'}</Badge>
            <h3 className="mt-3 text-2xl font-bold tracking-tight text-slate-950">{theme.label}</h3>
            <p className={`mt-1 text-sm font-medium ${theme.text}`}>
              Confidence: {confidence.toFixed(2)}%
            </p>
            {result.message && <p className="mt-2 text-sm text-slate-600">{result.message}</p>}
          </div>
        </div>

        {result.isVideo && (
          <div className="rounded-2xl border border-white/70 bg-white/70 p-4 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Consistency</p>
            <div className="mt-2 flex items-center gap-2">
              <Activity size={16} className="text-blue-600" />
              <span className="text-lg font-bold text-slate-950">
                {typeof result.consistency === 'number' ? Math.round(result.consistency) : 0}%
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="mt-6">
        <Progress value={confidence} indicatorClassName={theme.bar} className="h-3 bg-white/70" />
      </div>

      {result.isVideo && result.votes && (
        <div className="mt-6 grid grid-cols-2 gap-4">
          <MetricCard label="AI Frames" value={result.votes.AI || 0} tone="rose" />
          <MetricCard label="Real Frames" value={result.votes.REAL || 0} tone="emerald" />
        </div>
      )}

      {!result.isVideo && (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <MetricCard label="AI Probability" value={`${(result.ai_probability || 0).toFixed(2)}%`} tone="rose" />
          <MetricCard
            label="Real Probability"
            value={`${(result.real_probability || 0).toFixed(2)}%`}
            tone="emerald"
          />
        </div>
      )}

      <Button onClick={onClear} variant="secondary" className="mt-6 w-full" size="lg">
        <RefreshCw size={18} /> Analyze Another {result.isVideo ? 'Video' : 'Image'}
      </Button>
    </Card>
  );
};

const MetricCard = ({ label, value, tone }) => {
  const colors =
    tone === 'rose'
      ? 'border-rose-100 bg-white/80 text-rose-700'
      : 'border-emerald-100 bg-white/80 text-emerald-700';

  return (
    <div className={`rounded-2xl border p-4 ${colors}`}>
      <p className="text-xs font-bold uppercase tracking-wide opacity-80">{label}</p>
      <p className="mt-2 text-2xl font-bold">{value}</p>
    </div>
  );
};

import React, { useEffect, useMemo, useState } from 'react';
import { Activity, Filter, MessageSquarePlus, ImageOff, Trash2, Video } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '../layouts/MainLayout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { apiClient } from '../utils/api';
import { ROUTES } from '../constants/theme';

/**
 * HistoryPage - View detection history
 */
export const HistoryPage = () => {
  const [filter, setFilter] = useState('all'); // 'all', 'ai', 'real', 'video'
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deletingIds, setDeletingIds] = useState([]);
  const navigate = useNavigate();

  // Fetch history on mount
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setIsLoading(true);
        const response = await apiClient.getHistory();
        setHistory(response.data || response || []);
      } catch (err) {
        setError(err.message || 'Failed to fetch history');
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, []);

  const filteredHistory = useMemo(() => {
    return history.filter((item) => {
      const prediction = (item.prediction || '').toUpperCase();
      if (filter === 'ai') return prediction.includes('AI');
      if (filter === 'real') return prediction.includes('REAL');
      if (filter === 'video') return item.detectionType === 'VIDEO';
      return true;
    });
  }, [history, filter]);

  const prepareFeedback = (id) => {
    localStorage.setItem('pendingFeedbackImageId', String(id));
    navigate(ROUTES.FEEDBACK);
  };

  const normalizeConfidenceValue = (value) => {
    const numeric = Number(value || 0);
    if (Number.isNaN(numeric)) {
      return 0;
    }

    if (numeric > 0 && numeric <= 1) {
      return numeric * 100;
    }

    return numeric > 100 ? numeric / 100 : numeric;
  };

  const parseMetadata = (metadata) => {
    if (!metadata) {
      return {};
    }

    if (typeof metadata === 'object') {
      return metadata;
    }

    try {
      return JSON.parse(metadata);
    } catch {
      return {};
    }
  };

  const getCvAnalysis = (item) => {
    const metadata = parseMetadata(item.metadata);
    return Array.isArray(metadata.cv_analysis) ? metadata.cv_analysis : [];
  };

  const getVideoMetrics = (item) => {
    const metadata = parseMetadata(item.metadata);
    return {
      consistency: typeof metadata.consistency === 'number' ? metadata.consistency : null,
      votes: metadata.votes && typeof metadata.votes === 'object' ? metadata.votes : null,
    };
  };

  const formatImpactScore = (score) => {
    const numeric = Number(score || 0);
    return Number.isNaN(numeric) ? '0.00' : numeric.toFixed(2);
  };

  const handleDeleteItem = async (id) => {
    const confirmed = window.confirm('Are you sure you want to delete this history item?');
    if (!confirmed) {
      return;
    }

    try {
      setDeletingIds((current) => [...current, id]);
      await apiClient.deleteHistoryItem(id);
      setHistory((current) => current.filter((item) => item.id !== id));
    } catch (err) {
      setError(err.message || 'Failed to delete history item');
    } finally {
      setDeletingIds((current) => current.filter((itemId) => itemId !== id));
    }
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getImageUrl = (item) => {
    if (item.imageUrl) {
      return item.imageUrl;
    }
    return apiClient.getPublicDetectionImageUrl(item.storageBucket, item.storageKey);
  };

  return (
    <MainLayout>
      <div>
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Detection History</h1>
        <p className="text-gray-600 mb-8">
          View all your image and video detections and filter by result type
        </p>

        {/* Loading State */}
        {isLoading && (
          <Card className="p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
            <p className="text-gray-600">Loading history...</p>
          </Card>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <Card className="p-4 bg-red-50 border border-red-200">
            <p className="text-red-600">{error}</p>
          </Card>
        )}

        {/* Filter Buttons */}
        {!isLoading && !error && (
          <>
            <div className="flex flex-wrap gap-3 mb-8">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2 ${
                  filter === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                <Filter size={18} /> All Results ({history.length})
              </button>
              <button
                onClick={() => setFilter('ai')}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                  filter === 'ai'
                    ? 'bg-red-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                AI-Generated (
                {history.filter((i) => (i.prediction || '').toUpperCase().includes('AI')).length})
              </button>
              <button
                onClick={() => setFilter('real')}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                  filter === 'real'
                    ? 'bg-green-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                Real (
                {history.filter((i) => (i.prediction || '').toUpperCase().includes('REAL')).length})
              </button>
              <button
                onClick={() => setFilter('video')}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2 ${
                  filter === 'video'
                    ? 'bg-purple-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                <Video size={18} /> Video (
                {history.filter((i) => i.detectionType === 'VIDEO').length})
              </button>
            </div>

            {/* History List */}
            {filteredHistory.length === 0 ? (
              <Card className="p-12 text-center">
                <p className="text-gray-600 text-lg">No detections found</p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredHistory.map((item) => {
                  const prediction = item.prediction || '';
                  const isVideo = item.detectionType === 'VIDEO';
                  const isAiPrediction = prediction.toUpperCase().includes('AI');
                  const cvAnalysis = getCvAnalysis(item).slice(0, 2);
                  const videoMetrics = getVideoMetrics(item);
                  const hasVideoMetrics =
                    isVideo && (videoMetrics.consistency !== null || videoMetrics.votes);
                  const hasAnalysis = hasVideoMetrics || cvAnalysis.length > 0;

                  return (
                  <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    {/* Thumbnail/Preview */}
                    {isVideo ? (
                      <video
                        src={getImageUrl(item)}
                        className="w-full h-48 object-cover bg-gray-100"
                        controls
                      />
                    ) : (
                      <img
                        src={getImageUrl(item)}
                        alt={item.filename}
                        className="w-full h-48 object-cover"
                      />
                    )}

                    {getImageUrl(item) === '' && (
                      <div className="w-full h-48 bg-gray-100 flex items-center justify-center text-gray-500">
                        <div className="text-center">
                          {isVideo ? (
                            <Video size={28} className="mx-auto mb-2" />
                          ) : (
                            <ImageOff size={28} className="mx-auto mb-2" />
                          )}
                          <p className="text-sm">No preview available</p>
                        </div>
                      </div>
                    )}

                    {/* Content */}
                    <div className="p-4">
                      <p className="text-sm text-gray-600 truncate mb-2">{item.filename}</p>
                      <p className="text-[11px] text-gray-400 truncate mb-3">
                        {item.storageBucket ? `${item.storageBucket} / ` : ''}
                        {item.storageKey || 'No storage key'}
                      </p>

                      <div className="flex items-center justify-between mb-3">
                        <Badge
                          variant={isAiPrediction ? 'error' : 'success'}
                        >
                          {isVideo
                            ? isAiPrediction
                              ? 'AI VIDEO'
                              : 'REAL VIDEO'
                            : prediction}
                        </Badge>
                        <span className="text-sm font-semibold text-gray-900">
                          {normalizeConfidenceValue(item.confidence).toFixed(2)}%
                        </span>
                      </div>

                      <p className="text-xs text-gray-500 mb-4">{formatDate(item.timestamp)}</p>

                      {hasAnalysis && (
                        <div className="border-t border-gray-100 pt-3 mb-4 space-y-3">
                          {hasVideoMetrics && (
                            <div className="flex items-center justify-between gap-3 text-xs text-gray-600">
                              <span className="inline-flex items-center gap-1 font-semibold text-gray-700">
                                <Activity size={14} /> Video metrics
                              </span>
                              <span className="text-right">
                                {videoMetrics.consistency !== null
                                  ? `${Math.round(videoMetrics.consistency)}% consistent`
                                  : ''}
                                {videoMetrics.votes
                                  ? ` | AI ${videoMetrics.votes.AI || 0} / Real ${
                                      videoMetrics.votes.REAL || 0
                                    }`
                                  : ''}
                              </span>
                            </div>
                          )}

                          {cvAnalysis.length > 0 && (
                            <div className="space-y-2">
                              {cvAnalysis.map((feature, index) => (
                                <div key={`${item.id}-${feature.feature_name || index}`}>
                                  <div className="flex items-center justify-between gap-3 text-xs">
                                    <span className="font-semibold text-gray-700 truncate">
                                      {feature.feature_name || 'CV feature'}
                                    </span>
                                    <span className="shrink-0 text-blue-600 font-semibold">
                                      {formatImpactScore(feature.impact_score)}
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-gray-500 truncate">
                                    {feature.category || 'Analysis'}
                                  </p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Button
                          onClick={() => prepareFeedback(item.id)}
                          variant="ghost"
                          size="sm"
                          className="w-full"
                        >
                          <MessageSquarePlus size={16} /> Send feedback
                        </Button>
                        <Button
                          onClick={() => handleDeleteItem(item.id)}
                          variant="danger"
                          size="sm"
                          className="w-full"
                          disabled={deletingIds.includes(item.id)}
                        >
                          <Trash2 size={16} />{' '}
                          {deletingIds.includes(item.id) ? 'Deleting...' : 'Delete'}
                        </Button>
                      </div>
                    </div>
                  </Card>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </MainLayout>
  );
};

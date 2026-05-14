import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Filter,
  ImageOff,
  MessageSquarePlus,
  PlusCircle,
  Trash2,
  Video,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '../layouts/MainLayout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { PageHeader } from '../components/ui/PageHeader';
import { apiClient } from '../utils/api';
import { ROUTES } from '../constants/theme';

/**
 * HistoryPage - View detection history
 */
const HISTORY_PAGE_SIZE = 9;

export const HistoryPage = () => {
  const [filter, setFilter] = useState('all'); // 'all', 'ai', 'real', 'video'
  const [history, setHistory] = useState([]);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: HISTORY_PAGE_SIZE,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deletingIds, setDeletingIds] = useState([]);
  const navigate = useNavigate();

  const fetchHistory = useCallback(async (page, { showLoading = true } = {}) => {
    try {
      if (showLoading) {
        setIsLoading(true);
      }
      setError(null);

      const response = await apiClient.getHistory(page, HISTORY_PAGE_SIZE);
      const data = response.data || response || [];
      setHistory(data);
      setPagination({
        total: Number(response.total ?? data.length),
        page: Number(response.page ?? page),
        limit: Number(response.limit ?? HISTORY_PAGE_SIZE),
      });
    } catch (err) {
      setError(err.message || 'Failed to fetch history');
    } finally {
      if (showLoading) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchHistory(currentPage);
  }, [currentPage, fetchHistory]);

  const totalPages = Math.max(1, Math.ceil(pagination.total / pagination.limit));

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
      const nextTotal = Math.max(pagination.total - 1, 0);
      const nextLastPage = Math.max(1, Math.ceil(nextTotal / pagination.limit));

      if (currentPage > nextLastPage) {
        setCurrentPage(nextLastPage);
      } else {
        await fetchHistory(currentPage, { showLoading: false });
      }
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

  const filterOptions = [
    { key: 'all', label: 'All Results', count: pagination.total, icon: Filter },
    {
      key: 'ai',
      label: 'AI-Generated',
      count: history.filter((i) => (i.prediction || '').toUpperCase().includes('AI')).length,
      icon: Activity,
    },
    {
      key: 'real',
      label: 'Real',
      count: history.filter((i) => (i.prediction || '').toUpperCase().includes('REAL')).length,
      icon: ImageOff,
    },
    {
      key: 'video',
      label: 'Video',
      count: history.filter((i) => i.detectionType === 'VIDEO').length,
      icon: Video,
    },
  ];

  return (
    <MainLayout>
      <PageHeader
        badge="Detection archive"
        title="Detection History"
        subtitle="Review saved image and video scans, inspect key evidence, and submit feedback."
      >
        <Button type="button" onClick={() => navigate(ROUTES.DETECT)} size="sm">
          <PlusCircle size={17} /> New detection
        </Button>
      </PageHeader>

      {isLoading && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: HISTORY_PAGE_SIZE }).map((_, index) => (
            <div key={index} className="h-96 animate-pulse rounded-2xl bg-slate-200/70" />
          ))}
        </div>
      )}

      {error && !isLoading && (
        <Card className="border-rose-200 bg-rose-50 p-4">
          <p className="text-sm font-medium text-rose-700">{error}</p>
        </Card>
      )}

      {!isLoading && !error && (
        <>
          <div className="mb-6 flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
            {filterOptions.map((option) => {
              const Icon = option.icon;
              const isActive = filter === option.key;
              return (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => setFilter(option.key)}
                  className={`inline-flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950'
                  }`}
                >
                  <Icon size={17} />
                  {option.label} ({option.count})
                </button>
              );
            })}
          </div>

          {filteredHistory.length === 0 ? (
            <Card className="p-10 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                <ImageOff size={28} />
              </div>
              <h3 className="text-lg font-bold text-slate-950">No detections found</h3>
              <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
                There are no records for this filter on the current page. Start a new detection or
                switch filters.
              </p>
              <Button type="button" onClick={() => navigate(ROUTES.DETECT)} className="mx-auto mt-5">
                <PlusCircle size={18} /> Go to detector
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {filteredHistory.map((item) => {
                const prediction = item.prediction || '';
                const isVideo = item.detectionType === 'VIDEO';
                const isAiPrediction = prediction.toUpperCase().includes('AI');
                const cvAnalysis = getCvAnalysis(item).slice(0, 2);
                const videoMetrics = getVideoMetrics(item);
                const hasVideoMetrics =
                  isVideo && (videoMetrics.consistency !== null || videoMetrics.votes);
                const previewUrl = getImageUrl(item);

                return (
                  <Card
                    key={item.id}
                    className="group overflow-hidden p-0 transition-all hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div className="relative bg-slate-100 p-3">
                      {previewUrl ? (
                        isVideo ? (
                          <video
                            src={previewUrl}
                            className="aspect-video w-full rounded-2xl object-cover"
                            controls
                          />
                        ) : (
                          <img
                            src={previewUrl}
                            alt={item.filename}
                            className="aspect-video w-full rounded-2xl object-cover"
                          />
                        )
                      ) : (
                        <div className="flex aspect-video w-full items-center justify-center rounded-2xl bg-slate-200 text-slate-500">
                          {isVideo ? <Video size={28} /> : <ImageOff size={28} />}
                        </div>
                      )}

                      <div className="absolute left-5 top-5">
                        <Badge variant={isAiPrediction ? 'error' : 'success'}>
                          {isVideo ? (isAiPrediction ? 'AI VIDEO' : 'REAL VIDEO') : prediction}
                        </Badge>
                      </div>
                    </div>

                    <div className="space-y-4 p-5">
                      <div>
                        <div className="flex items-start justify-between gap-3">
                          <p className="min-w-0 truncate text-sm font-semibold text-slate-950">
                            {item.filename}
                          </p>
                          <span className="shrink-0 text-sm font-bold text-slate-950">
                            {normalizeConfidenceValue(item.confidence).toFixed(2)}%
                          </span>
                        </div>
                        <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
                          <CalendarDays size={14} /> {formatDate(item.timestamp)}
                        </p>
                      </div>

                      {hasVideoMetrics && (
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-semibold text-slate-700">Video metrics</span>
                            <span>
                              {videoMetrics.consistency !== null
                                ? `${Math.round(videoMetrics.consistency)}% consistent`
                                : ''}
                            </span>
                          </div>
                          {videoMetrics.votes && (
                            <p className="mt-1">
                              AI {videoMetrics.votes.AI || 0} / Real {videoMetrics.votes.REAL || 0}
                            </p>
                          )}
                        </div>
                      )}

                      {cvAnalysis.length > 0 && (
                        <div className="space-y-2">
                          {cvAnalysis.map((feature, index) => (
                            <div
                              key={`${item.id}-${feature.feature_name || index}`}
                              className="rounded-2xl border border-slate-200 bg-white p-3"
                            >
                              <div className="flex items-center justify-between gap-3 text-xs">
                                <span className="truncate font-semibold text-slate-700">
                                  {feature.feature_name || 'CV feature'}
                                </span>
                                <span className="shrink-0 font-bold text-blue-700">
                                  {formatImpactScore(feature.impact_score)}
                                </span>
                              </div>
                              <p className="mt-1 truncate text-xs text-slate-500">
                                {feature.category || 'Analysis'}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <Button
                          onClick={() => prepareFeedback(item.id)}
                          variant="secondary"
                          size="sm"
                          className="w-full"
                        >
                          <MessageSquarePlus size={16} /> Feedback
                        </Button>
                        <Button
                          onClick={() => handleDeleteItem(item.id)}
                          variant="danger"
                          size="sm"
                          className="w-full"
                          disabled={deletingIds.includes(item.id)}
                        >
                          <Trash2 size={16} />
                          {deletingIds.includes(item.id) ? 'Deleting...' : 'Delete'}
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}

          {pagination.total > pagination.limit && (
            <div className="mt-8 flex flex-col items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row">
              <p className="text-sm text-slate-500">
                Showing {(pagination.page - 1) * pagination.limit + 1}-
                {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                {pagination.total}
              </p>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={currentPage <= 1 || isLoading}
                  onClick={() => setCurrentPage((page) => Math.max(page - 1, 1))}
                >
                  <ArrowLeft size={16} /> Previous
                </Button>

                <span className="px-3 py-2 text-sm font-semibold text-slate-700">
                  Page {pagination.page} / {totalPages}
                </span>

                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={currentPage >= totalPages || isLoading}
                  onClick={() => setCurrentPage((page) => Math.min(page + 1, totalPages))}
                >
                  Next <ArrowRight size={16} />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </MainLayout>
  );
};

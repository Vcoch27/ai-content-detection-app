import React, { useState } from 'react';
import { Trash2, Filter } from 'lucide-react';
import { MainLayout } from '../layouts/MainLayout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { mockHistoryData } from '../utils/mockData';

/**
 * HistoryPage - View detection history
 */
export const HistoryPage = () => {
  const [filter, setFilter] = useState('all'); // 'all', 'ai', 'real'
  const [history, setHistory] = useState(mockHistoryData);

  const filteredHistory = history.filter((item) => {
    if (filter === 'ai') return item.prediction === 'AI-GENERATED';
    if (filter === 'real') return item.prediction === 'REAL';
    return true;
  });

  const handleDelete = (id) => {
    setHistory(history.filter((item) => item.id !== id));
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

  return (
    <MainLayout>
      <div>
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Detection History</h1>
        <p className="text-gray-600 mb-8">
          View all your image detections and filter by result type
        </p>

        {/* Filter Buttons */}
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
            AI-Generated ({history.filter((i) => i.prediction === 'AI-GENERATED').length})
          </button>
          <button
            onClick={() => setFilter('real')}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
              filter === 'real'
                ? 'bg-green-600 text-white'
                : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            Real ({history.filter((i) => i.prediction === 'REAL').length})
          </button>
        </div>

        {/* History List */}
        {filteredHistory.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-gray-600 text-lg">No detections found</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredHistory.map((item) => (
              <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                {/* Thumbnail */}
                <img
                  src={item.thumbnail}
                  alt={item.filename}
                  className="w-full h-48 object-cover"
                />

                {/* Content */}
                <div className="p-4">
                  <p className="text-sm text-gray-600 truncate mb-3">{item.filename}</p>

                  <div className="flex items-center justify-between mb-3">
                    <Badge variant={item.prediction === 'AI-GENERATED' ? 'error' : 'success'}>
                      {item.prediction}
                    </Badge>
                    <span className="text-sm font-semibold text-gray-900">{item.confidence}%</span>
                  </div>

                  <p className="text-xs text-gray-500 mb-4">{formatDate(item.timestamp)}</p>

                  <Button
                    onClick={() => handleDelete(item.id)}
                    variant="ghost"
                    size="sm"
                    className="w-full text-red-600 hover:bg-red-50"
                  >
                    <Trash2 size={16} /> Delete
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
};

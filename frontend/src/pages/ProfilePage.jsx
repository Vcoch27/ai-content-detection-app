import React, { useEffect, useState } from 'react';
import { Mail, LogOut, ShieldCheck, CalendarDays, BarChart3 } from 'lucide-react';
import { MainLayout } from '../layouts/MainLayout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Avatar } from '../components/ui/Avatar';
import { useAuth } from '../context/AuthContext';

/**
 * ProfilePage - User profile and settings
 */
export const ProfilePage = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user, refreshProfile, logout } = useAuth();

  useEffect(() => {
    const loadProfile = async () => {
      try {
        await refreshProfile();
      } catch (err) {
        setError(err.message || 'Failed to load profile');
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, []);

  const handleLogout = async () => {
    await logout();
    window.location.href = '/login';
  };

  const formatBytes = (bytes) => {
    const normalized = Number(bytes || 0);
    if (normalized <= 0) return '0 B';

    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    const power = Math.min(Math.floor(Math.log(normalized) / Math.log(1024)), units.length - 1);
    const value = normalized / (1024 ** power);
    return `${value.toFixed(power === 0 ? 0 : 2)} ${units[power]}`;
  };

  const storageUsedBytes = Number(user.storageUsedBytes || 0);
  const storageQuotaBytes = Math.max(Number(user.storageQuotaBytes || 0), 1);
  const usageRatio = Math.min(storageUsedBytes / storageQuotaBytes, 1);
  const usagePercent = Math.round(usageRatio * 100);
  const circleRadius = 56;
  const circleCircumference = 2 * Math.PI * circleRadius;
  const progressOffset = circleCircumference * (1 - usageRatio);

  const formatDate = (date) => {
    if (!date) return 'Unknown';

    return new Date(date).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
            <p className="text-gray-600">Loading profile...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error || !user) {
    return (
      <MainLayout>
        <Card className="p-4 bg-red-50 border border-red-200">
          <p className="text-red-600">{error || 'User profile not available'}</p>
        </Card>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-3xl">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Profile</h1>

        {/* Profile Card */}
        <Card className="p-8 mb-8">
          <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center mb-8">
            <Avatar src={user.avatar} size="lg" />
            <div className="flex-1">
              <h2 className="text-3xl font-bold text-gray-900">{user.displayName || user.email}</h2>
              <div className="flex items-center gap-2 text-gray-600 mt-2">
                <Mail size={18} />
                <span>{user.email}</span>
              </div>
              <div className="flex flex-wrap gap-3 mt-3 text-sm text-gray-500">
                <span className="inline-flex items-center gap-2">
                  <ShieldCheck size={16} /> {user.role || 'USER'}
                </span>
                <span className="inline-flex items-center gap-2">
                  <CalendarDays size={16} /> Member since {formatDate(user.createdAt)}
                </span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-gray-200">
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-600">{user.totalDetections}</p>
              <p className="text-sm text-gray-600 mt-1">Total Detections</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-red-600">{user.aiDetections}</p>
              <p className="text-sm text-gray-600 mt-1">AI-Generated</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">{user.realDetections}</p>
              <p className="text-sm text-gray-600 mt-1">Real Images</p>
            </div>
          </div>
        </Card>

        {/* Settings */}
        <Card className="p-8">
          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <BarChart3 size={20} /> Detection Summary
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-semibold text-gray-900">Total detections</p>
                <p className="text-sm text-gray-600">All scans made by this account</p>
              </div>
              <span className="font-bold text-blue-600">{user.totalDetections}</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-semibold text-gray-900">AI-generated results</p>
                <p className="text-sm text-gray-600">Predictions classified as AI</p>
              </div>
              <span className="font-bold text-red-600">{user.aiDetections}</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-semibold text-gray-900">Real-image results</p>
                <p className="text-sm text-gray-600">Predictions classified as real</p>
              </div>
              <span className="font-bold text-green-600">{user.realDetections}</span>
            </div>

            <div className="p-5 bg-gray-50 rounded-lg">
              <p className="font-semibold text-gray-900 mb-4">Storage quota usage</p>
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="relative w-36 h-36 mx-auto sm:mx-0">
                  <svg viewBox="0 0 140 140" className="w-36 h-36 -rotate-90">
                    <circle
                      cx="70"
                      cy="70"
                      r={circleRadius}
                      stroke="#e5e7eb"
                      strokeWidth="12"
                      fill="none"
                    />
                    <circle
                      cx="70"
                      cy="70"
                      r={circleRadius}
                      stroke={usagePercent >= 90 ? '#dc2626' : '#2563eb'}
                      strokeWidth="12"
                      fill="none"
                      strokeLinecap="round"
                      strokeDasharray={circleCircumference}
                      strokeDashoffset={progressOffset}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold text-gray-900">{usagePercent}%</span>
                    <span className="text-xs text-gray-500">USED</span>
                  </div>
                </div>

                <div className="flex-1 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Used</span>
                    <span className="font-semibold text-gray-900">{formatBytes(storageUsedBytes)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Limit</span>
                    <span className="font-semibold text-gray-900">{formatBytes(storageQuotaBytes)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Remaining</span>
                    <span className="font-semibold text-gray-900">
                      {formatBytes(Math.max(storageQuotaBytes - storageUsedBytes, 0))}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Logout */}
        <div className="mt-8">
          <Button onClick={handleLogout} variant="danger" className="w-full" size="lg">
            <LogOut size={20} /> Logout
          </Button>
        </div>
      </div>
    </MainLayout>
  );
};

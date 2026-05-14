import React, { useEffect, useState } from 'react';
import {
  BarChart3,
  CalendarDays,
  Database,
  Image,
  LogOut,
  Mail,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { MainLayout } from '../layouts/MainLayout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Avatar } from '../components/ui/Avatar';
import { Progress } from '../components/ui/Progress';
import { PageHeader } from '../components/ui/PageHeader';
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
    const value = normalized / 1024 ** power;
    return `${value.toFixed(power === 0 ? 0 : 2)} ${units[power]}`;
  };

  const storageUsedBytes = Number(user?.storageUsedBytes || 0);
  const storageQuotaBytes = Math.max(Number(user?.storageQuotaBytes || 0), 1);
  const usageRatio = Math.min(storageUsedBytes / storageQuotaBytes, 1);
  const usagePercent = Math.round(usageRatio * 100);

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
        <div className="grid gap-4 md:grid-cols-3">
          {[0, 1, 2].map((item) => (
            <div key={item} className="h-36 animate-pulse rounded-2xl bg-slate-200/70" />
          ))}
        </div>
      </MainLayout>
    );
  }

  if (error || !user) {
    return (
      <MainLayout>
        <Card className="border-rose-200 bg-rose-50 p-4">
          <p className="text-rose-700">{error || 'User profile not available'}</p>
        </Card>
      </MainLayout>
    );
  }

  const stats = [
    {
      label: 'Total detections',
      value: user.totalDetections || 0,
      icon: BarChart3,
      color: 'text-blue-700',
      bg: 'bg-blue-50',
    },
    {
      label: 'AI-generated',
      value: user.aiDetections || 0,
      icon: Sparkles,
      color: 'text-rose-700',
      bg: 'bg-rose-50',
    },
    {
      label: 'Real images',
      value: user.realDetections || 0,
      icon: Image,
      color: 'text-emerald-700',
      bg: 'bg-emerald-50',
    },
  ];

  return (
    <MainLayout>
      <PageHeader
        badge="Account dashboard"
        title="Profile"
        subtitle="Review your detection activity, account details, and storage quota."
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
        <div className="space-y-6">
          <Card className="overflow-hidden p-0">
            <div className="h-28 bg-gradient-to-r from-blue-600 via-indigo-600 to-slate-900" />
            <div className="p-6 sm:p-8">
              <div className="-mt-20 flex flex-col gap-5 sm:flex-row sm:items-end">
                <Avatar src={user.avatar} size="xl" className="h-28 w-28 ring-4 ring-white" />
                <div className="min-w-0 flex-1 pt-2 sm:pt-0">
                  <h2 className="truncate text-3xl font-bold tracking-tight text-slate-950">
                    {user.displayName || user.email}
                  </h2>
                  <div className="mt-2 flex items-center gap-2 text-sm text-slate-600">
                    <Mail size={16} />
                    <span className="truncate">{user.email}</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <ShieldCheck size={16} /> Role
                  </p>
                  <p className="mt-1 text-lg font-bold text-slate-950">{user.role || 'USER'}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <CalendarDays size={16} /> Member since
                  </p>
                  <p className="mt-1 text-lg font-bold text-slate-950">
                    {formatDate(user.createdAt)}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          <div className="grid gap-4 sm:grid-cols-3">
            {stats.map((stat) => (
              <Card key={stat.label} className="p-5">
                <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-2xl ${stat.bg} ${stat.color}`}>
                  <stat.icon size={22} />
                </div>
                <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
                <p className="mt-1 text-sm font-medium text-slate-500">{stat.label}</p>
              </Card>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <Card className="p-6">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                <Database size={22} />
              </div>
              <div>
                <h3 className="font-bold text-slate-950">Storage quota</h3>
                <p className="text-sm text-slate-500">Stored media used by detection history.</p>
              </div>
            </div>

            <div className="mb-4 flex items-end justify-between">
              <div>
                <p className="text-3xl font-bold text-slate-950">{usagePercent}%</p>
                <p className="text-sm text-slate-500">used</p>
              </div>
              <p className="text-sm font-semibold text-slate-600">
                {formatBytes(storageUsedBytes)} / {formatBytes(storageQuotaBytes)}
              </p>
            </div>
            <Progress
              value={usagePercent}
              indicatorClassName={usagePercent >= 90 ? 'bg-rose-600' : 'bg-blue-600'}
            />
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-2xl bg-slate-50 p-3">
                <p className="text-slate-500">Remaining</p>
                <p className="font-bold text-slate-950">
                  {formatBytes(Math.max(storageQuotaBytes - storageUsedBytes, 0))}
                </p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-3">
                <p className="text-slate-500">Limit</p>
                <p className="font-bold text-slate-950">{formatBytes(storageQuotaBytes)}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="mb-4 flex items-center gap-2 font-bold text-slate-950">
              <BarChart3 size={19} /> Detection summary
            </h3>
            <div className="space-y-3">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4"
                >
                  <span className="text-sm font-medium text-slate-600">{stat.label}</span>
                  <span className={`text-lg font-bold ${stat.color}`}>{stat.value}</span>
                </div>
              ))}
            </div>
          </Card>

          <Button onClick={handleLogout} variant="danger" className="w-full" size="lg">
            <LogOut size={20} /> Logout
          </Button>
        </div>
      </div>
    </MainLayout>
  );
};

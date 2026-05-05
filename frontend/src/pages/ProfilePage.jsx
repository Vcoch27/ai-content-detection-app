import React, { useState } from 'react';
import { Mail, Edit2, LogOut } from 'lucide-react';
import { MainLayout } from '../layouts/MainLayout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Avatar } from '../components/ui/Avatar';
import { mockUserProfile } from '../utils/mockData';

/**
 * ProfilePage - User profile and settings
 */
export const ProfilePage = () => {
  const [user, setUser] = useState(mockUserProfile);
  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState(user);

  const handleSave = () => {
    setUser(editedUser);
    setIsEditing(false);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <MainLayout>
      <div className="max-w-3xl">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Profile</h1>

        {/* Profile Card */}
        <Card className="p-8 mb-8">
          <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center mb-8">
            <Avatar src={user.avatar} size="lg" />
            <div className="flex-1">
              <h2 className="text-3xl font-bold text-gray-900">{user.username}</h2>
              <div className="flex items-center gap-2 text-gray-600 mt-2">
                <Mail size={18} />
                <span>{user.email}</span>
              </div>
              <p className="text-sm text-gray-500 mt-3">
                Member since {formatDate(user.joinedDate)}
              </p>
            </div>
            <Button
              onClick={() => setIsEditing(!isEditing)}
              variant={isEditing ? 'secondary' : 'primary'}
            >
              <Edit2 size={18} />
              {isEditing ? 'Cancel' : 'Edit Profile'}
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 pt-6 border-t border-gray-200">
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-600">{user.totalDetections}</p>
              <p className="text-sm text-gray-600 mt-1">Total Detections</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">
                {Math.floor(user.totalDetections * 0.7)}
              </p>
              <p className="text-sm text-gray-600 mt-1">Accurate Results</p>
            </div>
          </div>
        </Card>

        {/* Edit Form */}
        {isEditing && (
          <Card className="p-8 mb-8 border-blue-200">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Edit Profile</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-2">Username</label>
                <input
                  type="text"
                  value={editedUser.username}
                  onChange={(e) => setEditedUser({ ...editedUser, username: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border-2 border-gray-200 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-2">Email</label>
                <input
                  type="email"
                  value={editedUser.email}
                  onChange={(e) => setEditedUser({ ...editedUser, email: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border-2 border-gray-200 focus:border-blue-500"
                />
              </div>
              <div className="flex gap-3">
                <Button onClick={handleSave} className="flex-1">
                  Save Changes
                </Button>
                <Button
                  onClick={() => {
                    setEditedUser(user);
                    setIsEditing(false);
                  }}
                  variant="secondary"
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Settings */}
        <Card className="p-8">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Settings</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-semibold text-gray-900">Notifications</p>
                <p className="text-sm text-gray-600">Get alerts for new features</p>
              </div>
              <input type="checkbox" defaultChecked className="w-5 h-5" />
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-semibold text-gray-900">Dark Mode</p>
                <p className="text-sm text-gray-600">Coming soon</p>
              </div>
              <input type="checkbox" disabled className="w-5 h-5" />
            </div>
          </div>
        </Card>

        {/* Logout */}
        <div className="mt-8">
          <Button variant="danger" className="w-full" size="lg">
            <LogOut size={20} /> Logout
          </Button>
        </div>
      </div>
    </MainLayout>
  );
};

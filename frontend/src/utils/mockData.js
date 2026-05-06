/**
 * Mock Data for Development
 * Simulates API responses and database records
 */

export const mockDetectionResult = {
  status: 'success',
  prediction: 'AI-GENERATED',
  confidence: 87.45,
  ai_probability: 87.45,
  real_probability: 12.55,
  filename: 'sample_image.jpg',
  timestamp: new Date().toISOString(),
};

export const mockHistoryData = [
  {
    id: 1,
    filename: 'sunset_beach.jpg',
    prediction: 'REAL',
    confidence: 92.3,
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    thumbnail: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e',
  },
  {
    id: 2,
    filename: 'ai_generated_landscape.jpg',
    prediction: 'AI-GENERATED',
    confidence: 85.7,
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    thumbnail: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4',
  },
  {
    id: 3,
    filename: 'portrait_photo.jpg',
    prediction: 'REAL',
    confidence: 88.9,
    timestamp: new Date(Date.now() - 10800000).toISOString(),
    thumbnail: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d',
  },
  {
    id: 4,
    filename: 'digital_art.jpg',
    prediction: 'AI-GENERATED',
    confidence: 91.2,
    timestamp: new Date(Date.now() - 14400000).toISOString(),
    thumbnail: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97',
  },
  {
    id: 5,
    filename: 'nature_photo.jpg',
    prediction: 'REAL',
    confidence: 89.5,
    timestamp: new Date(Date.now() - 18000000).toISOString(),
    thumbnail: 'https://images.unsplash.com/photo-1519904981063-b0cf448d479e',
  },
];

export const mockUserProfile = {
  id: 'user_123',
  email: 'user@example.com',
  username: 'John Doe',
  avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d',
  totalDetections: 127,
  joinedDate: '2024-01-15',
};

export const mockFeedbackMessages = [
  {
    id: 1,
    imageId: 1,
    isCorrect: true,
    message: 'Kết quả chính xác!',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 2,
    imageId: 2,
    isCorrect: false,
    message: 'Hình ảnh này không phải AI',
    timestamp: new Date(Date.now() - 7200000).toISOString(),
  },
];

/**
 * Mock API function - Simulate network delay
 */
export const simulateAPICall = (data, delay = 2000) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(data);
    }, delay);
  });
};

import React, { useEffect, useState } from 'react';
import { Send, CheckCircle2 } from 'lucide-react';
import { MainLayout } from '../layouts/MainLayout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { apiClient } from '../utils/api';

/**
 * FeedbackPage - Send feedback about detection results
 */
export const FeedbackPage = () => {
  const [imageId, setImageId] = useState('');
  const [isCorrect, setIsCorrect] = useState(true);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const pendingImageId = localStorage.getItem('pendingFeedbackImageId');
    if (pendingImageId) {
      setImageId(pendingImageId);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const parsedImageId = Number(imageId);
    if (!Number.isInteger(parsedImageId) || parsedImageId <= 0) {
      setError('Detection ID must be a valid number');
      return;
    }

    setIsLoading(true);

    try {
      const feedback = {
        imageId: parsedImageId,
        isCorrect,
        message,
      };

      await apiClient.submitFeedback(feedback);
      setSubmitted(true);
      setImageId('');
      setMessage('');
      setIsCorrect(true);
      localStorage.removeItem('pendingFeedbackImageId');

      setTimeout(() => setSubmitted(false), 3000);
    } catch (err) {
      setError(err.message || 'Failed to submit feedback');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Send Feedback</h1>
        <p className="text-gray-600 mb-8">
          Help us improve by telling us if our detection was correct or incorrect
        </p>

        <Card className="p-8">
          {submitted && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
              <CheckCircle2 size={24} className="text-green-600" />
              <div>
                <p className="font-semibold text-green-900">Thank you!</p>
                <p className="text-green-700 text-sm">
                  Your feedback helps us improve our AI model
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Image ID */}
            <Input
              label="Detection ID"
              placeholder="Enter the numeric detection ID"
              value={imageId}
              onChange={(e) => setImageId(e.target.value)}
              required
            />
            <p className="text-xs text-gray-500 -mt-3">
              You can open this form from History to prefill the detection ID.
            </p>

            {/* Correct/Incorrect Toggle */}
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-4">
                Was the result correct?
              </label>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setIsCorrect(true)}
                  className={`flex-1 py-3 rounded-lg font-semibold transition-colors ${
                    isCorrect
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  ✓ Correct
                </button>
                <button
                  type="button"
                  onClick={() => setIsCorrect(false)}
                  className={`flex-1 py-3 rounded-lg font-semibold transition-colors ${
                    !isCorrect
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  ✗ Incorrect
                </button>
              </div>
            </div>

            {/* Message */}
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-2">
                Additional Comments (optional)
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Tell us more about your feedback..."
                rows={6}
                className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:outline-none resize-none"
              />
              <p className="text-xs text-gray-500 mt-2">{message.length}/500</p>
            </div>

            {/* Submit Button */}
            <Button type="submit" loading={isLoading} disabled={isLoading} className="w-full">
              <Send size={20} /> Submit Feedback
            </Button>
          </form>
        </Card>

        {/* Info Card */}
        <Card className="mt-8 p-6 bg-blue-50">
          <h3 className="font-semibold text-gray-900 mb-3">💡 Why your feedback matters</h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li>• Helps us identify and fix false positives/negatives</li>
            <li>• Improves the AI model accuracy over time</li>
            <li>• Contributes to the global fight against AI-generated misinformation</li>
          </ul>
        </Card>
      </div>
    </MainLayout>
  );
};

import React, { useEffect, useState } from 'react';
import { Check, CheckCircle2, MessageSquareHeart, Send, X } from 'lucide-react';
import { MainLayout } from '../layouts/MainLayout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { PageHeader } from '../components/ui/PageHeader';
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
      <PageHeader
        badge="Feedback loop"
        title="Send Feedback"
        subtitle="Tell us whether a detection was correct so the review workflow can keep improving."
      />

      <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[1fr_0.8fr]">
        <Card className="p-6 sm:p-8">
          {submitted && (
            <div className="mb-6 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
              <CheckCircle2 size={24} className="mt-0.5 text-emerald-600" />
              <div>
                <p className="font-semibold text-emerald-900">Thank you.</p>
                <p className="text-sm text-emerald-700">
                  Your feedback was submitted and linked to the detection record.
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 p-4">
              <p className="text-sm font-medium text-rose-700">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Input
                label="Detection ID"
                placeholder="Enter the numeric detection ID"
                value={imageId}
                onChange={(e) => setImageId(e.target.value)}
                required
              />
              <p className="mt-2 text-sm text-slate-500">
                Opening feedback from History will prefill this value.
              </p>
            </div>

            <div>
              <label className="mb-3 block text-sm font-semibold text-slate-700">
                Was the result correct?
              </label>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setIsCorrect(true)}
                  className={`flex min-h-20 items-center gap-3 rounded-2xl border p-4 text-left transition-all ${
                    isCorrect
                      ? 'border-emerald-300 bg-emerald-50 text-emerald-800 shadow-sm'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm">
                    <Check size={20} />
                  </span>
                  <span>
                    <span className="block font-semibold">Correct</span>
                    <span className="text-sm opacity-80">The result matched my review.</span>
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsCorrect(false)}
                  className={`flex min-h-20 items-center gap-3 rounded-2xl border p-4 text-left transition-all ${
                    !isCorrect
                      ? 'border-rose-300 bg-rose-50 text-rose-800 shadow-sm'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm">
                    <X size={20} />
                  </span>
                  <span>
                    <span className="block font-semibold">Incorrect</span>
                    <span className="text-sm opacity-80">The model needs correction.</span>
                  </span>
                </button>
              </div>
            </div>

            <div>
              <Textarea
                label="Additional comments"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Share useful context such as visual artifacts, source type, or why the result looked wrong."
                rows={6}
                maxLength={500}
              />
              <div className="mt-2 flex justify-end text-sm text-slate-500">{message.length}/500</div>
            </div>

            <Button type="submit" loading={isLoading} disabled={isLoading} className="w-full" size="lg">
              <Send size={20} /> Submit Feedback
            </Button>
          </form>
        </Card>

        <Card className="h-fit border-blue-100 bg-blue-50/70 p-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-sm">
              <MessageSquareHeart size={22} />
            </div>
            <div>
              <h3 className="font-bold text-slate-950">Why feedback matters</h3>
              <p className="text-sm text-slate-600">A small note improves future review quality.</p>
            </div>
          </div>
          <ul className="space-y-3 text-sm text-slate-700">
            <li className="rounded-2xl bg-white/70 p-3">Flags false positives and false negatives.</li>
            <li className="rounded-2xl bg-white/70 p-3">Creates a clearer audit trail for your detections.</li>
            <li className="rounded-2xl bg-white/70 p-3">Helps compare model confidence with human judgment.</li>
          </ul>
        </Card>
      </div>
    </MainLayout>
  );
};

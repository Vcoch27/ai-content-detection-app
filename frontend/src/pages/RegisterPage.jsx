import React, { useEffect, useState } from 'react';
import { Eye, EyeOff, ShieldCheck, UserPlus } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useAuth } from '../context/AuthContext';
import { ROUTES } from '../constants/theme';

export const RegisterPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { register, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate(ROUTES.DETECT, { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!email || !password || !confirmPassword) {
      setError('Please fill in all required fields');
      setIsLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    try {
      await register({ email, password, confirmPassword });
      navigate(ROUTES.DETECT, { replace: true });
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const passwordInputClass =
    'h-11 w-full rounded-xl border border-slate-200 bg-white px-4 pr-11 text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none';

  return (
    <div className="min-h-screen bg-slate-950 p-4">
      <div className="mx-auto grid min-h-[calc(100vh-2rem)] w-full max-w-6xl overflow-hidden rounded-[2rem] border border-white/10 bg-white shadow-2xl lg:grid-cols-[0.95fr_1.05fr]">
        <div className="flex items-center justify-center bg-slate-50 p-6 sm:p-10">
          <div className="w-full max-w-md">
            <div className="mb-8 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
                <UserPlus size={28} />
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-950">Create account</h1>
              <p className="mt-2 text-sm text-slate-500">
                Start building a trusted detection history with HyperID.
              </p>
            </div>

            <Card className="p-6 sm:p-8" shadow="lg">
              {error && (
                <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                  {error}
                </div>
              )}

              <form onSubmit={handleRegister} className="space-y-5">
                <Input
                  label="Email Address"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />

                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-slate-700">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Create a password"
                      className={passwordInputClass}
                      required
                    />
                    <button
                      type="button"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-700"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-slate-700">Confirm Password</label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat your password"
                      className={passwordInputClass}
                      required
                    />
                    <button
                      type="button"
                      aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-700"
                    >
                      {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  loading={isLoading}
                  disabled={isLoading}
                  className="w-full"
                  size="lg"
                >
                  <UserPlus size={20} /> Create Account
                </Button>
              </form>

              <div className="mt-6 border-t border-slate-200 pt-6 text-center text-sm text-slate-600">
                Already have an account?{' '}
                <Link to={ROUTES.LOGIN} className="font-semibold text-blue-600 hover:underline">
                  Back to sign in
                </Link>
              </div>
            </Card>
          </div>
        </div>

        <div className="relative hidden bg-slate-950 p-10 text-white lg:block">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_20%,rgba(79,70,229,0.35),transparent_30rem)]" />
          <div className="relative flex h-full flex-col justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 shadow-lg shadow-blue-600/30">
                <ShieldCheck size={26} />
              </div>
              <div>
                <p className="text-lg font-bold tracking-tight">HyperID AI Detector</p>
                <p className="text-sm text-slate-400">Model-assisted media verification</p>
              </div>
            </div>

            <div>
              <h2 className="max-w-lg text-4xl font-bold tracking-tight">
                Evidence-led AI content detection for images and video.
              </h2>
              <p className="mt-4 max-w-md text-sm leading-6 text-slate-300">
                Keep detection records, review model confidence, and send feedback that improves
                the review workflow.
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-5 text-sm text-slate-200">
              Secure dashboard, clear visual analysis, and storage-aware history in one place.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

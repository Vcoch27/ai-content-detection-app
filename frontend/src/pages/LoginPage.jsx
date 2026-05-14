import React, { useState } from 'react';
import { Eye, EyeOff, LogIn, ShieldCheck, Sparkles } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useAuth } from '../context/AuthContext';
import { ROUTES } from '../constants/theme';

/**
 * LoginPage - Authentication page
 */
export const LoginPage = () => {
  const [email, setEmail] = useState('demo@example.com');
  const [password, setPassword] = useState('demo123');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!email || !password) {
      setError('Please enter both email and password');
      setIsLoading(false);
      return;
    }

    try {
      await login(email, password);
      navigate(ROUTES.DETECT, { replace: true });
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 p-4 text-slate-950">
      <div className="mx-auto grid min-h-[calc(100vh-2rem)] w-full max-w-6xl overflow-hidden rounded-[2rem] border border-white/10 bg-white shadow-2xl lg:grid-cols-[1.05fr_0.95fr]">
        <div className="relative hidden bg-slate-950 p-10 text-white lg:block">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_15%,rgba(37,99,235,0.35),transparent_32rem)]" />
          <div className="relative flex h-full flex-col justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 shadow-lg shadow-blue-600/30">
                <ShieldCheck size={26} />
              </div>
              <div>
                <p className="text-lg font-bold tracking-tight">HyperID AI Detector</p>
                <p className="text-sm text-slate-400">Computer vision evidence platform</p>
              </div>
            </div>

            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-400/30 bg-blue-400/10 px-3 py-1 text-sm text-blue-100">
                <Sparkles size={15} /> AI / Security / Visual Forensics
              </div>
              <h2 className="max-w-lg text-4xl font-bold tracking-tight">
                Detect synthetic media with confidence, evidence, and history.
              </h2>
              <p className="mt-4 max-w-md text-sm leading-6 text-slate-300">
                Upload images or videos, inspect Grad-CAM focus regions, and track detection
                outcomes from a clean dashboard.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 text-sm">
              {['Grad-CAM', 'CV features', 'Feedback loop'].map((item) => (
                <div key={item} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center bg-slate-50 p-6 sm:p-10">
          <div className="w-full max-w-md">
            <div className="mb-8 text-center lg:hidden">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
                <ShieldCheck size={28} />
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-950">HyperID</h1>
              <p className="mt-1 text-sm text-slate-500">AI Content Detection Dashboard</p>
            </div>

            <Card className="p-6 sm:p-8" shadow="lg">
              <div className="mb-6">
                <p className="text-sm font-semibold text-blue-700">Welcome back</p>
                <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">
                  Sign in to continue
                </h2>
                <p className="mt-2 text-sm text-slate-500">
                  Access detection history, feedback, and profile insights.
                </p>
              </div>

              {error && (
                <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                  {error}
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-5">
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
                      placeholder="Enter your password"
                      className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 pr-11 text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none"
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

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="remember"
                    className="h-4 w-4 rounded border-slate-300 text-blue-600"
                  />
                  <label htmlFor="remember" className="text-sm text-slate-600">
                    Remember me
                  </label>
                </div>

                <Button
                  type="submit"
                  loading={isLoading}
                  disabled={isLoading}
                  className="w-full"
                  size="lg"
                >
                  <LogIn size={20} /> Sign In
                </Button>
              </form>

              <div className="my-6 h-px bg-slate-200" />

              <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm text-slate-700">
                <p className="font-semibold text-slate-900">Demo credentials</p>
                <p className="mt-1">Email: demo@example.com</p>
                <p>Password: demo123</p>
              </div>
            </Card>

            <div className="mt-6 text-center text-sm text-slate-600">
              <p>
                Don't have an account?{' '}
                <Link to={ROUTES.REGISTER} className="font-semibold text-blue-600 hover:underline">
                  Sign up
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

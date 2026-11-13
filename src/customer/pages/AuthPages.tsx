import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  signInWithGoogle,
  signInWithEmail,
  registerWithEmail,
  requestPasswordReset,
} from '../../services/authService';
import { useAuth } from '../../shared/contexts/AuthContext';
import { useToast } from '../../shared/contexts/ToastContext';
import { getReadableErrorMessage } from '../../shared/utils';

export default function AuthPages({ mode }: { mode: 'login' | 'register' | 'reset' }) {
  const { refreshAuth } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const handleGoogle = async () => {
    try {
      setBusy(true);
      await signInWithGoogle();
      const adminOk = await refreshAuth();
      showToast('Signed in with Google', 'success');
      navigate(adminOk ? '/admin' : '/');
    } catch (err) {
      showToast(getReadableErrorMessage(err), 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setBusy(true);
      if (mode === 'login') {
        await signInWithEmail(email, password);
        const adminOk = await refreshAuth();
        showToast('Signed in successfully', 'success');
        navigate(adminOk ? '/admin' : '/');
      } else if (mode === 'register') {
        await registerWithEmail(name, email, password);
        await refreshAuth();
        showToast('Account created', 'success');
        navigate('/');
      } else {
        await requestPasswordReset(email);
        showToast('Password reset email sent if account exists.', 'info');
        navigate('/login');
      }
    } catch (err) {
      showToast(getReadableErrorMessage(err), 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-md py-8">
      <div className="rounded-2xl border border-slate-200 bg-white p-7 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {mode === 'login'
              ? 'Sign In to MultiMart BD'
              : mode === 'register'
                ? 'Create Your Account'
                : 'Reset Password'}
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Shop, track orders, or manage your vendor storefront.
          </p>
        </div>

        {mode !== 'reset' && (
          <>
            <button
              type="button"
              disabled={busy}
              onClick={() => void handleGoogle()}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-50"
            >
              Continue with Google
            </button>

            <div className="flex items-center gap-3 text-xs text-slate-400">
              <div className="h-px flex-1 bg-slate-200" />
              <span>or use email</span>
              <div className="h-px flex-1 bg-slate-200" />
            </div>
          </>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full Name"
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm"
            />
          )}
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email Address"
            className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm"
          />
          {mode !== 'reset' && (
            <input
              required
              minLength={6}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password (min 6 characters)"
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm"
            />
          )}
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {busy
              ? 'Please wait...'
              : mode === 'login'
                ? 'Sign In'
                : mode === 'register'
                  ? 'Create Account'
                  : 'Send Reset Link'}
          </button>
        </form>

        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
          {mode === 'login' ? (
            <>
              <Link to="/register" className="font-semibold text-emerald-700 hover:underline">
                Create an account
              </Link>
              <Link to="/reset-password" className="hover:underline">
                Forgot password?
              </Link>
            </>
          ) : (
            <Link to="/login" className="font-semibold text-emerald-700 hover:underline">
              Back to Sign In
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

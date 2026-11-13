import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../shared/contexts/AuthContext';
import { useToast } from '../../shared/contexts/ToastContext';
import {
  BOOTSTRAP_ADMIN_EMAIL,
  sendVerificationEmailToCurrentUser,
  signInWithGoogle,
  signInWithEmail,
} from '../../services/authService';
import { getReadableErrorMessage } from '../../shared/utils';

export default function AdminLoginPage() {
  const { firebaseUser, isAdmin, loading, refreshAuth, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const isOwnerEmailUnverified = Boolean(
    firebaseUser &&
      firebaseUser.email?.trim().toLowerCase() === BOOTSTRAP_ADMIN_EMAIL &&
      !firebaseUser.emailVerified
  );

  useEffect(() => {
    if (!loading && firebaseUser && isAdmin) {
      navigate('/admin', { replace: true });
    }
  }, [loading, firebaseUser, isAdmin, navigate]);

  const handleGoogle = async () => {
    try {
      setBusy(true);
      await signInWithGoogle();
      const adminOk = await refreshAuth();
      if (adminOk) {
        navigate('/admin', { replace: true });
      }
    } catch (err) {
      showToast(getReadableErrorMessage(err), 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setBusy(true);
      await signInWithEmail(email, password);
      const adminOk = await refreshAuth();
      if (adminOk) {
        navigate('/admin', { replace: true });
      }
    } catch (err) {
      showToast(getReadableErrorMessage(err), 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleSendVerification = async () => {
    try {
      setBusy(true);
      await sendVerificationEmailToCurrentUser();
      showToast('Verification email sent! Check your inbox, then click Refresh Status.', 'success');
    } catch (err) {
      showToast(getReadableErrorMessage(err), 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleRefreshStatus = async () => {
    try {
      setBusy(true);
      const adminOk = await refreshAuth();
      if (adminOk) {
        navigate('/admin', { replace: true });
      } else {
        showToast('Email is still unverified. Sign in with Google below for instant access.', 'info');
      }
    } catch (err) {
      showToast(getReadableErrorMessage(err), 'error');
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="h-9 w-9 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4">
      <div className="max-w-md w-full rounded-2xl border border-slate-800 bg-white p-7 space-y-6 shadow-xl">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Admin Console Sign In</h1>
          <p className="mt-1 text-xs text-slate-500">
            Authorized marketplace owner & administrators only (Owner: {BOOTSTRAP_ADMIN_EMAIL}).
          </p>
        </div>

        {firebaseUser && !isAdmin && isOwnerEmailUnverified && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900 space-y-3">
            <p>
              You are signed in as <strong>{firebaseUser.email}</strong>, but your email is not
              verified yet. Admin security rules require a verified account.
            </p>
            <p className="text-amber-800">
              Click <strong>Sign In with Google (Admin)</strong> below for instant verified owner
              access, or verify via email:
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => void handleSendVerification()}
                className="rounded-lg bg-amber-900 px-3 py-1.5 font-semibold text-white hover:bg-amber-800 disabled:opacity-50"
              >
                Send Verification Email
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void handleRefreshStatus()}
                className="rounded-lg border border-amber-400 bg-white px-3 py-1.5 font-semibold text-amber-900 hover:bg-amber-100 disabled:opacity-50"
              >
                Refresh Status
              </button>
              <button
                type="button"
                onClick={() => void logout()}
                className="px-2 py-1.5 font-semibold underline"
              >
                Sign out
              </button>
            </div>
          </div>
        )}

        {firebaseUser && !isAdmin && !isOwnerEmailUnverified && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900 space-y-2">
            <p>
              Signed in as <strong>{firebaseUser.email}</strong>, which does not have Admin
              privileges yet.
            </p>
            <button
              type="button"
              onClick={() => void logout()}
              className="font-semibold underline"
            >
              Sign out and switch account
            </button>
          </div>
        )}

        <button
          type="button"
          disabled={busy}
          onClick={() => void handleGoogle()}
          className="w-full rounded-xl bg-slate-900 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
        >
          Sign In with Google (Admin)
        </button>

        <div className="flex items-center gap-3 text-xs text-slate-400">
          <div className="h-px flex-1 bg-slate-200" />
          <span>or email</span>
          <div className="h-px flex-1 bg-slate-200" />
        </div>

        <form onSubmit={handleEmail} className="space-y-3">
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Admin Email"
            className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm"
          />
          <input
            required
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm"
          />
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            Sign In
          </button>
        </form>

        <Link to="/" className="block text-center text-xs font-semibold text-slate-500 hover:text-slate-800">
          Return to Customer Storefront
        </Link>
      </div>
    </div>
  );
}

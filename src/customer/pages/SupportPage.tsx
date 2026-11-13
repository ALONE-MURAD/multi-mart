import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../shared/contexts/AuthContext';
import { useToast } from '../../shared/contexts/ToastContext';
import { submitSupportTicket, subscribeUserTickets } from '../../services/firestoreService';
import { formatTimestamp, getReadableErrorMessage } from '../../shared/utils';
import type { SupportTicket } from '../../shared/types';

export default function SupportPage() {
  const { firebaseUser, profile } = useAuth();
  const { showToast } = useToast();

  const [subject, setSubject] = useState('');
  const [orderNumber, setOrderNumber] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);

  useEffect(() => {
    if (!firebaseUser) return;
    return subscribeUserTickets(firebaseUser.uid, setTickets);
  }, [firebaseUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firebaseUser || !profile) return;
    try {
      setSubmitting(true);
      await submitSupportTicket({
        userId: firebaseUser.uid,
        userName: profile.displayName,
        userEmail: profile.email,
        subject: subject.trim(),
        orderNumber: orderNumber.trim(),
        message: message.trim(),
      });
      setSubject('');
      setOrderNumber('');
      setMessage('');
      showToast('Support ticket submitted', 'success');
    } catch (err) {
      showToast(getReadableErrorMessage(err), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Customer & Seller Support</h1>
        <p className="mt-1 text-sm text-slate-600">
          Need help with an order, delivery, or vendor verification? Open a ticket below.
        </p>
      </div>

      {!firebaseUser ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
          <p className="text-sm text-slate-600">Sign in to submit and track support tickets.</p>
          <Link
            to="/login"
            className="mt-4 inline-block rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white"
          >
            Sign In
          </Link>
        </div>
      ) : (
        <>
          <form
            onSubmit={handleSubmit}
            className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Subject (e.g., Delivery status inquiry)"
                className="rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm"
              />
              <input
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                placeholder="Order Number (optional)"
                className="rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-mono"
              />
            </div>
            <textarea
              required
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describe how we can assist you..."
              className="w-full rounded-xl border border-slate-200 p-3.5 text-sm"
            />
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              {submitting ? 'Submitting...' : 'Submit Ticket'}
            </button>
          </form>

          <div className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900">Your Support Tickets</h2>
            {tickets.length === 0 ? (
              <p className="text-sm text-slate-500">No tickets opened yet.</p>
            ) : (
              tickets.map((tk) => (
                <div
                  key={tk.id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 space-y-2"
                >
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-bold text-slate-900">{tk.subject}</span>
                    <span className="text-xs font-semibold uppercase text-emerald-700">
                      {tk.status} · {formatTimestamp(tk.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600">{tk.message}</p>
                  {tk.adminReply && (
                    <div className="rounded-xl bg-slate-50 p-3 text-xs text-slate-700">
                      <span className="font-bold">Support Reply: </span>
                      {tk.adminReply}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}

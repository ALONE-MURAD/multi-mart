import React, { useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import { useToast } from '../../shared/contexts/ToastContext';
import {
  subscribePlatformSettings,
  subscribeHomepageSettings,
  subscribeAllTicketsAdmin,
  savePlatformSettings,
  saveHomepageSettings,
  updateSupportTicketAdmin,
} from '../../services/firestoreService';
import {
  DEFAULT_HOMEPAGE_SETTINGS,
  DEFAULT_PLATFORM_SETTINGS,
  getReadableErrorMessage,
} from '../../shared/utils';
import type { HomepageSettings, PlatformSettings, SupportTicket } from '../../shared/types';

export default function AdminSettingsPage() {
  const { showToast } = useToast();
  const [platform, setPlatform] = useState<PlatformSettings>(DEFAULT_PLATFORM_SETTINGS);
  const [homepage, setHomepage] = useState<HomepageSettings>(DEFAULT_HOMEPAGE_SETTINGS);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const u1 = subscribePlatformSettings(setPlatform);
    const u2 = subscribeHomepageSettings(setHomepage);
    const u3 = subscribeAllTicketsAdmin(setTickets);
    return () => {
      u1();
      u2();
      u3();
    };
  }, []);

  const handleSavePlatform = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await savePlatformSettings(platform);
      await saveHomepageSettings(homepage);
      showToast('Website settings saved', 'success');
    } catch (err) {
      showToast(getReadableErrorMessage(err), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleResolveTicket = async (tk: SupportTicket) => {
    try {
      await updateSupportTicketAdmin(tk.id, {
        status: 'resolved',
        adminReply: replyDrafts[tk.id] ?? tk.adminReply ?? '',
      });
      showToast('Ticket resolved', 'success');
    } catch (err) {
      showToast(getReadableErrorMessage(err), 'error');
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-900">Website Settings & Support</h1>
        <a
          href="/multimart-bd-complete.zip"
          download="multimart-bd-complete.zip"
          className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white hover:bg-slate-800"
        >
          <Download className="h-4 w-4" /> Download Project ZIP
        </a>
      </div>

      <form
        onSubmit={handleSavePlatform}
        className="rounded-2xl border border-slate-200 bg-white p-6 space-y-6"
      >
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900">Marketplace Fees & Contact</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Site Name</label>
              <input
                value={platform.siteName}
                onChange={(e) => setPlatform({ ...platform, siteName: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Support Phone
              </label>
              <input
                value={platform.supportPhone}
                onChange={(e) => setPlatform({ ...platform, supportPhone: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Support Email
              </label>
              <input
                value={platform.supportEmail}
                onChange={(e) => setPlatform({ ...platform, supportEmail: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Commission (%)
              </label>
              <input
                type="number"
                value={platform.defaultCommissionRate}
                onChange={(e) =>
                  setPlatform({ ...platform, defaultCommissionRate: Number(e.target.value) })
                }
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Delivery Inside Dhaka (৳)
              </label>
              <input
                type="number"
                value={platform.deliveryFeeInsideDhaka}
                onChange={(e) =>
                  setPlatform({ ...platform, deliveryFeeInsideDhaka: Number(e.target.value) })
                }
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Delivery Outside Dhaka (৳)
              </label>
              <input
                type="number"
                value={platform.deliveryFeeOutsideDhaka}
                onChange={(e) =>
                  setPlatform({ ...platform, deliveryFeeOutsideDhaka: Number(e.target.value) })
                }
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Free Shipping Threshold (৳)
              </label>
              <input
                type="number"
                value={platform.freeShippingThreshold}
                onChange={(e) =>
                  setPlatform({ ...platform, freeShippingThreshold: Number(e.target.value) })
                }
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-mono"
              />
            </div>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-5 space-y-4">
          <h2 className="text-lg font-bold text-slate-900">Announcement Bar & Homepage Sections</h2>
          <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
            <input
              type="checkbox"
              checked={homepage.announcementActive}
              onChange={(e) =>
                setHomepage({ ...homepage, announcementActive: e.target.checked })
              }
              className="accent-emerald-600"
            />
            Show announcement bar at top of storefront
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              value={homepage.announcementEn}
              onChange={(e) => setHomepage({ ...homepage, announcementEn: e.target.value })}
              placeholder="Announcement (English)"
              className="rounded-xl border border-slate-200 px-3.5 py-2 text-sm"
            />
            <input
              value={homepage.announcementBn}
              onChange={(e) => setHomepage({ ...homepage, announcementBn: e.target.value })}
              placeholder="ঘোষণা (বাংলা)"
              className="rounded-xl border border-slate-200 px-3.5 py-2 text-sm"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
            {homepage.sections.map((sec) => (
              <label
                key={sec.id}
                className="flex items-center justify-between rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm"
              >
                <span className="font-medium text-slate-800">{sec.titleEn}</span>
                <input
                  type="checkbox"
                  checked={sec.isEnabled}
                  onChange={(e) =>
                    setHomepage({
                      ...homepage,
                      sections: homepage.sections.map((s) =>
                        s.id === sec.id ? { ...s, isEnabled: e.target.checked } : s
                      ),
                    })
                  }
                  className="accent-emerald-600"
                />
              </label>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
        >
          {saving ? 'Saving...' : 'Save Website Settings'}
        </button>
      </form>

      {/* Support Tickets */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
        <h2 className="text-lg font-bold text-slate-900">Support Tickets ({tickets.length})</h2>
        {tickets.length === 0 ? (
          <p className="text-sm text-slate-500">No support tickets yet.</p>
        ) : (
          <div className="space-y-4">
            {tickets.map((tk) => (
              <div key={tk.id} className="rounded-xl border border-slate-200 p-4 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <div>
                    <p className="font-bold text-slate-900">{tk.subject}</p>
                    <p className="text-xs text-slate-500">
                      {tk.userName} ({tk.userEmail}){tk.orderNumber ? ` · ${tk.orderNumber}` : ''}
                    </p>
                  </div>
                  <span className="text-xs font-semibold uppercase text-emerald-700">
                    {tk.status}
                  </span>
                </div>
                <p className="text-sm text-slate-700">{tk.message}</p>
                <div className="flex gap-2">
                  <input
                    value={replyDrafts[tk.id] ?? tk.adminReply ?? ''}
                    onChange={(e) =>
                      setReplyDrafts((prev) => ({ ...prev, [tk.id]: e.target.value }))
                    }
                    placeholder="Write support reply..."
                    className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => void handleResolveTicket(tk)}
                    className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
                  >
                    Reply & Resolve
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import api from '../api/client';
import { SHOP_REPORT_REASONS } from '../constants/shopReportReasons.js';

const MAX_DESC = 2000;

export default function ReportShopModal({ open, onClose, shopId, shopName }) {
  const [step, setStep] = useState(1);
  const [selectedLabel, setSelectedLabel] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!open) return;
    setStep(1);
    setSelectedLabel('');
    setDescription('');
    setSubmitting(false);
    setError('');
    setDone(false);
  }, [open, shopId]);

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    const reporterId = user?.id || user?._id;
    if (!reporterId) {
      setError('Please sign in to submit a report.');
      return;
    }
    if (!selectedLabel) {
      setError('Choose a reason that best describes the issue.');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      await api.post('/reports', {
        reporterId,
        shopId,
        reason: selectedLabel,
        description: description.trim(),
      });
      setDone(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not send report. Try again later.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[300] flex items-end justify-center bg-slate-900/55 p-0 sm:items-center sm:p-4"
      role="presentation"
      onClick={(ev) => {
        if (ev.target === ev.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="report-shop-title"
        className="flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl border border-slate-200 bg-white shadow-2xl sm:max-h-[85vh] sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-slate-100 bg-gradient-to-br from-rose-50 via-white to-amber-50 px-5 py-4 sm:px-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rose-600/90">Report a shop</p>
              <h2 id="report-shop-title" className="mt-1 text-xl font-semibold tracking-tight text-slate-900">
                {shopName || 'This shop'}
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Reports are reviewed by our team. Misuse may affect your account.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 rounded-full p-2 text-slate-500 transition hover:bg-white/80 hover:text-slate-900"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
          {!done && (
            <div className="mt-4 flex gap-1.5">
              {[1, 2].map((n) => (
                <div
                  key={n}
                  className={`h-1 flex-1 rounded-full transition ${step >= n ? 'bg-rose-500' : 'bg-slate-200'}`}
                />
              ))}
            </div>
          )}
        </div>

        {done ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-14 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-3xl text-emerald-700">
              ✓
            </div>
            <div>
              <p className="text-lg font-semibold text-slate-900">Thanks — we received your report</p>
              <p className="mt-2 max-w-sm text-sm text-slate-600">
                We take safety seriously. If we need more detail, we may reach out using your account email.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full bg-slate-900 px-8 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-6">
              {step === 1 && (
                <div className="space-y-3">
                  <p className="text-sm font-medium text-slate-800">What is going on?</p>
                  <p className="text-xs text-slate-500">Select one option — you can add details on the next step.</p>
                  <div className="grid gap-2.5">
                    {SHOP_REPORT_REASONS.map((opt) => {
                      const active = selectedLabel === opt.label;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => {
                            setSelectedLabel(opt.label);
                            setError('');
                          }}
                          className={`rounded-2xl border px-4 py-3.5 text-left transition ${
                            active
                              ? 'border-rose-500 bg-rose-50/90 shadow-[0_0_0_1px_rgba(244,63,94,0.35)]'
                              : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/80'
                          }`}
                        >
                          <span className="block text-sm font-semibold text-slate-900">{opt.label}</span>
                          <span className="mt-0.5 block text-xs text-slate-600">{opt.hint}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                    <span className="font-medium text-slate-900">Reason: </span>
                    {selectedLabel}
                  </div>
                  <div>
                    <label htmlFor="report-desc" className="text-sm font-medium text-slate-800">
                      Additional details <span className="font-normal text-slate-500">(optional)</span>
                    </label>
                    <textarea
                      id="report-desc"
                      rows={6}
                      value={description}
                      maxLength={MAX_DESC}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Links, order numbers, screenshots described in text, or anything that helps us verify faster…"
                      className="mt-2 w-full resize-y rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none ring-rose-500/20 focus:border-rose-400 focus:ring-2"
                    />
                    <p className="mt-1 text-right text-xs text-slate-400">
                      {description.length}/{MAX_DESC}
                    </p>
                  </div>
                </div>
              )}

              {error && (
                <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</div>
              )}
            </div>

            <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/80 px-5 py-4 sm:px-6">
              {step === 1 ? (
                <>
                  <button type="button" onClick={onClose} className="text-sm font-medium text-slate-600 hover:text-slate-900">
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={!selectedLabel}
                    onClick={() => {
                      if (!selectedLabel) {
                        setError('Please choose a reason.');
                        return;
                      }
                      setStep(2);
                      setError('');
                    }}
                    className="rounded-full bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Continue
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setStep(1);
                      setError('');
                    }}
                    className="text-sm font-medium text-slate-600 hover:text-slate-900"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="rounded-full bg-rose-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-700 disabled:opacity-50"
                  >
                    {submitting ? 'Sending…' : 'Submit report'}
                  </button>
                </>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

const toneClass = {
  success: 'border-emerald-300 bg-emerald-50 text-emerald-900',
  info: 'border-green-300 bg-green-50 text-slate-900',
  warning: 'border-amber-200 bg-amber-50 text-slate-900',
};

/**
 * Fixed notices at the top of the viewport, above the sticky navbar (z-20),
 * so they stay visible when the page is scrolled.
 */
export default function ViewportNoticeStack({ items }) {
  const list = (items || []).filter((i) => i && String(i.text || '').trim());
  if (!list.length) return null;

  return (
    <div
      className="pointer-events-none fixed left-1/2 top-[max(0.75rem,env(safe-area-inset-top))] z-[200] flex w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 flex-col gap-2"
      aria-live="polite"
    >
      {list.map((item, idx) => (
        <div
          key={item.key ?? idx}
          role="status"
          className={`pointer-events-auto rounded-xl border px-4 py-3 text-center text-sm font-medium shadow-lg ${toneClass[item.tone] || toneClass.success}`}
        >
          {item.text}
        </div>
      ))}
    </div>
  );
}

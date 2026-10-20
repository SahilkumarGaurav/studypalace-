import { config } from '@/lib/config';

export default function AnnouncementBar() {
  return (
    <div className="bg-ink-950 text-white">
      <div className="container-x flex flex-wrap items-center justify-center gap-x-3 gap-y-1 py-2 text-center text-[11.5px] font-semibold tracking-wide sm:text-xs">
        <span className="inline-flex items-center gap-1.5">
          <Bolt /> Instant download after payment
        </span>
        <span className="hidden text-white/25 sm:inline">•</span>
        <span className="inline-flex items-center gap-1.5">
          <Shield /> Secure payments by Razorpay
        </span>
        <span className="hidden text-white/25 sm:inline">•</span>
        <span className="inline-flex items-center gap-1.5">
          <InfinityLoop /> Lifetime access, unlimited re-downloads
        </span>
      </div>
    </div>
  );
}

function Bolt() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-gold-300" fill="currentColor" aria-hidden="true">
      <path d="M13 2 4.5 13.5H11L9.5 22 19 10h-6.5L13 2Z" />
    </svg>
  );
}
function Shield() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-mint-300" fill="currentColor" aria-hidden="true">
      <path d="M12 2 4 5v6c0 5 3.4 9.4 8 11 4.6-1.6 8-6 8-11V5l-8-3Zm-1.2 13.6-3-3 1.4-1.4 1.6 1.6 4-4 1.4 1.4-5.4 5.4Z" />
    </svg>
  );
}
function InfinityLoop() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-brand-300" fill="currentColor" aria-hidden="true">
      <path d="M18.6 6.6a5.4 5.4 0 0 0-7.6 1.2A5.4 5.4 0 0 0 3.4 6.6 5.4 5.4 0 0 0 3.4 17.4a5.4 5.4 0 0 0 7.6-1.2 5.4 5.4 0 0 0 7.6 1.2 5.4 5.4 0 0 0 0-10.8ZM5.6 15.2a3.2 3.2 0 1 1 0-6.4 3.2 3.2 0 0 1 0 6.4Zm12.8 0a3.2 3.2 0 1 1 0-6.4 3.2 3.2 0 0 1 0 6.4Z" />
    </svg>
  );
}

/**
 * Generic customer avatar: a soft silhouette, the same for everyone.
 * Customer photos are never needed or stored in the customer record.
 */
export function CustomerAvatar({ size = 40, className = "" }: { size?: number; className?: string }) {
  return (
    <span aria-hidden="true" className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#f5e6e7] ${className}`} style={{ width: size, height: size }}>
      <svg viewBox="0 0 40 40" width={size} height={size} focusable="false">
        <circle cx="20" cy="15.5" r="6.8" fill="#c99aa7" />
        <path d="M7.5 37c1.2-7.4 6.4-11.6 12.5-11.6S31.3 29.6 32.5 37" fill="#c99aa7" />
        <path d="M12.6 16.2c-.4-6.3 3.1-9.9 7.4-9.9 4.6 0 8 3.5 7.4 9.9-.9-2.6-3.6-4.6-7.4-4.6s-6.5 2-7.4 4.6z" fill="#8e4759" opacity=".55" />
      </svg>
    </span>
  );
}

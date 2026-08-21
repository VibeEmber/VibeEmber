/** 三阶段业务图标：编辑感线稿、圆头结构与一粒品牌橙火种。 */

export function AddKindlingIcon({ size = 23 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="spark-icon"
      aria-hidden="true"
    >
      <path d="m5.5 18.5 13-3M6.5 14.5l11 4M7.5 20.5h9" />
      <path d="M12.4 3.8c-.4 1.8-2.1 2.9-2.1 4.8 0 1.3.8 2.3 1.9 2.3 1.2 0 2.1-.9 2.1-2.3 0-1.2-.8-2-1.3-2.8-.4-.6-.6-1.2-.6-2Z" />
      <circle cx="12.2" cy="8.4" r="1.1" fill="var(--icon-ember, #ff6334)" stroke="none" />
    </svg>
  );
}

export function FanFlameIcon({ size = 23 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="spark-icon"
      aria-hidden="true"
    >
      <path d="M3.8 8.5c3-.8 5.2-.2 6.7 1.8M3.5 12.5c3.4-.8 5.8-.1 7.4 2M4.2 16.5c2.8-.5 4.8.1 6 1.6" />
      <path d="M16.8 4.1c-.5 2-2.5 3.4-2.5 5.9 0 1.9 1.2 3.2 2.8 3.2 1.8 0 3.1-1.3 3.1-3.2 0-1.7-1-2.8-1.8-3.8-.7-.8-1.2-1.5-1.6-2.1Z" />
      <circle cx="17.2" cy="10" r="1.2" fill="var(--icon-ember, #ff6334)" stroke="none" />
    </svg>
  );
}

export function PrairieFireIcon({ size = 23 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="spark-icon"
      aria-hidden="true"
    >
      <path d="M3.8 18.7c.7-2.8 2.5-4.2 4.2-6.3.6 1.3 1.7 2.1 2.3 3.3.8-3.8 3.7-5.8 4-10.4 2.8 3.6 5.9 6 5.9 10.3 0 3-2.7 5-6.3 5H8.5c-2.1 0-3.8-.6-4.7-1.9Z" />
      <circle cx="14" cy="16.4" r="1.5" fill="var(--icon-ember, #ff6334)" stroke="none" />
      <path d="M5.2 21h14" />
    </svg>
  );
}

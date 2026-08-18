/** 三阶段小标：与 EmberMark 同一套星火几何语言 */

export function AddKindlingIcon({ size = 23 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <path d="M8 23.5h16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path
        d="M10.5 21h11"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        opacity="0.45"
      />
      <circle cx="16" cy="10.2" r="1.35" fill="currentColor" opacity="0.55" />
      <path d="M16 12.4v5.2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path
        d="M16 15.2c.35 3.2 1.9 4.55 4.4 4.9-2.5.45-3.75 1.9-4.1 5.35-.35-3.45-1.95-4.9-4.45-5.35 2.5-.35 4.05-1.7 4.15-4.9Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function FanFlameIcon({ size = 23 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <path
        d="M5.5 11.5c3.2-1.2 5.6-.4 7.2 1.6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.45"
      />
      <path
        d="M5 16.2c3.6-1 6.2-.2 7.8 1.8"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M5.5 20.8c3.2-.8 5.5-.1 7 1.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.45"
      />
      <path
        d="M20.2 6.4c.4 4.7 2.55 6.7 6.3 7.15-3.75.6-5.55 2.7-6.05 7.85-.5-5.15-2.85-7.25-6.55-7.85 3.7-.45 5.9-2.45 6.3-7.15Z"
        fill="currentColor"
      />
      <circle cx="14.2" cy="22.8" r="1.15" fill="currentColor" opacity="0.4" />
      <circle cx="25.6" cy="23.4" r="1" fill="currentColor" opacity="0.35" />
    </svg>
  );
}

export function PrairieFireIcon({ size = 23 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <circle cx="7" cy="8.2" r="1.2" fill="currentColor" opacity="0.4" />
      <circle cx="25.8" cy="9.4" r="1.05" fill="currentColor" opacity="0.32" />
      <circle cx="8.2" cy="23.6" r="1.1" fill="currentColor" opacity="0.38" />
      <circle cx="24.8" cy="24.2" r="1.2" fill="currentColor" opacity="0.45" />
      <path
        d="M16 4.4c.5 5.7 3.15 8.15 7.6 8.7-4.45.75-6.65 3.3-7.25 9.5-.6-6.2-3.45-8.75-7.9-9.5 4.45-.55 7.1-3 7.55-8.7Z"
        fill="currentColor"
      />
    </svg>
  );
}

/** 星火场标志：微光聚成一粒星火，外圈是场。单色 currentColor，可叠在 lime 品牌块上。 */
export function EmberMark({ size = 19 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <circle cx="16" cy="16.4" r="11" stroke="currentColor" strokeWidth="1.2" opacity="0.28" />
      <circle cx="6.6" cy="8.2" r="1.35" fill="currentColor" opacity="0.42" />
      <circle cx="26.2" cy="10.1" r="1.05" fill="currentColor" opacity="0.32" />
      <circle cx="24.6" cy="24.4" r="1.2" fill="currentColor" opacity="0.48" />
      <path
        d="M16 4.2c.55 6.4 3.55 9.15 8.55 9.75-5 .85-7.45 3.7-8.15 10.65-.7-6.95-3.85-9.8-8.85-10.65C12.55 13.35 15.45 10.6 16 4.2Z"
        fill="currentColor"
      />
    </svg>
  );
}

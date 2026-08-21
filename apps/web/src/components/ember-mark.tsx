/** 星火场标志：场托住一粒火种。主体跟随 currentColor，火种使用品牌橙。 */
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
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M16.78 3.58c-.3-.52-1.05-.5-1.32.03-1.2 2.36-3.13 4.38-4.96 6.34-2.28 2.44-4.13 4.98-4.13 8.58 0 5.48 4.23 9.37 9.63 9.37s9.63-3.89 9.63-9.37c0-4.22-2.49-7.11-5.22-9.87-1.5-1.53-2.7-3.29-3.63-5.08ZM16 11.33c.67 1.8 2.23 3.29 3.35 4.82.75 1.04 1.21 2.1 1.21 3.48 0 2.67-1.98 4.54-4.56 4.54s-4.56-1.87-4.56-4.54c0-1.91.96-3.3 2.09-4.73.95-1.21 1.89-2.31 2.47-3.57Z"
        fill="currentColor"
      />
      <circle cx="16" cy="19.35" r="2.15" fill="var(--ember-accent, #ff6334)" />
    </svg>
  );
}

import type { SVGProps } from "react";

export type SparkIconProps = Omit<SVGProps<SVGSVGElement>, "height" | "width"> & {
  size?: number;
};

const ember = "var(--icon-ember, #ff6334)";

function Icon({ size = 20, className, children, ...props }: SparkIconProps) {
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
      className={className ? `spark-icon ${className}` : "spark-icon"}
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export function ArrowRight(props: SparkIconProps) {
  return (
    <Icon {...props}>
      <circle cx="5" cy="12" r="1.2" fill="currentColor" stroke="none" />
      <path d="M8 12h10" />
      <path d="m14.5 8 4 4-4 4" />
    </Icon>
  );
}

export function ChevronRight(props: SparkIconProps) {
  return (
    <Icon {...props}>
      <path d="m9 6.5 5.5 5.5L9 17.5" />
    </Icon>
  );
}

export function Check(props: SparkIconProps) {
  return (
    <Icon {...props}>
      <path d="m5.2 12.6 4.1 4.1L19 7.5" />
      <circle cx="5.2" cy="12.6" r="1" fill={ember} stroke="none" />
    </Icon>
  );
}

export function X(props: SparkIconProps) {
  return (
    <Icon {...props}>
      <path d="m7 7 10 10M17 7 7 17" />
    </Icon>
  );
}

export function Plus(props: SparkIconProps) {
  return (
    <Icon {...props}>
      <path d="M12 5.5v13M5.5 12h13" />
      <circle cx="12" cy="12" r="1.15" fill={ember} stroke="none" />
    </Icon>
  );
}

export function Search(props: SparkIconProps) {
  return (
    <Icon {...props}>
      <circle cx="10.5" cy="10.5" r="5.7" />
      <path d="m14.8 14.8 4.2 4.2" />
      <circle cx="8.6" cy="8.4" r="1" fill={ember} stroke="none" />
    </Icon>
  );
}

export function Bell(props: SparkIconProps) {
  return (
    <Icon {...props}>
      <path d="M6.8 10.7c0-3.2 1.9-5.5 5.2-5.5s5.2 2.3 5.2 5.5c0 3.7 1.5 4.4 2.1 5.6H4.7c.6-1.2 2.1-1.9 2.1-5.6Z" />
      <path d="M9.5 19c.7.7 1.5 1 2.5 1s1.8-.3 2.5-1" />
      <circle cx="12" cy="5.2" r="1.15" fill={ember} stroke="none" />
    </Icon>
  );
}

export function UserCircle(props: SparkIconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="8.4" />
      <circle cx="12" cy="9.2" r="2.25" fill={ember} stroke="none" />
      <path d="M7.4 17.5c1-2.3 2.5-3.4 4.6-3.4s3.6 1.1 4.6 3.4" />
    </Icon>
  );
}

export function UserRound(props: SparkIconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="8.1" r="3" fill={ember} stroke="none" />
      <path d="M5.8 19.1c.8-3.7 2.9-5.5 6.2-5.5s5.4 1.8 6.2 5.5" />
    </Icon>
  );
}

export function Users(props: SparkIconProps) {
  return (
    <Icon {...props}>
      <circle cx="9.5" cy="8.5" r="2.7" fill={ember} stroke="none" />
      <path d="M3.8 18.5c.7-3.6 2.6-5.3 5.7-5.3s5 1.7 5.7 5.3" />
      <path d="M15 6.4c2.1 0 3.3 1.1 3.3 2.7s-1.2 2.7-3.3 2.7M16.5 14.3c2 .5 3.2 1.9 3.7 4.2" />
    </Icon>
  );
}

export function Flame(props: SparkIconProps) {
  return (
    <Icon {...props}>
      <path d="M12.6 3.5c-.8 2.6-2.9 4.3-4.4 6.1-1.5 1.7-2.6 3.6-2.6 6 0 3.5 2.8 5.9 6.4 5.9s6.4-2.4 6.4-5.9c0-2.8-1.7-4.7-3.5-6.6-1-1.1-1.8-2.8-2.3-5.5Z" />
      <circle cx="12" cy="16.2" r="2" fill={ember} stroke="none" />
    </Icon>
  );
}

export function Sparkles(props: SparkIconProps) {
  return (
    <Icon {...props}>
      <path d="M10.7 4.2c.4 3.1 1.8 4.5 4.6 4.9-2.8.5-4.1 2-4.5 5.3-.4-3.3-1.9-4.8-4.7-5.3 2.8-.4 4.2-1.8 4.6-4.9Z" />
      <path
        d="M18.2 13.6c.2 1.7 1 2.5 2.5 2.7-1.5.3-2.2 1.1-2.4 2.9-.2-1.8-1-2.6-2.6-2.9 1.6-.2 2.3-1 2.5-2.7Z"
        fill={ember}
        stroke="none"
      />
      <circle cx="5.1" cy="16.7" r="1" fill="currentColor" stroke="none" />
    </Icon>
  );
}

export function Star(props: SparkIconProps) {
  return (
    <Icon {...props}>
      <path d="m12 4 2.35 4.8 5.3.75-3.82 3.72.9 5.25L12 16.05l-4.73 2.47.9-5.25-3.82-3.72 5.3-.75L12 4Z" />
      <circle cx="12" cy="11.7" r="1.25" fill={ember} stroke="none" />
    </Icon>
  );
}

export function MessageCircle(props: SparkIconProps) {
  return (
    <Icon {...props}>
      <path d="M20 11.3c0 4.2-3.4 7-7.9 7-1.1 0-2.2-.2-3.1-.5l-4.4 1.6 1.4-4c-1.2-1.1-1.9-2.5-1.9-4.1 0-4.2 3.4-7 7.9-7s8 2.8 8 7Z" />
      <circle cx="8.7" cy="11.3" r="1" fill="currentColor" stroke="none" />
      <circle cx="12" cy="11.3" r="1" fill={ember} stroke="none" />
      <circle cx="15.3" cy="11.3" r="1" fill="currentColor" stroke="none" />
    </Icon>
  );
}

export function Heart(props: SparkIconProps) {
  return (
    <Icon {...props}>
      <path d="M12 20.2S4.5 16 4.5 9.8c0-2.7 1.8-4.5 4.2-4.5 1.5 0 2.7.8 3.3 2 .6-1.2 1.8-2 3.3-2 2.4 0 4.2 1.8 4.2 4.5 0 6.2-7.5 10.4-7.5 10.4Z" />
      <circle cx="12" cy="10.1" r="1.15" fill={ember} stroke="none" />
    </Icon>
  );
}

export function Bookmark(props: SparkIconProps) {
  return (
    <Icon {...props}>
      <path d="M7 4.2h10c.6 0 1 .4 1 1v15l-6-3.7L6 20.2v-15c0-.6.4-1 1-1Z" />
      <circle cx="12" cy="8.2" r="1.2" fill={ember} stroke="none" />
    </Icon>
  );
}

export function ExternalLink(props: SparkIconProps) {
  return (
    <Icon {...props}>
      <path d="M10 5.2H5.7c-.8 0-1.5.7-1.5 1.5v11.6c0 .8.7 1.5 1.5 1.5h11.6c.8 0 1.5-.7 1.5-1.5V14" />
      <path d="M13.5 4.2h6.3v6.3M19.4 4.6l-8.2 8.2" />
      <circle cx="11.2" cy="12.8" r="1" fill={ember} stroke="none" />
    </Icon>
  );
}

export function CircleHelp(props: SparkIconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M9.7 9.4c.3-1.5 1.2-2.3 2.7-2.3 1.6 0 2.7 1 2.7 2.5 0 2.3-2.5 2.5-2.8 4.3" />
      <circle cx="12.2" cy="17.3" r="1.15" fill={ember} stroke="none" />
    </Icon>
  );
}

export function Clock3(props: SparkIconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7v5l3.8 2.2" />
      <circle cx="12" cy="12" r="1.15" fill={ember} stroke="none" />
    </Icon>
  );
}

export function Target(props: SparkIconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="4.5" />
      <circle cx="12" cy="12" r="1.7" fill={ember} stroke="none" />
    </Icon>
  );
}

export function LayoutGrid(props: SparkIconProps) {
  return (
    <Icon {...props}>
      <rect x="4.2" y="4.2" width="6.1" height="6.1" rx="1.2" />
      <rect x="13.7" y="4.2" width="6.1" height="6.1" rx="1.2" fill={ember} stroke="none" />
      <rect x="4.2" y="13.7" width="6.1" height="6.1" rx="1.2" />
      <rect x="13.7" y="13.7" width="6.1" height="6.1" rx="1.2" />
    </Icon>
  );
}

export function LoaderCircle(props: SparkIconProps) {
  return (
    <Icon {...props}>
      <path d="M20 12a8 8 0 0 1-8 8M4 12a8 8 0 0 1 8-8" opacity=".35" />
      <path d="M12 4a8 8 0 0 1 7.1 4.3" />
      <circle cx="19.1" cy="8.3" r="1.15" fill={ember} stroke="none" />
    </Icon>
  );
}

export function Mail(props: SparkIconProps) {
  return (
    <Icon {...props}>
      <rect x="3.8" y="5.5" width="16.4" height="13" rx="2" />
      <path d="m5 7 7 5.5L19 7" />
      <circle cx="17.5" cy="16" r="1.1" fill={ember} stroke="none" />
    </Icon>
  );
}

export function Rocket(props: SparkIconProps) {
  return (
    <Icon {...props}>
      <path d="M13.3 4.1c3.2-1 5.3-.6 6.6-.1.5 1.3.9 3.4-.1 6.6-1 3.1-3.5 5.2-6.5 6.8l-4.7-4.7c1.6-3 3.7-5.6 6.8-6.5" />
      <path d="m8.7 12.7-3.8.8 2.2-4 3.4-1.1M13.3 17.3l-.8 3.8 4-2.2 1.1-3.4" />
      <circle cx="15.5" cy="8.5" r="1.6" fill={ember} stroke="none" />
      <path d="M8.5 16.5 5 20" />
    </Icon>
  );
}

export function ImagePlus(props: SparkIconProps) {
  return (
    <Icon {...props}>
      <rect x="3.5" y="5" width="17" height="14.5" rx="2" />
      <path d="m5.5 17 4.1-4.4 3.2 3 2.3-2.2 3.4 3.6" />
      <circle cx="8.2" cy="9.1" r="1.25" fill={ember} stroke="none" />
      <path d="M17 6.8v4M15 8.8h4" />
    </Icon>
  );
}

export function Zap(props: SparkIconProps) {
  return (
    <Icon {...props}>
      <path d="M13.5 2.9 5.8 13h5.4l-.7 8.1L18.2 11h-5.4l.7-8.1Z" />
      <circle cx="12" cy="12" r="1.2" fill={ember} stroke="none" />
    </Icon>
  );
}

export function BookOpen(props: SparkIconProps) {
  return (
    <Icon {...props}>
      <path d="M3.7 5.5c3.3-.8 6.1-.2 8.3 1.8v12.2c-2.2-2-5-2.6-8.3-1.8V5.5ZM20.3 5.5c-3.3-.8-6.1-.2-8.3 1.8v12.2c2.2-2 5-2.6 8.3-1.8V5.5Z" />
      <circle cx="12" cy="19.5" r="1.1" fill={ember} stroke="none" />
    </Icon>
  );
}

export function LogOut(props: SparkIconProps) {
  return (
    <Icon {...props}>
      <path d="M10 4.5H5.5c-.8 0-1.5.7-1.5 1.5v12c0 .8.7 1.5 1.5 1.5H10" />
      <path d="M12 12h8M17 8.5l3.5 3.5-3.5 3.5" />
      <circle cx="12" cy="12" r="1.05" fill={ember} stroke="none" />
    </Icon>
  );
}

export function ShieldCheck(props: SparkIconProps) {
  return (
    <Icon {...props}>
      <path d="M12 3.5c2.1 1.5 4.6 2.2 7.2 2.4v5.4c0 4.3-2.4 7.4-7.2 9.2-4.8-1.8-7.2-4.9-7.2-9.2V5.9c2.6-.2 5.1-.9 7.2-2.4Z" />
      <path d="m8.7 12.1 2.2 2.2 4.5-4.7" />
      <circle cx="8.7" cy="12.1" r="1" fill={ember} stroke="none" />
    </Icon>
  );
}

export function Upload(props: SparkIconProps) {
  return (
    <Icon {...props}>
      <path d="M12 15V4.5M8.5 8 12 4.5 15.5 8" />
      <path d="M5 14.5V19h14v-4.5" />
      <circle cx="12" cy="15" r="1.1" fill={ember} stroke="none" />
    </Icon>
  );
}

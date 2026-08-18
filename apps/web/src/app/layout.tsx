import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "星火场 VibeEmber - Vibe Coder 产品首发与互助社区",
  description:
    "聚微光为星火，化星火以燎原。发布你的作品，换取真实体验和有效反馈。先添柴，再助燃，直到燎原。",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}

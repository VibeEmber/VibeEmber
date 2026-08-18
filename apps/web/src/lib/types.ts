/** 卡片展示模型：API 公开项目 + 精选兜底数据的并集 */
export interface DisplayProject {
  id: number | string;
  name: string;
  tagline: string;
  category: string;
  maker: string;
  avatar: string;
  icon: string;
  color: string;
  accent: string;
  votes: number;
  comments: number;
  badge?: string;
  url?: string;
  logoUrl?: string | null;
  qrUrl?: string | null;
  makerAvatarUrl?: string | null;
}

export const projectPalettes: ReadonlyArray<readonly [string, string]> = [
  ["#e1f3e9", "#2c8958"],
  ["#dce8ff", "#3268ff"],
  ["#ffdfd1", "#ff6534"],
  ["#eee8ff", "#7752d6"],
  ["#fff0bb", "#df7516"],
];

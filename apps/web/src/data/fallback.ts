import type { DisplayProject } from "@/lib/types";

/** API 不可用/为空时的精选首发集（线上数据已 seed 进数据库，这里是兜底展示） */
export const fallbackProjects: DisplayProject[] = [
  {
    id: 1,
    name: "流光简历",
    tagline: "把普通经历，变成会讲故事的作品集",
    category: "AI 工具",
    maker: "阿川",
    avatar: "川",
    icon: "光",
    color: "#171814",
    accent: "#dfff53",
    votes: 186,
    comments: 32,
    badge: "今日最热",
  },
  {
    id: 2,
    name: "饭搭子",
    tagline: "不再纠结吃什么，也找到一起吃的人",
    category: "微信小程序",
    maker: "林同学",
    avatar: "林",
    icon: "饭",
    color: "#ffdfd1",
    accent: "#ff6534",
    votes: 142,
    comments: 27,
    badge: "求体验",
  },
  {
    id: 3,
    name: "TabTab",
    tagline: "用 AI 把你的 100 个浏览器标签变成知识库",
    category: "浏览器插件",
    maker: "Jensen",
    avatar: "J",
    icon: "T",
    color: "#dce8ff",
    accent: "#3268ff",
    votes: 121,
    comments: 19,
  },
  {
    id: 4,
    name: "方言星球",
    tagline: "每天 3 分钟，学会一句家乡话",
    category: "教育",
    maker: "木棉",
    avatar: "棉",
    icon: "言",
    color: "#e1f3e9",
    accent: "#2c8958",
    votes: 96,
    comments: 14,
    badge: "首发",
  },
  {
    id: 5,
    name: "Billow",
    tagline: "自由职业者的极简记账与报价助手",
    category: "Web 应用",
    maker: "老麦",
    avatar: "麦",
    icon: "B",
    color: "#eee8ff",
    accent: "#7752d6",
    votes: 88,
    comments: 11,
  },
  {
    id: 6,
    name: "周末去哪",
    tagline: "给城市里不想做攻略的人一个答案",
    category: "生活方式",
    maker: "薇拉",
    avatar: "V",
    icon: "去",
    color: "#fff0bb",
    accent: "#df7516",
    votes: 76,
    comments: 16,
    badge: "征集反馈",
  },
];

export interface HelpTask {
  icon: string;
  color: string;
  name: string;
  title: string;
  progress: number;
  current: number;
  total: number;
  reward: number;
  time: string;
}

export const helpTasks: HelpTask[] = [
  {
    icon: "饭",
    color: "#ffdfd1",
    name: "饭搭子",
    title: "征集 30 位上海用户体验组队功能",
    progress: 76,
    current: 23,
    total: 30,
    reward: 20,
    time: "剩 2 天",
  },
  {
    icon: "T",
    color: "#dce8ff",
    name: "TabTab",
    title: "安装插件，完成 10 分钟真实体验",
    progress: 42,
    current: 21,
    total: 50,
    reward: 35,
    time: "剩 4 天",
  },
  {
    icon: "言",
    color: "#e1f3e9",
    name: "方言星球",
    title: "寻找 8 位广东话母语者校对内容",
    progress: 63,
    current: 5,
    total: 8,
    reward: 50,
    time: "剩 1 天",
  },
];

export const categoryFilters = ["全部", "教育", "游戏", "效率", "娱乐", "AI", "生活方式", "工具"];

export const leaderboard = [
  ["鱼丸", "产品经理", "428", "🐟"],
  ["阿耀", "全栈开发", "386", "🌞"],
  ["Nora", "独立设计师", "342", "N"],
  ["小杰", "Vibe Coder", "296", "杰"],
] as const;

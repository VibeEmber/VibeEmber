"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@vibeember/shared";
import type { CommunityWeek, ProjectPublic, TaskClaimItem } from "@vibeember/shared";
import { useAppSession } from "@/lib/session";
import { projectPalettes, type DisplayProject } from "@/lib/types";
import { AuthModal } from "./modals/auth-modal";
import { SubmitModal } from "./modals/submit-modal";
import { TaskClaimModal } from "./modals/task-claim-modal";
import { Discover } from "./discover";
import { Footer } from "./footer";
import { HelpSection } from "./help-section";
import { Hero } from "./hero";
import { HowItWorks } from "./how-it-works";
import { SiteHeader } from "./site-header";
import { Ticker } from "./ticker";
import { Toast } from "./toast";

function toDisplayProject(project: ProjectPublic, index: number): DisplayProject {
  const palette = projectPalettes[index % projectPalettes.length];
  return {
    id: project.id,
    name: project.name,
    tagline: project.tagline,
    category: project.kindLabel,
    topics: project.topics,
    maker: project.maker,
    avatar: project.maker.slice(0, 1).toUpperCase(),
    icon: project.name.slice(0, 1).toUpperCase(),
    color: palette[0],
    accent: palette[1],
    votes: project.voteCount,
    comments: project.commentCount,
    voted: project.voted,
    bookmarked: project.bookmarked,
    makerId: project.makerId,
    badge: "社区首发",
    url: project.url,
    logoUrl: project.logoUrl,
    qrUrl: project.qrUrl,
    makerAvatarUrl: project.makerAvatarUrl,
  };
}

export function Home() {
  const { user } = useAppSession();
  const router = useRouter();
  const [category, setCategory] = useState("全部");
  const [kind, setKind] = useState("全部");
  const [search, setSearch] = useState("");
  const [voted, setVoted] = useState<Array<number | string>>([1]);
  const [showSubmit, setShowSubmit] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [activeClaim, setActiveClaim] = useState<TaskClaimItem | null>(null);
  const [toast, setToast] = useState("");
  const [liveProjects, setLiveProjects] = useState<DisplayProject[]>([]);
  const [week, setWeek] = useState<CommunityWeek | null>(null);

  const notify = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2400);
  }, []);

  const loadPublicProjects = useCallback(async () => {
    try {
      const data = await api.listProjects();
      setLiveProjects(data.projects.map(toDisplayProject));
    } catch {
      // API 暂不可用时保留精选首发集展示
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const [data, weekData] = await Promise.all([api.listProjects(), api.communityWeek()]);
        if (cancelled) return;
        setLiveProjects(data.projects.map(toDisplayProject));
        setWeek(weekData);
      } catch {
        // API 暂不可用时保留已加载数据
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const allProjects = liveProjects;

  const visibleProjects = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allProjects.filter((project) => {
      const kindMatch = kind === "全部" || project.category === kind;
      const categoryMatch =
        category === "全部" || project.topics?.includes(category) || project.category === category;
      const searchMatch =
        !q ||
        `${project.name}${project.tagline}${project.category}${project.topics?.join("") ?? ""}`
          .toLowerCase()
          .includes(q);
      return kindMatch && categoryMatch && searchMatch;
    });
  }, [allProjects, category, kind, search]);

  const resetFilters = () => {
    setKind("全部");
    setCategory("全部");
    setSearch("");
  };

  const toggleVote = async (id: number | string) => {
    const wasVoted = voted.includes(id);
    setVoted((items) =>
      items.includes(id) ? items.filter((item) => item !== id) : [...items, id],
    );
    if (!user || typeof id !== "string") return;
    try {
      const res = await api.toggleVote(id);
      setLiveProjects((items) =>
        items.map((item) =>
          item.id === id
            ? { ...item, votes: item.votes + (res.voted ? 1 : -1), voted: res.voted }
            : item,
        ),
      );
    } catch {
      setVoted((items) => (wasVoted ? [...items, id] : items.filter((item) => item !== id)));
      notify("点赞失败，请稍后重试");
    }
  };

  const openSubmit = () => {
    if (!user) {
      setShowAuth(true);
      notify("登录后即可发布作品");
      return;
    }
    setShowSubmit(true);
  };

  const openAccount = () => {
    if (!user) {
      setShowAuth(true);
      return;
    }
    router.push("/me");
  };

  const openClaim = (claim: TaskClaimItem) => {
    setActiveClaim(claim);
  };

  return (
    <main>
      <SiteHeader
        user={user}
        search={search}
        setSearch={setSearch}
        showSearch={showSearch}
        setShowSearch={setShowSearch}
        onOpenSubmit={openSubmit}
        onOpenAccount={openAccount}
      />
      <Hero week={week} onOpenSubmit={openSubmit} />
      <Ticker week={week} />
      <Discover
        projects={visibleProjects}
        total={allProjects.length}
        category={category}
        setCategory={setCategory}
        kind={kind}
        setKind={setKind}
        resetFilters={resetFilters}
        voted={voted}
        onToggleVote={(id) => void toggleVote(id)}
        week={week}
        onNotify={notify}
        onOpenSearch={() => {
          setShowSearch(true);
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
      />
      <HelpSection
        loggedIn={Boolean(user)}
        week={week}
        onNotify={notify}
        onNeedAuth={() => {
          setShowAuth(true);
          notify("登录后才能领取任务");
        }}
        onOpenClaim={openClaim}
        onOpenLedger={() => {
          if (!user) {
            setShowAuth(true);
            notify("登录后查看火苗账本");
            return;
          }
          router.push("/me?tab=ledger");
        }}
      />
      <HowItWorks />
      <Footer />

      {showSubmit && (
        <SubmitModal
          onClose={() => setShowSubmit(false)}
          onNotify={notify}
          onSubmitted={(message) => {
            setShowSubmit(false);
            notify(message);
          }}
        />
      )}

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} onNotify={notify} />}

      {activeClaim && (
        <TaskClaimModal
          claim={activeClaim}
          onClose={() => setActiveClaim(null)}
          onNotify={notify}
          onChanged={() => void loadPublicProjects()}
        />
      )}

      <Toast message={toast} />
    </main>
  );
}

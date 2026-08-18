"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "@vibeember/shared";
import type { ProjectPublic } from "@vibeember/shared";
import { fallbackProjects } from "@/data/fallback";
import { useAppSession } from "@/lib/session";
import { projectPalettes, type DisplayProject } from "@/lib/types";
import { AccountModal } from "./modals/account-modal";
import { AuthModal } from "./modals/auth-modal";
import { SubmitModal } from "./modals/submit-modal";
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
    category: project.category,
    maker: project.maker,
    avatar: project.maker.slice(0, 1).toUpperCase(),
    icon: project.name.slice(0, 1).toUpperCase(),
    color: palette[0],
    accent: palette[1],
    votes: 0,
    comments: 0,
    badge: "社区首发",
    url: project.url,
    logoUrl: project.logoUrl,
    qrUrl: project.qrUrl,
    makerAvatarUrl: project.makerAvatarUrl,
  };
}

export function Home() {
  const { user } = useAppSession();
  const [category, setCategory] = useState("全部");
  const [search, setSearch] = useState("");
  const [voted, setVoted] = useState<Array<number | string>>([1]);
  const [joined, setJoined] = useState<number[]>([]);
  const [showSubmit, setShowSubmit] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [showAccount, setShowAccount] = useState(false);
  const [toast, setToast] = useState("");
  const [liveProjects, setLiveProjects] = useState<DisplayProject[]>([]);

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
        const data = await api.listProjects();
        if (!cancelled) {
          setLiveProjects(data.projects.map(toDisplayProject));
        }
      } catch {
        // API 暂不可用时保留精选首发集展示
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const allProjects = useMemo(() => [...liveProjects, ...fallbackProjects], [liveProjects]);

  const visibleProjects = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allProjects.filter((project) => {
      const categoryMatch = category === "全部" || project.category === category;
      const searchMatch =
        !q || `${project.name}${project.tagline}${project.category}`.toLowerCase().includes(q);
      return categoryMatch && searchMatch;
    });
  }, [allProjects, category, search]);

  const toggleVote = (id: number | string) => {
    setVoted((items) =>
      items.includes(id) ? items.filter((item) => item !== id) : [...items, id],
    );
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
    setShowAccount(true);
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
      <Hero onOpenSubmit={openSubmit} />
      <Ticker />
      <Discover
        projects={visibleProjects}
        category={category}
        setCategory={setCategory}
        voted={voted}
        onToggleVote={toggleVote}
        onNotify={notify}
        onOpenSearch={() => {
          setShowSearch(true);
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
      />
      <HelpSection joined={joined} setJoined={setJoined} onNotify={notify} />
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

      {showAccount && user && (
        <AccountModal
          user={user}
          onClose={() => setShowAccount(false)}
          onNotify={notify}
          onReviewed={() => void loadPublicProjects()}
        />
      )}

      <Toast message={toast} />
    </main>
  );
}

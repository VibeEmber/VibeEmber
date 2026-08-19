"use client";

import { useCallback, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { TaskClaimItem } from "@vibeember/shared";
import { useAppSession } from "@/lib/session";
import { AuthModal } from "./modals/auth-modal";
import { SubmitModal } from "./modals/submit-modal";
import { TaskClaimModal } from "./modals/task-claim-modal";
import { Footer } from "./footer";
import { SiteHeader } from "./site-header";
import { Toast } from "./toast";

interface AppChromeProps {
  children: ReactNode;
}

export function AppChrome({ children }: AppChromeProps) {
  const { user } = useAppSession();
  const pathname = usePathname();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [showSubmit, setShowSubmit] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [activeClaim, setActiveClaim] = useState<TaskClaimItem | null>(null);
  const [toast, setToast] = useState("");

  const notify = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2400);
  }, []);

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

  return (
    <>
      <SiteHeader
        user={user}
        search={search}
        setSearch={setSearch}
        showSearch={showSearch}
        setShowSearch={(value) => {
          if (value && pathname !== "/") {
            router.push("/#discover");
            return;
          }
          setShowSearch(value);
        }}
        onOpenSubmit={openSubmit}
        onOpenAccount={openAccount}
      />
      {children}
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
        />
      )}
      <Toast message={toast} />
    </>
  );
}

"use client";

import { Suspense } from "react";
import { AppChrome } from "@/components/app-chrome";
import { MeGate } from "@/components/me-center";

export default function MePage() {
  return (
    <AppChrome>
      <main className="me-page">
        <Suspense fallback={<div className="panel-empty">加载个人中心…</div>}>
          <MeGate />
        </Suspense>
      </main>
    </AppChrome>
  );
}

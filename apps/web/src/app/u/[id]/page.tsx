"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api, type PublicProfile } from "@vibeember/shared";
import { AppChrome } from "@/components/app-chrome";

export default function ProfilePage() {
  const params = useParams<{ id: string }>();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .profile(params.id)
      .then(setProfile)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "加载失败"));
  }, [params.id]);

  if (error)
    return (
      <AppChrome>
        <main className="section-wrap profile-page">{error}</main>
      </AppChrome>
    );
  if (!profile)
    return (
      <AppChrome>
        <main className="section-wrap profile-page">加载中…</main>
      </AppChrome>
    );

  return (
    <AppChrome>
      <main className="section-wrap profile-page">
        <div className="account-head profile-head">
          <span className="account-avatar">
            {profile.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.image} alt={profile.name} />
            ) : (
              profile.name.slice(0, 1)
            )}
          </span>
          <div>
            <span>信用 {profile.creditBand}</span>
            <h2>{profile.name}</h2>
            <p>{profile.bio || "这个人很安静，还没写简介。"}</p>
          </div>
        </div>
        <p className="profile-meta">
          {profile.projectCount} 个产品 · 助燃 {profile.helpCount} 次 · 累计火苗{" "}
          {profile.lifetimeEarned}
        </p>
        <div className="submission-list mine">
          {profile.projects.map((project) => (
            <article key={project.id}>
              <div>
                <span>{project.kindLabel}</span>
                <h4>
                  <a href={`/p/${project.id}`}>{project.name}</a>
                </h4>
                <p>{project.tagline}</p>
              </div>
            </article>
          ))}
          {profile.projects.length === 0 && <div className="panel-empty">还没有公开产品。</div>}
        </div>
      </main>
    </AppChrome>
  );
}

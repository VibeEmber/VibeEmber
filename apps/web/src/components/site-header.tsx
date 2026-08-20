"use client";
/* eslint-disable @next/next/no-img-element */

import { Bell, Plus, Search, UserCircle, X } from "lucide-react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { api, type NotificationItem, type SessionUser } from "@vibeember/shared";
import { EmberMark } from "./ember-mark";
import { notificationHref } from "@/lib/notification-href";

interface SiteHeaderProps {
  user: SessionUser | null;
  search: string;
  setSearch: (value: string) => void;
  showSearch: boolean;
  setShowSearch: (value: boolean) => void;
  onOpenSubmit: () => void;
  onOpenAccount: () => void;
}

export function SiteHeader({
  user,
  search,
  setSearch,
  showSearch,
  setShowSearch,
  onOpenSubmit,
  onOpenAccount,
}: SiteHeaderProps) {
  const pathname = usePathname();
  const [unread, setUnread] = useState(0);
  const [notes, setNotes] = useState<NotificationItem[]>([]);
  const [openNotes, setOpenNotes] = useState(false);
  const home = pathname === "/";

  useEffect(() => {
    if (!user) return;
    void api.notifications().then((data) => {
      setUnread(data.unread);
      setNotes(data.notifications);
    });
  }, [user]);

  return (
    <header className="site-header">
      <Link className="brand" href="/#top" aria-label="星火场首页">
        <span className="brand-mark">
          <EmberMark size={20} />
        </span>
        <span>星火场</span>
      </Link>
      <nav className="desktop-nav" aria-label="主导航">
        <Link className={home ? "active" : ""} href="/#discover">
          看星火
        </Link>
        <Link href="/#help">去助燃</Link>
        <Link href="/#how">怎么玩</Link>
      </nav>
      <div className="header-actions">
        <button
          className="icon-button"
          aria-label="搜索"
          onClick={() => setShowSearch(!showSearch)}
        >
          <Search size={20} />
        </button>
        <button
          className="icon-button notification"
          aria-label="通知"
          onClick={() => {
            setOpenNotes((value) => !value);
            if (user && unread) void api.readNotifications().then(() => setUnread(0));
          }}
        >
          <Bell size={20} />
          {unread > 0 && <i />}
        </button>
        <button className="submit-button" onClick={onOpenSubmit}>
          <Plus size={17} /> 发布产品
        </button>
        <button
          className={user ? "avatar-button signed-in" : "account-button"}
          aria-label="个人中心"
          onClick={onOpenAccount}
        >
          {user ? (
            user.image ? (
              <img src={user.image} alt={user.name} />
            ) : (
              user.name.slice(0, 1).toUpperCase()
            )
          ) : (
            <>
              <UserCircle size={17} /> 登录
            </>
          )}
        </button>
      </div>
      {showSearch && (
        <div className="header-search">
          <Search size={18} />
          <input
            autoFocus
            value={search}
            onChange={(event) => {
              const value = event.target.value;
              setSearch(value);
              if (value.length === 1) {
                document.getElementById("discover")?.scrollIntoView({ behavior: "smooth" });
              }
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" && search.trim()) {
                document.getElementById("discover")?.scrollIntoView({ behavior: "smooth" });
              }
            }}
            placeholder="搜索产品、功能或赛道…"
          />
          <button
            onClick={() => {
              setShowSearch(false);
              setSearch("");
            }}
            aria-label="关闭搜索"
          >
            <X size={17} />
          </button>
        </div>
      )}
      {openNotes && (
        <div className="notes-panel">
          {notes.length === 0 && <small>暂无通知</small>}
          {notes.map((item) => (
            <Link key={item.id} href={notificationHref(item)} onClick={() => setOpenNotes(false)}>
              <b>{item.title}</b>
              {item.body ? <span>{item.body}</span> : null}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}

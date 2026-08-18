"use client";
/* eslint-disable @next/next/no-img-element */

import { Bell, Plus, Search, UserCircle, X } from "lucide-react";
import type { SessionUser } from "@vibeember/shared";
import { EmberMark } from "./ember-mark";

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
  return (
    <header className="site-header">
      <a className="brand" href="#top" aria-label="星火场首页">
        <span className="brand-mark">
          <EmberMark size={20} />
        </span>
        <span>星火场</span>
        <small>EMBER</small>
      </a>
      <nav className="desktop-nav" aria-label="主导航">
        <a className="active" href="#discover">
          看星火
        </a>
        <a href="#help">
          去助燃 <span className="nav-dot">12</span>
        </a>
        <a href="#how">怎么玩</a>
      </nav>
      <div className="header-actions">
        <button
          className="icon-button"
          aria-label="搜索"
          onClick={() => setShowSearch(!showSearch)}
        >
          <Search size={20} />
        </button>
        <button className="icon-button notification" aria-label="通知">
          <Bell size={20} />
          <i />
        </button>
        <button className="submit-button" onClick={onOpenSubmit}>
          <Plus size={17} /> 发布项目
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
            onChange={(event) => setSearch(event.target.value)}
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
    </header>
  );
}

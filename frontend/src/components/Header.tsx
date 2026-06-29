'use client';

import { Menu, Search, Bell, LogOut, User as UserIcon } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

export default function Header({ onMenuToggle }: { onMenuToggle: () => void }) {
  const { user, isAuthenticated, logout } = useAuth();

  const getInitials = (name: string) => {
    return name ? name.charAt(0).toUpperCase() : 'U';
  };

  return (
    <header className="header">
      <div className="header-left">
        <button className="menu-toggle" onClick={onMenuToggle} aria-label="Toggle menu" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Menu size={20} />
        </button>
        <div className="header-search">
          <span style={{ color: 'var(--text-body-subtle)', display: 'flex', alignItems: 'center' }}>
            <Search size={16} />
          </span>
          <input
            type="text"
            placeholder="Tìm kiếm lỗ hổng, bài lab, tài liệu..."
            aria-label="Search"
          />
          <kbd style={{
            background: 'var(--bg-neutral-tertiary)',
            color: 'var(--text-body-subtle)',
            padding: '2px 6px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.6875rem',
            border: '1px solid var(--border-default)',
            fontFamily: 'var(--font-mono)',
          }}>⌘K</kbd>
        </div>
      </div>

      <div className="header-right">
        {isAuthenticated ? (
          <>
            {/* Notifications */}
            <button className="btn btn-ghost btn-icon" aria-label="Notifications" title="Thông báo" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Bell size={20} />
            </button>

            {/* User display */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: 'var(--radius-full)',
                background: 'var(--bg-brand)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.875rem',
                fontWeight: 700,
                color: 'var(--text-white)',
                cursor: 'pointer',
              }} title={user?.email}>
                {user ? getInitials(user.username) : 'U'}
              </div>
              <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-heading)' }}>
                {user?.username}
              </span>
            </div>

            {/* Logout */}
            <button
              className="btn btn-ghost btn-icon"
              onClick={logout}
              title="Đăng xuất"
              aria-label="Logout"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--fg-danger)' }}
            >
              <LogOut size={18} />
            </button>
          </>
        ) : (
          <div style={{ display: 'flex', gap: '10px' }}>
            <Link href="/login" className="btn btn-secondary btn-sm" style={{ padding: '6px 16px', fontSize: '13px' }}>
              Đăng nhập
            </Link>
            <Link href="/register" className="btn btn-primary btn-sm" style={{ padding: '6px 16px', fontSize: '13px' }}>
              Đăng ký
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}

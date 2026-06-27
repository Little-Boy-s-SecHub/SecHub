'use client';

import { Menu, Search, Bell } from 'lucide-react';

export default function Header({ onMenuToggle }: { onMenuToggle: () => void }) {
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
        {/* Notifications */}
        <button className="btn btn-ghost btn-icon" aria-label="Notifications" title="Thông báo" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Bell size={20} />
        </button>

        {/* User avatar */}
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
        }}>
          H
        </div>
      </div>
    </header>
  );
}

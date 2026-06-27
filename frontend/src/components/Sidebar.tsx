'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, BookOpen, ShieldAlert, FlaskConical } from 'lucide-react';

const navItems = [
  {
    section: 'Tổng quan',
    items: [
      { href: '/', icon: Home, label: 'Dashboard', badge: null },
    ],
  },
  {
    section: 'Học tập',
    items: [
      { href: '/learning', icon: BookOpen, label: 'Lộ trình học', badge: '3' },
      { href: '/vulnerabilities', icon: ShieldAlert, label: 'Lỗ hổng bảo mật', badge: '8' },
    ],
  },
  {
    section: 'Thực hành',
    items: [
      { href: '/labs', icon: FlaskConical, label: 'Phòng Lab', badge: '19' },
    ],
  },
];

export default function Sidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className={`sidebar-overlay${isOpen ? ' visible' : ''}`}
          onClick={onClose}
        />
      )}

      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        {/* Logo */}
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">SH</div>
          <span className="sidebar-logo-text">SecHub</span>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          {navItems.map((section) => (
            <div key={section.section} className="sidebar-section">
              <div className="sidebar-section-title">{section.section}</div>
              {section.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`sidebar-link ${isActive(item.href) ? 'active' : ''}`}
                  onClick={onClose}
                >
                  <span className="sidebar-link-icon" style={{ display: 'flex', alignItems: 'center' }}>
                    <item.icon size={18} />
                  </span>
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="sidebar-link-badge">{item.badge}</span>
                  )}
                </Link>
              ))}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          <div className="sidebar-footer-card">
            <div style={{ fontSize: '0.75rem', color: 'var(--text-body-subtle)', marginBottom: '4px' }}>
              SecHub v1.0
            </div>
            <div style={{ fontSize: '0.6875rem', color: 'var(--text-body-subtle)' }}>
              Nền tảng học Pentest Web
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

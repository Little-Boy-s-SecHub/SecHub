'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, BookOpen, ShieldAlert, FlaskConical, BrainCircuit, PenTool, Trophy } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';

export default function Sidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const { user } = useAuth();
  
  const [counts, setCounts] = useState({
    paths: 3,
    vulns: 8,
    labs: 19
  });

  useEffect(() => {
    Promise.all([
      api.learningPaths.getAll().catch(() => null),
      api.vulnerabilities.getAll().catch(() => null),
      api.labs.getLabs().catch(() => null)
    ]).then(([pathsRes, vulnsRes, labsRes]) => {
      setCounts({
        paths: (pathsRes && pathsRes.success && pathsRes.data) ? pathsRes.data.length : 3,
        vulns: (vulnsRes && vulnsRes.success && vulnsRes.data) ? vulnsRes.data.length : 8,
        labs: (labsRes && labsRes.success && labsRes.data) ? labsRes.data.length : 19
      });
    });
  }, []);

  const navItems = [
    {
      section: 'Tổng quan',
      items: [
        { href: '/', icon: Home, label: 'Dashboard', badge: null },
        { href: '/leaderboard', icon: Trophy, label: 'Bảng xếp hạng', badge: null },
      ],
    },
    {
      section: 'Học tập',
      items: [
        { href: '/learning', icon: BookOpen, label: 'Lộ trình học', badge: String(counts.paths) },
        { href: '/vulnerabilities', icon: ShieldAlert, label: 'Lỗ hổng bảo mật', badge: String(counts.vulns) },
        { href: '/review', icon: BrainCircuit, label: 'Ôn tập', badge: null },
      ],
    },
    {
      section: 'Thực hành',
      items: [
        { href: '/labs', icon: FlaskConical, label: 'Phòng Lab', badge: String(counts.labs) },
      ],
    },
  ];

  const visibleSections = user?.role === 'INSTRUCTOR' || user?.role === 'ADMIN'
    ? [...navItems, { section: 'Sáng tạo', items: [{ href: '/author', icon: PenTool, label: 'Author Studio', badge: null }] }]
    : navItems;

  const handleNavigate = () => {
    if (window.matchMedia('(max-width: 768px)').matches) {
      onClose();
    }
  };

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
          {visibleSections.map((section) => (
            <div key={section.section} className="sidebar-section">
              <div className="sidebar-section-title">{section.section}</div>
              {section.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`sidebar-link ${isActive(item.href) ? 'active' : ''}`}
                  onClick={handleNavigate}
                  aria-current={isActive(item.href) ? 'page' : undefined}
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

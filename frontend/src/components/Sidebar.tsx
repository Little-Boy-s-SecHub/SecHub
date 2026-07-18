'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, BookOpen, ShieldAlert, FlaskConical, BrainCircuit, PenTool, Trophy } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from '@/context/LanguageContext';
import { api } from '@/lib/api';

export default function Sidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const { t } = useTranslation();
  
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
      section: t('sidebar.overview'),
      items: [
        { href: '/', icon: Home, label: t('sidebar.dashboard'), badge: null },
        { href: '/leaderboard', icon: Trophy, label: t('sidebar.leaderboard'), badge: null },
      ],
    },
    {
      section: t('sidebar.learning'),
      items: [
        { href: '/learning', icon: BookOpen, label: t('sidebar.learningPaths'), badge: String(counts.paths) },
        { href: '/vulnerabilities', icon: ShieldAlert, label: t('sidebar.vulnerabilities'), badge: String(counts.vulns) },
        { href: '/review', icon: BrainCircuit, label: t('sidebar.review'), badge: null },
      ],
    },
    {
      section: t('sidebar.practice'),
      items: [
        { href: '/labs', icon: FlaskConical, label: t('sidebar.labs'), badge: String(counts.labs) },
      ],
    },
  ];

  const visibleSections = user?.role === 'INSTRUCTOR' || user?.role === 'ADMIN'
    ? [...navItems, { section: t('sidebar.creator'), items: [{ href: '/author', icon: PenTool, label: t('sidebar.authorStudio'), badge: null }] }]
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
              {t('sidebar.version')}
            </div>
            <div style={{ fontSize: '0.6875rem', color: 'var(--text-body-subtle)' }}>
              {t('sidebar.footerDesc')}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

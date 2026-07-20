'use client';

import { useState, useEffect, useRef } from 'react';
import { Menu, Search, Bell, LogOut, User as UserIcon, KeyRound, Image as ImageIcon, X, Lock, Check } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from '@/context/LanguageContext';
import Link from 'next/link';
import { api, AppNotification, isAuthExpiredError, resolveApiUrl } from '@/lib/api';

export default function Header({ onMenuToggle }: { onMenuToggle: () => void }) {
  const { user, isAuthenticated, logout, updateUser } = useAuth();
  const { language, setLanguage, t } = useTranslation();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const unreadCount = notifications.filter((notification) => !notification.read).length;
  const notificationsEnabled = user?.notificationsEnabled !== false;
  
  // Dropdowns state
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Modals state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);

  // Password form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Avatar form state
  const [customAvatarUrl, setCustomAvatarUrl] = useState('');
  const [avatarError, setAvatarError] = useState('');
  const [avatarSuccess, setAvatarSuccess] = useState('');
  const [avatarLoading, setAvatarLoading] = useState(false);

  const presetGradients = [
    { name: language === 'vi' ? 'Xanh Dương Tím' : 'Blue Purple', value: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)' },
    { name: language === 'vi' ? 'Xanh Lục Ngọc' : 'Emerald Teal', value: 'linear-gradient(135deg, #10b981 0%, #14b8a6 100%)' },
    { name: language === 'vi' ? 'Cam Vàng Rực' : 'Amber Orange', value: 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)' },
    { name: language === 'vi' ? 'Hồng Đỏ Thắm' : 'Rose Pink', value: 'linear-gradient(135deg, #f43f5e 0%, #ec4899 100%)' },
    { name: language === 'vi' ? 'Xanh Dương Sáng' : 'Indigo Sky', value: 'linear-gradient(135deg, #6366f1 0%, #0ea5e9 100%)' },
    { name: language === 'vi' ? 'Xám Đá Trầm' : 'Slate Dark', value: 'linear-gradient(135deg, #475569 0%, #1e293b 100%)' }
  ];

  const getInitials = (name: string) => {
    return name ? name.charAt(0).toUpperCase() : 'U';
  };

  useEffect(() => {
    if (!isAuthenticated || !notificationsEnabled) {
      const timeout = window.setTimeout(() => {
        setNotifications([]);
        setIsDropdownOpen(false);
      }, 0);
      return () => window.clearTimeout(timeout);
    }

    let isMounted = true;
    let stream: EventSource | null = null;
    let fallbackInterval: ReturnType<typeof setInterval> | null = null;

    const loadNotifications = async () => {
      try {
        const res = await api.notifications.list();
        if (isMounted) {
          setNotifications(res.data || []);
        }
      } catch (err) {
        if (isAuthExpiredError(err)) {
          setNotifications([]);
          setIsDropdownOpen(false);
          return;
        }
        console.error('Error fetching notifications:', err);
      }
    };

    loadNotifications();

    const token = localStorage.getItem('sechub_token');
    if (token) {
      stream = new EventSource(resolveApiUrl(`/notifications/stream?access_token=${encodeURIComponent(token)}`));
      stream.addEventListener('notification', (event) => {
        try {
          const incoming = JSON.parse((event as MessageEvent).data) as AppNotification;
          setNotifications((current) => [incoming, ...current.filter((item) => item.id !== incoming.id)].slice(0, 20));
        } catch (err) {
          console.error('Error parsing notification event:', err);
        }
      });
      stream.addEventListener('notifications-updated', () => {
        loadNotifications();
      });
      stream.addEventListener('notifications-disabled', () => {
        setNotifications([]);
        stream?.close();
      });
      stream.onerror = () => {
        stream?.close();
      };
    } else {
      fallbackInterval = setInterval(loadNotifications, 15000);
    }

    return () => {
      isMounted = false;
      stream?.close();
      if (fallbackInterval) {
        clearInterval(fallbackInterval);
      }
    };
  }, [isAuthenticated, notificationsEnabled, user?.id]);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleBellClick = () => {
    const shouldOpen = !isDropdownOpen;
    setIsDropdownOpen(shouldOpen);
    if (shouldOpen && notificationsEnabled) {
      const unreadIds = notifications.filter((notification) => !notification.read).map((notification) => notification.id);
      if (unreadIds.length > 0) {
        setNotifications((current) => current.map((notification) => (
          unreadIds.includes(notification.id)
            ? { ...notification, read: true, readAt: new Date().toISOString() }
            : notification
        )));
        api.notifications.markRead(unreadIds).catch((err) => {
          if (isAuthExpiredError(err)) {
            setNotifications([]);
            setIsDropdownOpen(false);
            return;
          }
          console.error('Error marking notifications as read:', err);
          api.notifications.list().then((res) => setNotifications(res.data || [])).catch(() => {});
        });
      }
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError(language === 'vi' ? 'Vui lòng điền đầy đủ các trường' : 'Please fill in all fields');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError(language === 'vi' ? 'Mật khẩu mới và xác nhận mật khẩu không khớp' : 'New password and confirmation do not match');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError(language === 'vi' ? 'Mật khẩu mới phải từ 6 ký tự trở lên' : 'New password must be at least 6 characters');
      return;
    }

    setPasswordLoading(true);
    try {
      const res = await fetch(resolveApiUrl('/users/me/password'), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('sechub_token')}`
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setPasswordSuccess(t('header.passwordSuccess'));
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => setShowPasswordModal(false), 1500);
      } else {
        setPasswordError(data.message || (language === 'vi' ? 'Mật khẩu hiện tại chưa chính xác' : 'Incorrect current password'));
      }
    } catch {
      setPasswordError(language === 'vi' ? 'Có lỗi xảy ra, vui lòng thử lại' : 'An error occurred, please try again');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleAvatarSubmit = async (url: string) => {
    if (!url) {
      setAvatarError(language === 'vi' ? 'Vui lòng chọn hoặc nhập URL ảnh đại diện' : 'Please select or enter an avatar URL');
      return;
    }
    setAvatarError('');
    setAvatarSuccess('');
    setAvatarLoading(true);

    try {
      const res = await fetch(resolveApiUrl('/users/me/avatar'), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('sechub_token')}`
        },
        body: JSON.stringify({ avatarUrl: url })
      });
      const data = await res.json();
      if (res.ok && data.success && data.data) {
        updateUser(data.data);
        setAvatarSuccess(t('header.avatarSuccess'));
        setCustomAvatarUrl('');
        setTimeout(() => setShowAvatarModal(false), 1500);
      } else {
        setAvatarError(data.message || (language === 'vi' ? 'Cập nhật không thành công' : 'Update failed'));
      }
    } catch {
      setAvatarError(language === 'vi' ? 'Có lỗi xảy ra, vui lòng thử lại' : 'An error occurred, please try again');
    } finally {
      setAvatarLoading(false);
    }
  };

  return (
    <header className="header">
      <style>{`
        /* Custom modal design styling */
        .custom-modal-card {
          background: var(--bg-neutral-primary) !important;
          border: 1px solid var(--border-default) !important;
          border-radius: 12px !important;
          box-shadow: 0 20px 50px rgba(0,0,0,0.3), 0 0 0 1px rgba(0,0,0,0.05) !important;
          width: 100%;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .custom-modal-header {
          padding: 16px 20px !important;
          border-bottom: 1px solid var(--border-default) !important;
          display: flex !important;
          justify-content: space-between !important;
          align-items: center !important;
          background: var(--bg-neutral-secondary-soft) !important;
        }
        .custom-modal-label {
          font-size: 11px !important;
          font-weight: 800 !important;
          color: var(--text-body) !important;
          letter-spacing: 0.05em !important;
        }
        .custom-modal-input {
          background: var(--bg-neutral-secondary) !important;
          border: 1px solid var(--border-default) !important;
          border-radius: 8px !important;
          padding: 10px 12px !important;
          color: var(--text-heading) !important;
          font-size: 13px !important;
          outline: none !important;
          box-shadow: inset 0 1px 2px rgba(0,0,0,0.04) !important;
          transition: border-color 0.15s, box-shadow 0.15s !important;
          width: 100% !important;
        }
        .custom-modal-input:focus {
          border-color: var(--border-brand) !important;
          box-shadow: inset 0 1px 2px rgba(0,0,0,0.04), 0 0 0 2px var(--bg-brand-soft) !important;
        }
        .custom-modal-btn-secondary {
          background: var(--bg-neutral-secondary) !important;
          border: 1px solid var(--border-default) !important;
          color: var(--text-heading) !important;
          padding: 8px 16px !important;
          font-size: 13px !important;
          border-radius: 6px !important;
          font-weight: 600 !important;
          cursor: pointer !important;
          transition: background-color 0.15s, border-color 0.15s !important;
        }
        .custom-modal-btn-secondary:hover {
          background: var(--bg-neutral-secondary-soft) !important;
          border-color: var(--border-default-strong) !important;
        }
        .custom-modal-btn-primary {
          background: var(--fg-brand) !important;
          border: 1px solid var(--fg-brand) !important;
          color: var(--text-white) !important;
          padding: 8px 20px !important;
          font-size: 13px !important;
          border-radius: 6px !important;
          font-weight: 700 !important;
          cursor: pointer !important;
          transition: opacity 0.15s !important;
        }
        .custom-modal-btn-primary:hover {
          opacity: 0.9 !important;
        }
        .custom-modal-btn-primary:disabled {
          opacity: 0.6 !important;
          cursor: not-allowed !important;
        }
        
        .header-user-display:hover span {
          color: var(--fg-brand) !important;
        }
        .header-user-display:hover div {
          opacity: 0.9;
        }
      `}</style>

      <div className="header-left">
        <button className="menu-toggle" onClick={onMenuToggle} aria-label="Toggle menu">
          <Menu size={20} />
        </button>
        <div className="header-search">
          <span style={{ color: 'var(--text-body-subtle)', display: 'flex', alignItems: 'center' }}>
            <Search size={16} />
          </span>
          <input
            type="text"
            placeholder={t('header.searchPlaceholder')}
            aria-label="Search"
            style={{
              background: 'transparent',
              border: 'none',
              outline: 'none',
              boxShadow: 'none',
              padding: 0,
              margin: '0 0 0 8px',
              width: '100%',
              color: 'var(--text-heading)',
              fontFamily: 'inherit',
              fontSize: '14px',
            }}
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

      <div className="header-right" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Language Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-neutral-secondary)', border: '1px solid var(--border-default)', borderRadius: '20px', padding: '2px' }}>
          <button
            onClick={() => setLanguage('en')}
            style={{
              padding: '4px 10px',
              borderRadius: '16px',
              fontSize: '11px',
              fontWeight: 800,
              cursor: 'pointer',
              border: 'none',
              background: language === 'en' ? 'var(--bg-brand)' : 'transparent',
              color: language === 'en' ? '#fff' : 'var(--text-body-subtle)',
              transition: 'background-color 0.15s, color 0.15s'
            }}
          >
            EN
          </button>
          <button
            onClick={() => setLanguage('vi')}
            style={{
              padding: '4px 10px',
              borderRadius: '16px',
              fontSize: '11px',
              fontWeight: 800,
              cursor: 'pointer',
              border: 'none',
              background: language === 'vi' ? 'var(--bg-brand)' : 'transparent',
              color: language === 'vi' ? '#fff' : 'var(--text-body-subtle)',
              transition: 'background-color 0.15s, color 0.15s'
            }}
          >
            VI
          </button>
        </div>

        {isAuthenticated ? (
          <>
            {/* Notifications */}
            <div ref={dropdownRef} style={{ position: 'relative' }}>
              <button 
                className="btn btn-ghost btn-icon" 
                aria-label={t('header.notifications')} 
                title={t('header.notifications')} 
                onClick={handleBellClick}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}
              >
                <Bell size={20} />
                {notificationsEnabled && unreadCount > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: '6px',
                    right: '6px',
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: 'var(--fg-danger)',
                    boxShadow: '0 0 0 2px var(--bg-neutral-primary)'
                  }} />
                )}
              </button>

              {isDropdownOpen && (
                <div style={{
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  right: 0,
                  width: '320px',
                  background: 'var(--bg-neutral-secondary)',
                  border: '1px solid var(--border-default)',
                  borderRadius: '12px',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.5), 0 0 20px rgba(56,189,248,0.05)',
                  zIndex: 9999,
                  padding: '12px 0'
                }}>
                  <div style={{
                    padding: '0 16px 8px',
                    borderBottom: '1px solid var(--border-default)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-heading)' }}>{t('header.notifications')}</span>
                    {notificationsEnabled && unreadCount > 0 && (
                      <span style={{ fontSize: '10px', background: 'var(--bg-brand-soft)', color: 'var(--fg-brand)', padding: '2px 6px', borderRadius: '10px', fontWeight: 700 }}>
                        {unreadCount} {language === 'vi' ? 'mới' : 'new'}
                      </span>
                    )}
                  </div>

                  <div style={{ maxHeight: '240px', overflowY: 'auto', padding: '4px' }}>
                    {notificationsEnabled && notifications.map((notif) => {
                      const isUnread = !notif.read;
                      return (
                        <div 
                          key={notif.id}
                          style={{
                            padding: '10px 12px',
                            borderRadius: '8px',
                            fontSize: '12px',
                            color: isUnread ? 'var(--text-heading)' : 'var(--text-body-subtle)',
                            background: isUnread ? 'rgba(56, 189, 248, 0.03)' : 'transparent',
                            marginBottom: '4px',
                            lineHeight: '1.4',
                            display: 'flex',
                            gap: '8px',
                            alignItems: 'flex-start',
                            transition: 'background-color 0.15s'
                          }}
                        >
                          <span style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            background: isUnread ? 'var(--fg-brand)' : 'transparent',
                            marginTop: '5px',
                            flexShrink: 0
                          }} />
                          <span>
                            <strong style={{ display: 'block', color: isUnread ? 'var(--text-heading)' : 'inherit', marginBottom: '2px' }}>{notif.title}</strong>
                            {notif.message}
                          </span>
                        </div>
                      );
                    })}

                    {!notificationsEnabled && (
                      <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-body-subtle)', fontSize: '12.5px' }}>
                        {language === 'vi' ? 'Thông báo đang tắt trong cài đặt hồ sơ' : 'Notifications are turned off in profile settings'}
                      </div>
                    )}

                    {notificationsEnabled && notifications.length === 0 && (
                      <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-body-subtle)', fontSize: '12.5px' }}>
                        {language === 'vi' ? 'Không có thông báo mới nào' : 'No new notifications'}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User display Dropdown */}
            <div ref={userMenuRef} style={{ position: 'relative' }}>
              <div 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px', 
                  cursor: 'pointer' 
                }}
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="header-user-display"
              >
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: 'var(--radius-full)',
                  background: user?.avatarUrl && !user.avatarUrl.startsWith('http') && !user.avatarUrl.startsWith('/') ? user.avatarUrl : 'var(--bg-brand)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  color: 'var(--text-white)',
                  transition: 'opacity 0.15s',
                  overflow: 'hidden',
                  flexShrink: 0
                }} title={user?.email}>
                  {user?.avatarUrl && (user.avatarUrl.startsWith('http') || user.avatarUrl.startsWith('/')) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={user.avatarUrl} alt={user.username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    user ? getInitials(user.username) : 'U'
                  )}
                </div>
                <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-heading)', transition: 'color 0.15s' }}>
                  {user?.username}
                </span>
              </div>

              {isUserMenuOpen && (
                <div style={{
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  right: 0,
                  width: '200px',
                  background: 'var(--bg-neutral-secondary)',
                  border: '1px solid var(--border-default)',
                  borderRadius: '12px',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.5), 0 0 20px rgba(56,189,248,0.05)',
                  zIndex: 9999,
                  padding: '6px'
                }}>
                  <Link 
                    href="/profile"
                    onClick={() => setIsUserMenuOpen(false)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      fontSize: '13px',
                      color: 'var(--text-body)',
                      textDecoration: 'none',
                      transition: 'background-color 0.15s, color 0.15s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'var(--bg-neutral-secondary-soft)';
                      e.currentTarget.style.color = 'var(--text-heading)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = 'var(--text-body)';
                    }}
                  >
                    <UserIcon size={16} /> <span>{t('header.viewProfile')}</span>
                  </Link>

                  <button 
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      setShowAvatarModal(true);
                    }}
                    style={{
                      width: '100%',
                      border: 'none',
                      background: 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      fontSize: '13px',
                      color: 'var(--text-body)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'background-color 0.15s, color 0.15s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'var(--bg-neutral-secondary-soft)';
                      e.currentTarget.style.color = 'var(--text-heading)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = 'var(--text-body)';
                    }}
                  >
                    <ImageIcon size={16} /> <span>{t('header.changeAvatar')}</span>
                  </button>

                  <button 
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      setShowPasswordModal(true);
                    }}
                    style={{
                      width: '100%',
                      border: 'none',
                      background: 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      fontSize: '13px',
                      color: 'var(--text-body)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'background-color 0.15s, color 0.15s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'var(--bg-neutral-secondary-soft)';
                      e.currentTarget.style.color = 'var(--text-heading)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = 'var(--text-body)';
                    }}
                  >
                    <KeyRound size={16} /> <span>{t('header.changePassword')}</span>
                  </button>

                  <div style={{ height: '1px', background: 'var(--border-default)', margin: '4px 0' }} />

                  <button 
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      logout();
                    }}
                    style={{
                      width: '100%',
                      border: 'none',
                      background: 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      fontSize: '13px',
                      color: 'var(--fg-danger)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'background-color 0.15s, opacity 0.15s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <LogOut size={16} /> <span>{t('header.logout')}</span>
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <div style={{ display: 'flex', gap: '10px' }}>
            <Link href="/login" className="btn btn-secondary btn-sm" style={{ padding: '6px 16px', fontSize: '13px' }}>
              {t('header.login')}
            </Link>
            <Link href="/register" className="btn btn-primary btn-sm" style={{ padding: '6px 16px', fontSize: '13px' }}>
              {t('header.register')}
            </Link>
          </div>
        )}
      </div>

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(9, 15, 30, 0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 99999,
          padding: '20px'
        }}>
          <div className="custom-modal-card" style={{ maxWidth: '400px' }}>
            <div className="custom-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Lock size={18} style={{ color: 'var(--fg-brand)' }} />
                <span style={{ fontWeight: 850, fontSize: '1.05rem', color: 'var(--text-heading)' }}>{t('header.passwordModalTitle')}</span>
              </div>
              <button 
                onClick={() => {
                  if (!passwordLoading) {
                    setShowPasswordModal(false);
                    setPasswordError('');
                    setPasswordSuccess('');
                  }
                }}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-body-subtle)', cursor: 'pointer', display: 'flex' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handlePasswordSubmit} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {passwordError && (
                <div style={{ color: '#ef4444', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', padding: '10px', borderRadius: '6px', fontSize: '12.5px' }}>
                  {passwordError}
                </div>
              )}
              {passwordSuccess && (
                <div style={{ color: 'var(--fg-success-strong)', background: 'var(--bg-success-softer)', border: '1px solid var(--border-success-subtle)', padding: '10px', borderRadius: '6px', fontSize: '12.5px' }}>
                  {passwordSuccess}
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label className="custom-modal-label">{t('header.currentPassword').toUpperCase()}</label>
                <input 
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="custom-modal-input"
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label className="custom-modal-label">{t('header.newPassword').toUpperCase()}</label>
                <input 
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="custom-modal-input"
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label className="custom-modal-label">{t('header.confirmNewPassword').toUpperCase()}</label>
                <input 
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="custom-modal-input"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
                <button 
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  disabled={passwordLoading}
                  className="custom-modal-btn-secondary"
                >
                  {t('common.cancel')}
                </button>
                <button 
                  type="submit"
                  disabled={passwordLoading}
                  className="custom-modal-btn-primary"
                >
                  {passwordLoading ? t('common.loading') : t('common.submit')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change Avatar Modal */}
      {showAvatarModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(9, 15, 30, 0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 99999,
          padding: '20px'
        }}>
          <div className="custom-modal-card" style={{ maxWidth: '440px' }}>
            <div className="custom-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ImageIcon size={18} style={{ color: 'var(--fg-brand)' }} />
                <span style={{ fontWeight: 850, fontSize: '1.05rem', color: 'var(--text-heading)' }}>{t('header.avatarModalTitle')}</span>
              </div>
              <button 
                onClick={() => {
                  if (!avatarLoading) {
                    setShowAvatarModal(false);
                    setAvatarError('');
                    setAvatarSuccess('');
                  }
                }}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-body-subtle)', cursor: 'pointer', display: 'flex' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {avatarError && (
                <div style={{ color: '#ef4444', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', padding: '10px', borderRadius: '6px', fontSize: '12.5px' }}>
                  {avatarError}
                </div>
              )}
              {avatarSuccess && (
                <div style={{ color: 'var(--fg-success-strong)', background: 'var(--bg-success-softer)', border: '1px solid var(--border-success-subtle)', padding: '10px', borderRadius: '6px', fontSize: '12.5px' }}>
                  {avatarSuccess}
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label className="custom-modal-label">{t('header.avatarSelectGradient')}</label>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '8px'
                }}>
                  {presetGradients.map((gradient) => {
                    const isSelected = user?.avatarUrl === gradient.value;
                    return (
                      <button
                        key={gradient.value}
                        onClick={() => handleAvatarSubmit(gradient.value)}
                        disabled={avatarLoading}
                        style={{
                          height: '54px',
                          borderRadius: '8px',
                          background: gradient.value,
                          border: isSelected ? '3px solid var(--fg-brand)' : '1px solid var(--border-default)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          position: 'relative',
                          transition: 'transform 0.15s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.03)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                      >
                        {isSelected && <Check size={18} style={{ color: '#fff', filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.5))' }} />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div style={{ height: '1px', background: 'var(--border-default)', margin: '4px 0' }} />

              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label className="custom-modal-label">{t('header.avatarCustomUrl')}</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input 
                    type="text"
                    value={customAvatarUrl}
                    onChange={(e) => setCustomAvatarUrl(e.target.value)}
                    placeholder={t('header.avatarUrlPlaceholder')}
                    className="custom-modal-input"
                    style={{ flex: 1 }}
                  />
                  <button
                    onClick={() => handleAvatarSubmit(customAvatarUrl)}
                    disabled={avatarLoading || !customAvatarUrl}
                    className="custom-modal-btn-primary"
                    style={{ padding: '0 16px' }}
                  >
                    {t('common.save')}
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
                <button 
                  type="button"
                  onClick={() => setShowAvatarModal(false)}
                  disabled={avatarLoading}
                  className="custom-modal-btn-secondary"
                >
                  {t('common.cancel')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Shield, Lock, User, AlertCircle } from 'lucide-react';
import PageBackLink from '@/components/PageBackLink';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Vui lòng điền đầy đủ tên đăng nhập và mật khẩu.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      await login(username, password);
      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '80vh',
      padding: 'var(--space-2)'
    }}>
      <div className="card animate-fade-in-up" style={{
        width: '100%',
        maxWidth: '420px',
        padding: 'var(--space-4)',
        boxShadow: 'var(--shadow-xl)'
      }}>
        <PageBackLink href="/" label="Quay lại Dashboard" />
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-3)' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '48px',
            height: '48px',
            borderRadius: 'var(--radius-base)',
            background: 'var(--bg-brand)',
            color: 'var(--text-white)',
            marginBottom: 'var(--space-2)'
          }}>
            <Shield size={24} />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '4px' }}>Đăng nhập SecHub</h2>
          <p style={{ fontSize: '13px', color: 'var(--text-body-subtle)', margin: '0 auto' }}>
            Nền tảng thực hành an toàn thông tin
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="flag-result-wrong" style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px',
            marginBottom: 'var(--space-2)',
            borderRadius: 'var(--radius-sm)',
            padding: '12px',
            fontSize: '13px'
          }}>
            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>{error}</div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          <div>
            <label htmlFor="username" style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: 500,
              color: 'var(--text-heading)',
              marginBottom: '6px'
            }}>
              Tên đăng nhập
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-body-subtle)',
                display: 'flex',
                alignItems: 'center'
              }}>
                <User size={16} />
              </span>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Nhập tên đăng nhập"
                style={{
                  width: '100%',
                  background: 'var(--bg-neutral-secondary-medium)',
                  border: '1px solid var(--border-default-medium)',
                  borderRadius: 'var(--radius-default)',
                  padding: '10px 16px 10px 36px',
                  color: 'var(--text-heading)',
                  fontSize: '14px',
                  outline: 'none'
                }}
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: 500,
              color: 'var(--text-heading)',
              marginBottom: '6px'
            }}>
              Mật khẩu
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-body-subtle)',
                display: 'flex',
                alignItems: 'center'
              }}>
                <Lock size={16} />
              </span>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{
                  width: '100%',
                  background: 'var(--bg-neutral-secondary-medium)',
                  border: '1px solid var(--border-default-medium)',
                  borderRadius: 'var(--radius-default)',
                  padding: '10px 16px 10px 36px',
                  color: 'var(--text-heading)',
                  fontSize: '14px',
                  outline: 'none'
                }}
                disabled={loading}
              />
            </div>
          </div>

          <button
            className="btn btn-primary"
            type="submit"
            style={{ width: '100%', marginTop: 'var(--space-1)', padding: '12px' }}
            disabled={loading}
          >
            {loading ? 'Đang xác thực...' : 'Đăng nhập'}
          </button>
        </form>

        {/* Footer */}
        <div style={{
          textAlign: 'center',
          marginTop: 'var(--space-3)',
          fontSize: '13px',
          color: 'var(--text-body-subtle)'
        }}>
          Chưa có tài khoản?{' '}
          <Link href="/register" style={{ fontWeight: 600, color: 'var(--fg-brand)' }}>
            Đăng ký ngay
          </Link>
        </div>
      </div>
    </div>
  );
}

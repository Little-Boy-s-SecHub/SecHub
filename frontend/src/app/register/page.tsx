'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Shield, Lock, User, Mail, AlertCircle } from 'lucide-react';

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !email.trim() || !password.trim()) {
      setError('Vui lòng điền đầy đủ các thông tin bắt buộc.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Mật khẩu nhập lại không khớp.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      await register(username, email, password);
      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Đăng ký thất bại. Tên đăng nhập hoặc email có thể đã được sử dụng.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '85vh',
      padding: 'var(--space-2)'
    }}>
      <div className="card animate-fade-in-up" style={{
        width: '100%',
        maxWidth: '440px',
        padding: 'var(--space-4)',
        boxShadow: 'var(--shadow-xl)'
      }}>
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
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '4px' }}>Tạo tài khoản mới</h2>
          <p style={{ fontSize: '13px', color: 'var(--text-body-subtle)', margin: '0 auto' }}>
            Bắt đầu lộ trình học và thực hành kiểm thử bảo mật
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
              Tên đăng nhập *
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
            <label htmlFor="email" style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: 500,
              color: 'var(--text-heading)',
              marginBottom: '6px'
            }}>
              Địa chỉ Email *
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
                <Mail size={16} />
              </span>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@sechub.vn"
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
              Mật khẩu *
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

          <div>
            <label htmlFor="confirmPassword" style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: 500,
              color: 'var(--text-heading)',
              marginBottom: '6px'
            }}>
              Nhập lại mật khẩu *
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
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
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
            {loading ? 'Đang khởi tạo...' : 'Đăng ký tài khoản'}
          </button>
        </form>

        {/* Footer */}
        <div style={{
          textAlign: 'center',
          marginTop: 'var(--space-3)',
          fontSize: '13px',
          color: 'var(--text-body-subtle)'
        }}>
          Đã có tài khoản?{' '}
          <Link href="/login" style={{ fontWeight: 600, color: 'var(--fg-brand)' }}>
            Đăng nhập
          </Link>
        </div>
      </div>
    </div>
  );
}

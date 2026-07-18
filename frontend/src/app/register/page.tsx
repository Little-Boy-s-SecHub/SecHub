'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from '@/context/LanguageContext';
import { Shield, Lock, User, Mail, AlertCircle } from 'lucide-react';
import PageBackLink from '@/components/PageBackLink';

export default function RegisterPage() {
  const { register } = useAuth();
  const { language } = useTranslation();
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
      setError(language === 'vi' ? 'Vui lòng điền đầy đủ các thông tin bắt buộc.' : 'Please fill in all required fields.');
      return;
    }

    if (password !== confirmPassword) {
      setError(language === 'vi' ? 'Mật khẩu nhập lại không khớp.' : 'Passwords do not match.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      await register(username, email, password);
      router.push('/');
    } catch (err: any) {
      setError(err.message || (language === 'vi' ? 'Đăng ký thất bại. Tên đăng nhập hoặc email có thể đã được sử dụng.' : 'Registration failed. The username or email may already be in use.'));
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
        <PageBackLink href="/" label={language === 'vi' ? 'Quay lại Dashboard' : 'Back to Dashboard'} />
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
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '4px' }}>{language === 'vi' ? 'Tạo tài khoản mới' : 'Create New Account'}</h2>
          <p style={{ fontSize: '13px', color: 'var(--text-body-subtle)', margin: '0 auto' }}>
            {language === 'vi' ? 'Bắt đầu lộ trình học và thực hành kiểm thử bảo mật' : 'Start your security learning path & practice labs'}
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
              {language === 'vi' ? 'Tên đăng nhập' : 'Username'} *
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
                placeholder={language === 'vi' ? 'Nhập tên đăng nhập' : 'Enter your username'}
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
              {language === 'vi' ? 'Địa chỉ Email' : 'Email Address'} *
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
              {language === 'vi' ? 'Mật khẩu' : 'Password'} *
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
              {language === 'vi' ? 'Nhập lại mật khẩu' : 'Confirm Password'} *
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
            {loading ? (language === 'vi' ? 'Đang khởi tạo...' : 'Registering...') : (language === 'vi' ? 'Đăng ký tài khoản' : 'Register Account')}
          </button>
        </form>

        {/* Footer */}
        <div style={{
          textAlign: 'center',
          marginTop: 'var(--space-3)',
          fontSize: '13px',
          color: 'var(--text-body-subtle)'
        }}>
          {language === 'vi' ? 'Đã có tài khoản?' : 'Already have an account?'}{' '}
          <Link href="/login" style={{ fontWeight: 600, color: 'var(--fg-brand)' }}>
            {language === 'vi' ? 'Đăng nhập' : 'Log in'}
          </Link>
        </div>
      </div>
    </div>
  );
}

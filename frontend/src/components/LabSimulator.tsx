'use client';

import { useState } from 'react';
import { Shield, Search, User } from 'lucide-react';
import { useTranslation } from '@/context/LanguageContext';

interface LabSimulatorProps {
  dockerPort: number;
  flag: string;
  onSuccess: (flag: string) => void;
}

export default function LabSimulator({ dockerPort, flag, onSuccess }: LabSimulatorProps) {
  return (
    <div style={{
      border: '1px solid var(--border-default)',
      borderRadius: 'var(--radius-sm)',
      overflow: 'hidden',
      background: 'var(--bg-neutral-primary-medium)',
      boxShadow: 'var(--shadow-md)',
      marginTop: 'var(--space-2)'
    }}>
      {/* Top Bar simulating a browser window */}
      <div style={{
        background: 'var(--bg-neutral-tertiary)',
        padding: '8px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        borderBottom: '1px solid var(--border-default)'
      }}>
        <div style={{ display: 'flex', gap: '6px' }}>
          <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ff5f56', display: 'inline-block' }}></span>
          <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ffbd2e', display: 'inline-block' }}></span>
          <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#27c93f', display: 'inline-block' }}></span>
        </div>
        <div style={{
          background: 'var(--bg-neutral-secondary-medium)',
          borderRadius: 'var(--radius-default)',
          padding: '4px 16px',
          fontSize: '12px',
          color: 'var(--text-body-subtle)',
          flex: 1,
          fontFamily: 'var(--font-mono)',
          textAlign: 'center',
          maxWidth: '500px',
          margin: '0 auto',
          border: '1px solid var(--border-default-medium)'
        }}>
          http://localhost:{dockerPort} (Simulation Sandbox)
        </div>
        <div style={{ width: '54px' }}></div>
      </div>

      {/* Simulator Content */}
      <div style={{ padding: 'var(--space-4)', minHeight: '360px' }}>
        {dockerPort === 8081 && <SqliLoginSimulator flag={flag} onSuccess={onSuccess} />}
        {dockerPort === 8082 && <SqliUnionSimulator flag={flag} onSuccess={onSuccess} />}
        {dockerPort === 8083 && <BlindSqliSimulator flag={flag} onSuccess={onSuccess} />}
        {dockerPort === 8084 && <XssSearchSimulator flag={flag} onSuccess={onSuccess} />}
        {dockerPort === 8087 && <IdorProfileSimulator flag={flag} onSuccess={onSuccess} />}
        {dockerPort === 8090 && <CmdiPingSimulator flag={flag} onSuccess={onSuccess} />}
        
        {/* General fallback simulator */}
        {![8081, 8082, 8083, 8084, 8087, 8090].includes(dockerPort) && (
          <GeneralTerminalSimulator flag={flag} dockerPort={dockerPort} onSuccess={onSuccess} />
        )}
      </div>
    </div>
  );
}

/* ============================================================================
   1. SQL Injection Login Simulator (Port 8081)
   ============================================================================ */
function SqliLoginSimulator({ flag, onSuccess }: { flag: string; onSuccess: (flag: string) => void }) {
  const { t, language } = useTranslation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const query = `SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`;
    
    // Check if they bypassed
    const isBypassed = 
      username.includes("' --") || 
      username.toLowerCase().includes("' or") || 
      username.includes("'/*") ||
      username.includes("' OR '1'='1");

    if (isBypassed) {
      setSuccess(true);
      setMessage(language === 'vi' ? `Đăng nhập thành công! Hệ thống SQL đã thực thi truy vấn:\n${query}` : `Login successful! SQL engine executed query:\n${query}`);
      onSuccess(flag);
    } else {
      setMessage(language === 'vi' ? `Sai tài khoản hoặc mật khẩu.\nTruy vấn đã thực thi:\n${query}` : `Invalid username or password.\nExecuted query:\n${query}`);
      setSuccess(false);
    }
  };

  return (
    <div style={{ maxWidth: '360px', margin: '0 auto' }}>
      <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: 'var(--space-2)', textAlign: 'center' }}>
        {language === 'vi' ? 'Cổng thông tin quản trị' : 'Admin Portal'}
      </h3>
      <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>{t('auth.username')}</label>
          <input
            type="text"
            className="flag-input"
            style={{ width: '100%', borderRadius: 'var(--radius-sm)' }}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="admin"
          />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>{t('auth.password')}</label>
          <input
            type="password"
            className="flag-input"
            style={{ width: '100%', borderRadius: 'var(--radius-sm)' }}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </div>
        <button className="btn btn-primary" type="submit" style={{ width: '100%' }}>
          {t('auth.login')}
        </button>
      </form>

      {message && (
        <div style={{
          marginTop: 'var(--space-2)',
          padding: '12px',
          background: success ? 'rgba(0,122,85,0.1)' : 'rgba(199,0,54,0.1)',
          border: `1px solid ${success ? 'var(--border-success)' : 'var(--border-danger)'}`,
          borderRadius: 'var(--radius-sm)',
          fontSize: '13px'
        }}>
          <div style={{ fontWeight: 600, color: success ? 'var(--fg-success-strong)' : 'var(--fg-danger-strong)' }}>
            {success ? (language === 'vi' ? 'Thành công!' : 'Success!') : t('common.error')}
          </div>
          <pre style={{
            marginTop: '6px',
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            whiteSpace: 'pre-wrap',
            background: 'rgba(0,0,0,0.2)',
            padding: '8px',
            borderRadius: '4px'
          }}>{message}</pre>

          {success && (
            <div style={{ marginTop: '12px', padding: '8px', background: 'var(--bg-brand-softer)', borderRadius: '4px', border: '1px solid var(--border-brand)' }}>
              <strong>{language === 'vi' ? 'Flag tìm thấy:' : 'Flag found:'}</strong> <code style={{ userSelect: 'all' }}>{flag}</code>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ============================================================================
   2. UNION-based SQL Injection Simulator (Port 8082)
   ============================================================================ */
function SqliUnionSimulator({ flag, onSuccess }: { flag: string; onSuccess: (flag: string) => void }) {
  const { language } = useTranslation();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Record<string, string>[]>([]);
  const [sqlError, setSqlError] = useState<string | null>(null);

  const handleSearch = () => {
    setSqlError(null);
    setResults([]);
    
    const trimmed = query.trim().toLowerCase();
    
    // Simulating UNION query
    if (trimmed.includes('union')) {
      // Check column counts
      // Needs to match the original count (let's say 3 columns)
      const selectParts = trimmed.split('select');
      if (selectParts.length > 1) {
        const columns = selectParts[1].split(',');
        if (columns.length !== 3) {
          setSqlError('The used SELECT statements have a different number of columns');
          return;
        }
      }

      // Check if querying users table
      if (trimmed.includes('from users')) {
        setResults([
          { id: '1', name: 'Admin Account', price: `Password: ${flag}` },
          { id: '2', name: 'Student Tester', price: 'Password: studenthash123' },
          { id: '3', name: 'Guest Guest', price: 'Password: guesthash' }
        ]);
        onSuccess(flag);
      } else if (trimmed.includes('from information_schema.tables')) {
        setResults([
          { id: 'Table Name', name: 'products', price: 'SYSTEM TABLE' },
          { id: 'Table Name', name: 'users', price: 'USER TABLE' }
        ]);
      } else {
        setResults([
          { id: '1', name: 'UNION Result 1', price: 'Null' },
          { id: '2', name: 'UNION Result 2', price: 'Null' }
        ]);
      }
    } else {
      // Normal search
      if (query === 'phone' || query === '') {
        setResults([
          { id: '101', name: 'iPhone 15 Pro Max', price: '34,990,000đ' },
          { id: '102', name: 'Samsung Galaxy S24 Ultra', price: '29,990,000đ' }
        ]);
      } else {
        setResults([]);
      }
    }
  };

  return (
    <div>
      <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: 'var(--space-1)' }}>{language === 'vi' ? 'Cửa hàng điện thoại SecShop' : 'SecShop Phone Store'}</h3>
      <p style={{ fontSize: '13px', marginBottom: 'var(--space-2)' }}>{language === 'vi' ? 'Tìm kiếm điện thoại theo tên (Lỗ hổng SQL Injection):' : 'Search phones by name (SQL Injection vulnerability):'}</p>
      
      <div className="flag-input-group" style={{ marginBottom: 'var(--space-2)' }}>
        <input
          type="text"
          className="flag-input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="phone' UNION SELECT null, null, null --"
          style={{ width: '100%' }}
        />
        <button className="btn btn-primary" onClick={handleSearch}>
          <Search size={16} /> {language === 'vi' ? 'Tìm' : 'Search'}
        </button>
      </div>

      {sqlError && (
        <div style={{ padding: '12px', background: 'rgba(199,0,54,0.1)', border: '1px solid var(--border-danger)', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--fg-danger-strong)' }}>
          Database Error: {sqlError}
        </div>
      )}

      {results.length > 0 && (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', marginTop: 'var(--space-1)' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border-default)' }}>
              <th style={{ textAlign: 'left', padding: '8px' }}>{language === 'vi' ? 'Mã sản phẩm' : 'Product ID'}</th>
              <th style={{ textAlign: 'left', padding: '8px' }}>{language === 'vi' ? 'Tên sản phẩm' : 'Product Name'}</th>
              <th style={{ textAlign: 'left', padding: '8px' }}>{language === 'vi' ? 'Giá tiền' : 'Price'}</th>
            </tr>
          </thead>
          <tbody>
            {results.map((r, i) => (
              <tr key={i} style={{ borderBottom: '1px solid var(--border-default)' }}>
                <td style={{ padding: '8px', fontFamily: 'var(--font-mono)' }}>{r.id}</td>
                <td style={{ padding: '8px' }}>{r.name}</td>
                <td style={{ padding: '8px', fontWeight: 600 }}>{r.price}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

/* ============================================================================
   3. Blind SQL Injection Simulator (Port 8083)
   ============================================================================ */
function BlindSqliSimulator({ flag, onSuccess }: { flag: string; onSuccess: (flag: string) => void }) {
  const { language } = useTranslation();
  const [id, setId] = useState('');
  const [exists, setExists] = useState<boolean | null>(null);
  const [timeTaken, setTimeTaken] = useState<number | null>(null);

  const checkProduct = async () => {
    setExists(null);
    setTimeTaken(null);

    const trimmed = id.toLowerCase();
    
    // Simulate time delay
    if (trimmed.includes('sleep(')) {
      const match = trimmed.match(/sleep\((\d+)\)/);
      const delay = match ? parseInt(match[1]) : 3;
      setTimeTaken(delay);
      setExists(true);
      onSuccess(flag);
      return;
    }

    // Boolean checks
    if (trimmed.includes('and')) {
      const condition = trimmed.split('and')[1].trim();
      if (condition === '1=1' || condition === '1=1 --' || condition.includes("substring(password") || condition.includes("ascii(")) {
        setExists(true);
      } else {
        setExists(false);
      }
    } else {
      const val = parseInt(trimmed);
      if (val === 1 || val === 2) {
        setExists(true);
      } else {
        setExists(false);
      }
    }
  };

  return (
    <div>
      <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: 'var(--space-1)' }}>{language === 'vi' ? 'Hệ thống kiểm tra sản phẩm tồn kho' : 'Stock Inventory System'}</h3>
      <p style={{ fontSize: '13px', marginBottom: 'var(--space-2)' }}>{language === 'vi' ? 'Nhập ID sản phẩm để kiểm tra (Blind SQL Injection):' : 'Enter Product ID to check (Blind SQL Injection):'}</p>

      <div className="flag-input-group" style={{ marginBottom: 'var(--space-2)' }}>
        <input
          type="text"
          className="flag-input"
          value={id}
          onChange={(e) => setId(e.target.value)}
          placeholder="1' AND SLEEP(5) --"
          style={{ width: '100%' }}
        />
        <button className="btn btn-primary" onClick={checkProduct}>{language === 'vi' ? 'Kiểm tra' : 'Check'}</button>
      </div>

      {exists !== null && (
        <div style={{
          padding: '12px',
          background: 'var(--bg-neutral-secondary-medium)',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-default)',
          fontSize: '13px'
        }}>
          {timeTaken !== null ? (
            <div>
              <span style={{ color: 'var(--fg-warning-subtle)', fontWeight: 600 }}>[Time delay detected]</span> {language === 'vi' ? `Trang web mất ${timeTaken} giây để tải phản hồi.` : `Website took ${timeTaken} seconds to load response.`}
              <div style={{ marginTop: '8px', padding: '8px', background: 'var(--bg-brand-softer)', borderRadius: '4px' }}>
                {language === 'vi' ? 'Nhận diện Blind Time-based SQL Injection thành công! Flag:' : 'Blind Time-based SQL Injection detected successfully! Flag:'} <code>{flag}</code>
              </div>
            </div>
          ) : (
            <div>
              {language === 'vi' ? 'Trạng thái sản phẩm:' : 'Product Status:'} {exists ? (
                <span style={{ color: 'var(--fg-success-strong)', fontWeight: 600 }}>{language === 'vi' ? 'Sản phẩm TỒN TẠI trong kho.' : 'Product EXISTS in stock.'}</span>
              ) : (
                <span style={{ color: 'var(--fg-danger-strong)', fontWeight: 600 }}>{language === 'vi' ? 'Sản phẩm KHÔNG tồn tại.' : 'Product does NOT exist.'}</span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ============================================================================
   4. Cross-Site Scripting (XSS) Simulator (Port 8084)
   ============================================================================ */
function XssSearchSimulator({ flag, onSuccess }: { flag: string; onSuccess: (flag: string) => void }) {
  const { language } = useTranslation();
  const [search, setSearch] = useState('');
  const [renderedResult, setRenderedResult] = useState<string | null>(null);
  const [xssTriggered, setXssTriggered] = useState(false);

  const handleSearch = () => {
    setXssTriggered(false);
    
    // Check for script or events
    const hasScript = search.toLowerCase().includes('<script>') && search.toLowerCase().includes('</script>');
    const hasEvent = search.toLowerCase().includes('onerror=') || search.toLowerCase().includes('onload=') || search.toLowerCase().includes('onmouseover=');

    setRenderedResult(search);
    
    if (hasScript || hasEvent) {
      setTimeout(() => {
        setXssTriggered(true);
        onSuccess(flag);
      }, 500);
    }
  };

  return (
    <div>
      <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: 'var(--space-1)' }}>{language === 'vi' ? 'Cổng tìm kiếm bài viết' : 'Article Search Portal'}</h3>
      
      <div className="flag-input-group" style={{ marginBottom: 'var(--space-2)' }}>
        <input
          type="text"
          className="flag-input"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="<script>alert(document.cookie)</script>"
          style={{ width: '100%' }}
        />
        <button className="btn btn-primary" onClick={handleSearch}>{language === 'vi' ? 'Tìm kiếm' : 'Search'}</button>
      </div>

      {renderedResult !== null && (
        <div style={{ marginTop: 'var(--space-2)' }}>
          <div style={{ fontSize: '13px', color: 'var(--text-body-subtle)', marginBottom: '4px' }}>
            {language === 'vi' ? 'Kết quả tìm kiếm cho:' : 'Search results for:'}
          </div>
          <div style={{
            padding: '12px',
            background: 'var(--bg-neutral-secondary-medium)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-sm)',
            fontSize: '14px',
            minHeight: '48px'
          }}>
            {/* Displaying raw search input unsafely for simulation */}
            <span dangerouslySetInnerHTML={{ __html: renderedResult }} />
          </div>
        </div>
      )}

      {xssTriggered && (
        <div style={{
          marginTop: 'var(--space-2)',
          padding: '16px',
          background: 'rgba(250,204,21,0.1)',
          border: '1px solid var(--border-warning)',
          borderRadius: 'var(--radius-sm)',
          fontSize: '13px'
        }}>
          <div style={{ fontWeight: 600, color: 'var(--fg-warning-subtle)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Shield size={16} /> [Simulated XSS Alert]
          </div>
          <div style={{ marginTop: '4px', fontFamily: 'var(--font-mono)', padding: '6px', background: 'rgba(0,0,0,0.2)', borderRadius: '4px' }}>
            {"alert(document.domain) -> target.sechub.local"}
          </div>
          <div style={{ marginTop: '12px', padding: '8px', background: 'var(--bg-brand-softer)', borderRadius: '4px' }}>
            {language === 'vi' ? 'Khai thác XSS thành công! Flag:' : 'XSS Exploitation successful! Flag:'} <code>{flag}</code>
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================================================
   5. IDOR Profile Simulator (Port 8087)
   ============================================================================ */
function IdorProfileSimulator({ flag, onSuccess }: { flag: string; onSuccess: (flag: string) => void }) {
  const { language } = useTranslation();
  const [profileId, setProfileId] = useState('10');
  const [profileData, setProfileData] = useState<{
    id: string;
    name: string;
    email: string;
    role: string;
    flag: string | null;
  }>({
    id: '10',
    name: 'Student Tester',
    email: 'student@sechub.vn',
    role: 'USER',
    flag: null
  });

  const loadProfile = () => {
    if (profileId === '1') {
      setProfileData({
        id: '1',
        name: 'Administrator',
        email: 'admin@sechub.vn',
        role: 'ADMIN',
        flag: flag
      });
      onSuccess(flag);
    } else if (profileId === '2') {
      setProfileData({
        id: '2',
        name: 'Instructor',
        email: 'instructor@sechub.vn',
        role: 'INSTRUCTOR',
        flag: null
      });
    } else {
      setProfileData({
        id: profileId,
        name: `Guest User #${profileId}`,
        email: `user_${profileId}@sechub.vn`,
        role: 'USER',
        flag: null
      });
    }
  };

  return (
    <div>
      <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: 'var(--space-1)' }}>{language === 'vi' ? 'Bảng quản lý tài khoản người dùng' : 'User Accounts Management Portal'}</h3>
      <p style={{ fontSize: '13px', marginBottom: 'var(--space-2)' }}>{language === 'vi' ? 'Lỗ hổng IDOR - Thử thay đổi tham số ID để xem profile người khác:' : 'IDOR Vulnerability - Try changing the ID parameter to view other profiles:'}</p>

      <div className="flag-input-group" style={{ marginBottom: 'var(--space-2)', maxWidth: '240px' }}>
        <span style={{ fontSize: '14px', alignSelf: 'center', marginRight: '8px' }}>User ID:</span>
        <input
          type="number"
          className="flag-input"
          value={profileId}
          onChange={(e) => setProfileId(e.target.value)}
          style={{ width: '80px', textAlign: 'center' }}
        />
        <button className="btn btn-primary" onClick={loadProfile}>{language === 'vi' ? 'Tải' : 'Load'}</button>
      </div>

      <div style={{
        padding: '16px',
        background: 'var(--bg-neutral-secondary-medium)',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-base)',
        maxWidth: '360px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--bg-brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
            <User size={24} />
          </div>
          <div>
            <div style={{ fontWeight: 600, color: 'var(--text-heading)' }}>{profileData.name}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-body-subtle)' }}>ID: {profileData.id} | {language === 'vi' ? 'Quyền' : 'Role'}: {profileData.role}</div>
          </div>
        </div>
        
        <div style={{ fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div><strong>Email:</strong> {profileData.email}</div>
          {profileData.flag && (
            <div style={{ marginTop: '8px', padding: '8px', background: 'rgba(0,122,85,0.1)', border: '1px solid var(--border-success)', borderRadius: '4px', color: 'var(--fg-success-strong)' }}>
              <strong>Admin Flag:</strong> <code>{profileData.flag}</code>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ============================================================================
   6. Command Injection Simulator (Port 8090)
   ============================================================================ */
function CmdiPingSimulator({ flag, onSuccess }: { flag: string; onSuccess: (flag: string) => void }) {
  const { language } = useTranslation();
  const [ip, setIp] = useState('');
  const [terminalOutput, setTerminalOutput] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const handlePing = () => {
    setLoading(true);
    setTerminalOutput('PING ' + ip + '...\n');
    
    setTimeout(() => {
      let output = `PING ${ip} (127.0.0.1) 56(84) bytes of data.\n`;
      output += `64 bytes from 127.0.0.1: icmp_seq=1 ttl=64 time=0.035 ms\n`;
      
      const containsCommand = ip.includes(';') || ip.includes('&&') || ip.includes('||') || ip.includes('|');
      
      if (containsCommand) {
        // Extract command (usually cat flag.txt or similar)
        const parts = ip.split(/[;&|]+/);
        const injectedCommand = parts[parts.length - 1].trim();
        
        output += `\n--- Executing injected command: ${injectedCommand} ---\n`;
        if (injectedCommand.includes('cat ') || injectedCommand.includes('flag')) {
          output += `${flag}\n`;
          onSuccess(flag);
        } else if (injectedCommand === 'whoami') {
          output += `www-data\n`;
        } else if (injectedCommand === 'id') {
          output += `uid=33(www-data) gid=33(www-data) groups=33(www-data)\n`;
        } else if (injectedCommand === 'ls') {
          output += `index.php\nping.php\nflag.txt\n`;
        } else {
          output += `sh: 1: ${injectedCommand}: not found\n`;
        }
      } else {
        output += `64 bytes from 127.0.0.1: icmp_seq=2 ttl=64 time=0.040 ms\n`;
        output += `\n--- ${ip} ping statistics ---\n`;
        output += `2 packets transmitted, 2 received, 0% packet loss, time 1002ms\n`;
      }
      
      setTerminalOutput(output);
      setLoading(false);
    }, 1000);
  };

  return (
    <div>
      <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: 'var(--space-1)' }}>{language === 'vi' ? 'Cơ sở hạ tầng kiểm tra kết nối mạng (Ping diagnostic)' : 'Network Connection Diagnostics Infrastructure (Ping)'}</h3>
      <p style={{ fontSize: '13px', marginBottom: 'var(--space-2)' }}>{language === 'vi' ? 'Nhập địa chỉ IP máy chủ để thực hiện lệnh Ping:' : 'Enter Server IP address to run Ping command:'}</p>

      <div className="flag-input-group" style={{ marginBottom: 'var(--space-2)' }}>
        <input
          type="text"
          className="flag-input"
          value={ip}
          onChange={(e) => setIp(e.target.value)}
          placeholder="127.0.0.1; cat flag.txt"
          style={{ width: '100%' }}
        />
        <button className="btn btn-primary" onClick={handlePing} disabled={loading}>
          {loading ? 'Ping...' : 'Ping'}
        </button>
      </div>

      <div className="terminal" style={{ fontSize: '12px' }}>
        <div className="terminal-header">
          <div style={{ display: 'flex', gap: '8px' }}>
            <span className="terminal-dot red"></span>
            <span className="terminal-dot yellow"></span>
            <span className="terminal-dot green"></span>
          </div>
          <span className="terminal-title">bash</span>
          <div></div>
        </div>
        <div className="terminal-body" style={{ minHeight: '140px', fontFamily: 'var(--font-mono)', whiteSpace: 'pre-wrap' }}>
          {terminalOutput}
        </div>
      </div>
    </div>
  );
}

/* ============================================================================
   7. General Terminal Simulator (Fallback)
   ============================================================================ */
function GeneralTerminalSimulator({ flag, dockerPort, onSuccess }: { flag: string; dockerPort: number; onSuccess: (flag: string) => void }) {
  const { language } = useTranslation();
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<string[]>(() => [
    language === 'vi' ? 'Chào mừng đến với Sandbox giả lập SecHub.' : 'Welcome to the SecHub Simulation Sandbox.',
    language === 'vi' ? 'Docker Engine không chạy trên máy chủ này, hệ thống tự động tải chế độ mô phỏng.' : 'Docker Engine is not running on this server, loading simulation mode automatically.',
    language === 'vi' ? 'Nhập lệnh để tương tác hoặc lấy flag trực tiếp.' : 'Enter commands to interact or retrieve flags directly.',
    language === 'vi' ? 'Gõ "help" để xem các lệnh có sẵn.' : 'Type "help" to view available commands.'
  ]);

  const handleCommandSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const cmd = input.trim();
    const newHistory = [...history, `sechub@sandbox:~$ ${cmd}`];

    if (cmd.toLowerCase() === 'help') {
      newHistory.push(language === 'vi' ? 'Các lệnh khả dụng:' : 'Available commands:');
      newHistory.push('  help           - ' + (language === 'vi' ? 'Hiển thị menu này' : 'Display this menu'));
      newHistory.push('  info           - ' + (language === 'vi' ? 'Hiển thị thông tin dịch vụ đang mô phỏng' : 'Show simulated service details'));
      newHistory.push('  exploit        - ' + (language === 'vi' ? 'Mô phỏng tấn công lỗ hổng bảo mật' : 'Simulate vulnerability exploitation'));
      newHistory.push('  getflag        - ' + (language === 'vi' ? 'In trực tiếp flag của lab này' : 'Print the flag for this challenge directly'));
      newHistory.push('  clear          - ' + (language === 'vi' ? 'Xóa màn hình terminal' : 'Clear terminal screen'));
    } else if (cmd.toLowerCase() === 'info') {
      newHistory.push(language === 'vi' ? `Đang giả lập ứng dụng bảo mật trên port: ${dockerPort}` : `Simulating security application on port: ${dockerPort}`);
      newHistory.push(language === 'vi' ? `Trạng thái: Simulated Sandbox Container` : `Status: Simulated Sandbox Container`);
    } else if (cmd.toLowerCase() === 'exploit') {
      newHistory.push(language === 'vi' ? 'Đang khai thác lỗ hổng bảo mật của lab...' : 'Exploiting vulnerability in this lab...');
      newHistory.push(language === 'vi' ? '[+] Bypass bộ lọc thành công!' : '[+] Filter bypassed successfully!');
      newHistory.push(`[+] Flag: ${flag}`);
      onSuccess(flag);
    } else if (cmd.toLowerCase() === 'getflag') {
      newHistory.push(`[+] Flag: ${flag}`);
      onSuccess(flag);
    } else if (cmd.toLowerCase() === 'clear') {
      setHistory([]);
      setInput('');
      return;
    } else {
      newHistory.push(`sh: command not found: ${cmd}`);
    }

    setHistory(newHistory);
    setInput('');
  };

  return (
    <div>
      <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '12px', color: 'var(--text-heading)' }}>
        {language === 'vi' ? 'Cổng kết nối Sandbox Simulator' : 'Sandbox Simulator Terminal Connection'}
      </h3>
      
      {/* High-contrast Catppuccin developer terminal mockup */}
      <div style={{
        background: '#1e1e2e',
        borderRadius: '10px',
        border: '1px solid #313244',
        boxShadow: '0 8px 30px rgba(0,0,0,0.3)',
        overflow: 'hidden',
        fontSize: '13px',
      }}>
        {/* Terminal window header */}
        <div style={{
          background: '#181825',
          padding: '10px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid #313244',
        }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#f38ba8', display: 'inline-block' }}></span>
            <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#f9e2af', display: 'inline-block' }}></span>
            <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#a6e3a1', display: 'inline-block' }}></span>
          </div>
          <span style={{ color: '#cdd6f4', fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 600 }}>
            sechub@sandbox-sim
          </span>
          <div style={{ width: '50px' }}></div>
        </div>

        {/* Terminal Screen Body */}
        <div style={{
          background: '#11111b',
          padding: '16px',
          minHeight: '260px',
          display: 'flex',
          flexDirection: 'column',
          userSelect: 'text', // Allow text selection explicitly
        }}>
          <div style={{ flex: 1, overflowY: 'auto', fontFamily: 'var(--font-mono)', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
            {history.map((h, i) => {
              // Syntax highlighting for prompt lines
              if (h.startsWith('sechub@sandbox:~$')) {
                const cmdPart = h.replace('sechub@sandbox:~$', '');
                return (
                  <div key={i} style={{ marginBottom: '6px' }}>
                    <span style={{ color: '#89b4fa', fontWeight: 'bold' }}>sechub@sandbox:~$</span>
                    <span style={{ color: '#f5c2e7', marginLeft: '8px', fontWeight: 'bold' }}>{cmdPart}</span>
                  </div>
                );
              }
              // Syntax highlighting for flag
              if (h.includes('[+] Flag:')) {
                const flagVal = h.split('[+] Flag:')[1]?.trim() || '';
                return (
                  <div key={i} style={{ 
                    color: '#a6e3a1', 
                    fontWeight: 'bold', 
                    padding: '6px 12px', 
                    background: 'rgba(166,227,161,0.1)', 
                    borderLeft: '3px solid #a6e3a1', 
                    margin: '6px 0', 
                    borderRadius: '4px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '12px',
                  }}>
                    <span>{h}</span>
                    <button
                      type="button"
                      onClick={() => {
                        if (flagVal) {
                          navigator.clipboard.writeText(flagVal);
                          // Show a brief visual confirmation or alert
                          alert(language === 'vi' ? 'Đã sao chép Flag thành công!' : 'Flag copied successfully!');
                        }
                      }}
                      style={{
                        background: '#22c55e',
                        color: '#05070c',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '3px 10px',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        transition: 'background 0.2s',
                      }}
                      onMouseOver={(e) => { e.currentTarget.style.background = '#4ade80'; }}
                      onMouseOut={(e) => { e.currentTarget.style.background = '#22c55e'; }}
                    >
                      {language === 'vi' ? 'Sao chép' : 'Copy'}
                    </button>
                  </div>
                );
              }
              // Success indicators
              if (h.startsWith('[+]')) {
                return <div key={i} style={{ color: '#a6e3a1', marginBottom: '4px' }}>{h}</div>;
              }
              // Error indicators
              if (h.startsWith('sh: command not found')) {
                return <div key={i} style={{ color: '#f38ba8', marginBottom: '4px', fontWeight: 'bold' }}>{h}</div>;
              }
              // Help list commands highlighting
              if (h.startsWith('  help') || h.startsWith('  info') || h.startsWith('  exploit') || h.startsWith('  getflag') || h.startsWith('  clear')) {
                const parts = h.split('-');
                return (
                  <div key={i} style={{ color: '#a6adc8', marginLeft: '12px', marginBottom: '3px' }}>
                    <span style={{ color: '#f9e2af', fontFamily: 'monospace', display: 'inline-block', width: '100px', fontWeight: 'bold' }}>{parts[0]}</span>
                    <span>- {parts.slice(1).join('-')}</span>
                  </div>
                );
              }
              // Fallback default message lines
              return <div key={i} style={{ color: '#bac2de', marginBottom: '4px' }}>{h}</div>;
            })}
          </div>

          {/* Input form */}
          <form onSubmit={handleCommandSubmit} style={{ display: 'flex', borderTop: '1px solid #313244', marginTop: '12px', paddingTop: '12px', alignItems: 'center' }}>
            <span style={{ fontFamily: 'var(--font-mono)', color: '#89b4fa', marginRight: '8px', fontWeight: 'bold' }}>
              sechub@sandbox:~$
            </span>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: '#ffffff', // Guarantee white typing color against black background!
                fontFamily: 'var(--font-mono)',
                fontSize: '13px',
              }}
              autoFocus
            />
          </form>
        </div>
      </div>
    </div>
  );
}

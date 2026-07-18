'use client';

import { useState } from 'react';
import { ArrowRight, Check, Target, X } from 'lucide-react';
import { api, GrowthOverview } from '@/lib/api';
import { useTranslation } from '@/context/LanguageContext';

const getQuestions = (language: string) => {
  if (language === 'vi') {
    return [
      ['Khi server trả về 403, điều đó thường có nghĩa gì?', ['Thành công', 'Không có quyền truy cập', 'Server bị lỗi']],
      ['Lỗ hổng nào khiến mã JavaScript độc hại chạy trong trình duyệt?', ['SSRF', 'SQL Injection', 'XSS']],
      ['Kiểm tra tài nguyên có thuộc về người dùng hiện tại là gì?', ['Authentication', 'Authorization', 'Encoding']],
      ['Cách an toàn để đưa dữ liệu vào truy vấn SQL?', ['Nối chuỗi', 'Xóa dấu nháy', 'Parameterized query']],
      ['Lỗ hổng nào khiến server truy cập URL do người dùng cung cấp?', ['XSS', 'SSRF', 'CSRF']],
    ] as const;
  } else {
    return [
      ['When a server returns 403, what does it usually mean?', ['Success', 'Forbidden / Access Denied', 'Internal Server Error']],
      ['Which vulnerability causes malicious JavaScript to run in the browser?', ['SSRF', 'SQL Injection', 'XSS']],
      ['Verifying if a resource belongs to the current user is part of what?', ['Authentication', 'Authorization', 'Encoding']],
      ['What is the secure way to include data in SQL queries?', ['String concatenation', 'Stripping quotes', 'Parameterized query']],
      ['Which vulnerability causes the server to request a user-supplied URL?', ['XSS', 'SSRF', 'CSRF']],
    ] as const;
  }
};

export default function NewUserOnboarding({ onComplete }: { onComplete: (overview: GrowthOverview) => void }) {
  const { language } = useTranslation();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<number[]>(Array(5).fill(-1));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GrowthOverview | null>(null);
  
  const activeQuestions = getQuestions(language);
  const answer = answers[step];

  const next = async () => {
    if (answer < 0) return;
    if (step < activeQuestions.length - 1) return setStep(value => value + 1);
    setSaving(true); setError(null);
    try {
      const response = await api.growth.submitAssessment(answers);
      setResult(response.data);
    } catch (e: any) {
      setError(e.message || (language === 'vi' ? 'Không thể lưu kết quả.' : 'Failed to save results.'));
      setSaving(false);
    }
  };

  if (result) {
    return (
      <div className="onboarding-overlay" role="dialog" aria-modal="true" aria-labelledby="onboarding-result-title">
        <div className="onboarding-dialog" style={{ maxWidth: '500px' }}>
          <header className="onboarding-header" style={{ borderBottom: '1px solid var(--border-default)', paddingBottom: '20px' }}>
            <div className="onboarding-mark" style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--fg-success-strong)', border: '1px solid var(--border-success-subtle)' }}>
              <Check size={22} />
            </div>
            <div>
              <span>{language === 'vi' ? 'Đánh giá hoàn tất' : 'Assessment Completed'}</span>
              <h1 id="onboarding-result-title" style={{ fontSize: '1.25rem', fontWeight: 800, margin: '4px 0 0 0' }}>{language === 'vi' ? 'Lộ trình dành riêng cho bạn' : 'Your Customized Learning Path'}</h1>
            </div>
          </header>
          
          <div style={{ padding: '24px 0', textAlign: 'center' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '80px', height: '80px', borderRadius: '50%', background: 'var(--bg-brand-softer)', border: '2px solid var(--border-brand)', marginBottom: '16px', color: 'var(--fg-brand)' }}>
              <div style={{ textAlign: 'center' }}>
                <span style={{ fontSize: '1.5rem', fontWeight: 800, display: 'block', lineHeight: 1 }}>{result.assessmentScore}</span>
                <span style={{ fontSize: '10px', color: 'var(--text-body-subtle)', fontWeight: 600 }}>/ 100</span>
              </div>
            </div>
            
            <p style={{ fontSize: '13.5px', color: 'var(--text-body-subtle)', margin: '0 0 20px 0' }}>
              {language === 'vi' ? 'Điểm số đánh giá năng lực bảo mật ban đầu của bạn.' : 'Your initial security competency score.'}
            </p>

            <div style={{ background: 'var(--bg-neutral-secondary)', border: '1px solid var(--border-default)', borderRadius: '12px', padding: '20px', textAlign: 'left', marginBottom: '8px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--fg-brand)', display: 'block', marginBottom: '6px' }}>
                {language === 'vi' ? 'Lộ trình đề xuất' : 'Recommended Path'}
              </span>
              
              {result.recommendedTrack === 'BEGINNER' ? (
                <>
                  <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-heading)', margin: '0 0 8px 0' }}>
                    {language === 'vi' ? 'Lộ trình: Người mới' : 'Path: Beginner'}
                  </h2>
                  <p style={{ fontSize: '13px', lineHeight: 1.6, color: 'var(--text-body-subtle)', margin: 0 }}>
                    {language === 'vi'
                      ? 'Bạn nên bắt đầu với lộ trình Cơ bản. Lộ trình này sẽ giới thiệu các khái niệm bảo mật căn bản nhất như HTTP, cấu trúc Web, SQL Injection và XSS cơ bản cùng các bài thực hành có chỉ dẫn chi tiết.'
                      : 'You should start with the Beginner path. This path will introduce fundamental security concepts such as HTTP, Web architecture, basic SQL Injection, and XSS along with detailed guided labs.'
                    }
                  </p>
                </>
              ) : result.recommendedTrack === 'WEB_DEVELOPER' ? (
                <>
                  <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-heading)', margin: '0 0 8px 0' }}>
                    {language === 'vi' ? 'Lộ trình: Web Developer' : 'Path: Web Developer'}
                  </h2>
                  <p style={{ fontSize: '13px', lineHeight: 1.6, color: 'var(--text-body-subtle)', margin: 0 }}>
                    {language === 'vi'
                      ? 'Bạn đã có hiểu biết nền tảng! Lộ trình đề xuất là Web Developer. Bạn sẽ đi sâu vào phân tích và khai thác các lỗi như SQL Injection nâng cao, IDOR, SSRF và học cách lập trình sửa lỗi an toàn.'
                      : 'You already have foundational knowledge! The recommended path is Web Developer. You will dive deep into analyzing and exploiting vulnerabilities like Advanced SQL Injection, IDOR, SSRF, and learn secure coding remediation.'
                    }
                  </p>
                </>
              ) : (
                <>
                  <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-heading)', margin: '0 0 8px 0' }}>
                    {language === 'vi' ? 'Lộ trình: Pentester' : 'Path: Pentester'}
                  </h2>
                  <p style={{ fontSize: '13px', lineHeight: 1.6, color: 'var(--text-body-subtle)', margin: 0 }}>
                    {language === 'vi'
                      ? 'Kiến thức của bạn rất vững vàng! Bạn phù hợp với lộ trình Pentester. Tập trung khai thác các chuỗi lỗ hổng phức tạp (attack chains), bypass filter, file upload không giới hạn và các kỹ thuật leo thang đặc quyền.'
                      : 'Your knowledge is highly advanced! You fit the Pentester path. Focus on exploiting complex vulnerability chains (attack chains), bypassing filters, unrestricted file uploads, and privilege escalation techniques.'
                    }
                  </p>
                </>
              )}
            </div>
          </div>

          <footer className="onboarding-footer" style={{ borderTop: '1px solid var(--border-default)', paddingTop: '16px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <button 
              className="btn btn-primary" 
              onClick={() => {
                onComplete(result);
                window.location.href = '/learning';
              }}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
            >
              {language === 'vi' ? 'Bắt đầu lộ trình học ngay' : 'Start Learning Path Now'} <ArrowRight size={15} />
            </button>
          </footer>
        </div>
      </div>
    );
  }

  return <div className="onboarding-overlay" role="dialog" aria-modal="true" aria-labelledby="onboarding-title">
    <div className="onboarding-dialog">
      <header className="onboarding-header">
        <div className="onboarding-mark"><Target size={22} /></div>
        <div>
          <span>{language === 'vi' ? 'Bắt đầu với SecHub' : 'Get Started with SecHub'}</span>
          <h1 id="onboarding-title">{language === 'vi' ? 'Tìm lộ trình phù hợp với bạn' : 'Find your perfect path'}</h1>
          <p>{language === 'vi' ? '5 câu ngắn · khoảng 5 phút · không tính điểm' : '5 short questions · ~5 mins · unscored'}</p>
        </div>
      </header>
      <div className="onboarding-progress"><span style={{ width: `${((step + 1) / activeQuestions.length) * 100}%` }} /></div>
      <div className="onboarding-question">
        <small>{language === 'vi' ? 'Câu' : 'Question'} {step + 1} / {activeQuestions.length}</small><h2>{activeQuestions[step][0]}</h2>
        <div className="onboarding-options">{activeQuestions[step][1].map((choice, index) => <button key={choice} className={answer === index ? 'selected' : ''} onClick={() => setAnswers(old => old.map((value, i) => i === step ? index : value))}><span>{String.fromCharCode(65 + index)}</span>{choice}{answer === index && <Check size={17} />}</button>)}</div>
      </div>
      {error && <div className="onboarding-error"><X size={14} /> {error}</div>}
      <footer className="onboarding-footer">
        <button className="btn btn-secondary" disabled={step === 0 || saving} onClick={() => setStep(value => value - 1)}>{language === 'vi' ? 'Quay lại' : 'Back'}</button>
        <button className="btn btn-primary" disabled={answer < 0 || saving} onClick={next}>
          {step === activeQuestions.length - 1 ? (saving ? (language === 'vi' ? 'Đang lưu...' : 'Saving...') : (language === 'vi' ? 'Xem lộ trình' : 'View Path')) : (language === 'vi' ? 'Tiếp tục' : 'Continue')} <ArrowRight size={15} />
        </button>
      </footer>
    </div>
  </div>;
}

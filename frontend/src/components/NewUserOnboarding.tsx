'use client';

import { useState } from 'react';
import { ArrowRight, Check, Target, X } from 'lucide-react';
import { api, GrowthOverview } from '@/lib/api';

const questions = [
  ['Khi server trả về 403, điều đó thường có nghĩa gì?', ['Thành công', 'Không có quyền truy cập', 'Server bị lỗi']],
  ['Lỗ hổng nào khiến mã JavaScript độc hại chạy trong trình duyệt?', ['SSRF', 'SQL Injection', 'XSS']],
  ['Kiểm tra tài nguyên có thuộc về người dùng hiện tại là gì?', ['Authentication', 'Authorization', 'Encoding']],
  ['Cách an toàn để đưa dữ liệu vào truy vấn SQL?', ['Nối chuỗi', 'Xóa dấu nháy', 'Parameterized query']],
  ['Lỗ hổng nào khiến server truy cập URL do người dùng cung cấp?', ['XSS', 'SSRF', 'CSRF']],
] as const;

export default function NewUserOnboarding({ onComplete }: { onComplete: (overview: GrowthOverview) => void }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<number[]>(Array(5).fill(-1));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GrowthOverview | null>(null);
  const answer = answers[step];

  const next = async () => {
    if (answer < 0) return;
    if (step < questions.length - 1) return setStep(value => value + 1);
    setSaving(true); setError(null);
    try {
      const response = await api.growth.submitAssessment(answers);
      setResult(response.data);
    } catch (e: any) {
      setError(e.message || 'Không thể lưu kết quả.');
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
              <span>Đánh giá hoàn tất</span>
              <h1 id="onboarding-result-title" style={{ fontSize: '1.25rem', fontWeight: 800, margin: '4px 0 0 0' }}>Lộ trình dành riêng cho bạn</h1>
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
              Điểm số đánh giá năng lực bảo mật ban đầu của bạn.
            </p>

            <div style={{ background: 'var(--bg-neutral-secondary)', border: '1px solid var(--border-default)', borderRadius: '12px', padding: '20px', textAlign: 'left', marginBottom: '8px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--fg-brand)', display: 'block', marginBottom: '6px' }}>
                Lộ trình đề xuất
              </span>
              
              {result.recommendedTrack === 'BEGINNER' ? (
                <>
                  <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-heading)', margin: '0 0 8px 0' }}>
                    Lộ trình: Người mới
                  </h2>
                  <p style={{ fontSize: '13px', lineHeight: 1.6, color: 'var(--text-body-subtle)', margin: 0 }}>
                    Bạn nên bắt đầu với lộ trình <strong>Cơ bản</strong>. Lộ trình này sẽ giới thiệu các khái niệm bảo mật căn bản nhất như HTTP, cấu trúc Web, SQL Injection và XSS cơ bản cùng các bài thực hành có chỉ dẫn chi tiết.
                  </p>
                </>
              ) : result.recommendedTrack === 'WEB_DEVELOPER' ? (
                <>
                  <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-heading)', margin: '0 0 8px 0' }}>
                    Lộ trình: Web Developer
                  </h2>
                  <p style={{ fontSize: '13px', lineHeight: 1.6, color: 'var(--text-body-subtle)', margin: 0 }}>
                    Bạn đã có hiểu biết nền tảng! Lộ trình đề xuất là <strong>Web Developer</strong>. Bạn sẽ đi sâu vào phân tích và khai thác các lỗi như SQL Injection nâng cao, IDOR, SSRF và học cách lập trình sửa lỗi an toàn.
                  </p>
                </>
              ) : (
                <>
                  <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-heading)', margin: '0 0 8px 0' }}>
                    Lộ trình: Pentester
                  </h2>
                  <p style={{ fontSize: '13px', lineHeight: 1.6, color: 'var(--text-body-subtle)', margin: 0 }}>
                    Kiến thức của bạn rất vững vàng! Bạn phù hợp với lộ trình <strong>Pentester</strong>. Tập trung khai thác các chuỗi lỗ hổng phức tạp (attack chains), bypass filter, file upload không giới hạn và các kỹ thuật leo thang đặc quyền.
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
              Bắt đầu lộ trình học ngay <ArrowRight size={15} />
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
        <div><span>Bắt đầu với SecHub</span><h1 id="onboarding-title">Tìm lộ trình phù hợp với bạn</h1><p>5 câu ngắn · khoảng 5 phút · không tính điểm</p></div>
      </header>
      <div className="onboarding-progress"><span style={{ width: `${((step + 1) / questions.length) * 100}%` }} /></div>
      <div className="onboarding-question">
        <small>Câu {step + 1} / {questions.length}</small><h2>{questions[step][0]}</h2>
        <div className="onboarding-options">{questions[step][1].map((choice, index) => <button key={choice} className={answer === index ? 'selected' : ''} onClick={() => setAnswers(old => old.map((value, i) => i === step ? index : value))}><span>{String.fromCharCode(65 + index)}</span>{choice}{answer === index && <Check size={17} />}</button>)}</div>
      </div>
      {error && <div className="onboarding-error"><X size={14} /> {error}</div>}
      <footer className="onboarding-footer"><button className="btn btn-secondary" disabled={step === 0 || saving} onClick={() => setStep(value => value - 1)}>Quay lại</button><button className="btn btn-primary" disabled={answer < 0 || saving} onClick={next}>{step === questions.length - 1 ? (saving ? 'Đang lưu...' : 'Xem lộ trình') : 'Tiếp tục'} <ArrowRight size={15} /></button></footer>
    </div>
  </div>;
}

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
  const answer = answers[step];

  const next = async () => {
    if (answer < 0) return;
    if (step < questions.length - 1) return setStep(value => value + 1);
    setSaving(true); setError(null);
    try { onComplete((await api.growth.submitAssessment(answers)).data); }
    catch (e: any) { setError(e.message || 'Không thể lưu kết quả.'); setSaving(false); }
  };

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

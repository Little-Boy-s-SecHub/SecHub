'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BookOpen, CheckCircle2, FlaskConical, Plus, Send, Trash2 } from 'lucide-react';
import { api, Lab, LearningPath } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from '@/context/LanguageContext';

export default function AuthorStudioPage() {
  const { user, loading: authLoading } = useAuth();
  const { language } = useTranslation();
  const router = useRouter();
  const [paths, setPaths] = useState<LearningPath[]>([]);
  const [labs, setLabs] = useState<Lab[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [pathForm, setPathForm] = useState({ title: '', description: '', difficulty: 'BEGINNER', estimatedHours: 2 });
  const [lessonForm, setLessonForm] = useState({ pathId: '', title: '', learningObjective: '', estimatedMinutes: 12, contentMarkdown: '' });
  const [labForm, setLabForm] = useState({ title: '', vulnerabilitySlug: 'sql-injection', difficulty: 'BEGINNER', scenario: '' });

  const load = () => api.author.getWorkspace().then(r => { setPaths(r.data.paths); setLabs(r.data.labs) }).catch(e => setError(e.message));

  useEffect(() => {
    if (authLoading) return;
    if (!user || !['INSTRUCTOR', 'ADMIN'].includes(user.role)) { router.replace('/'); return }
    load();
  }, [user, authLoading, router]);

  const run = async (action: () => Promise<unknown>) => {
    setBusy(true); setError(null);
    try { await action(); await load() } catch (e: unknown) { setError(e instanceof Error ? e.message : String(e)) } finally { setBusy(false) }
  };

  if (authLoading || !user) return <div className="growth-loading">{language === 'vi' ? 'Đang kiểm tra quyền tác giả...' : 'Verifying author privileges...'}</div>;

  return (
    <main className="author-page">
      <header className="author-header">
        <div>
          <span>SecHub Author Studio</span>
          <h1>{language === 'vi' ? 'Xây nội dung thực hành' : 'Build Hands-on Content'}</h1>
          <p>{language === 'vi' ? 'Tạo bản nháp, kiểm tra nội dung rồi xuất bản khi sẵn sàng.' : 'Create drafts, review content, and publish when ready.'}</p>
        </div>
      </header>

      {error && <p className="growth-inline-error">{error}</p>}

      <div className="author-tabs-summary">
        <span><BookOpen size={16} /><strong>{paths.length}</strong> {language === 'vi' ? 'lộ trình' : 'learning paths'}</span>
        <span><FlaskConical size={16} /><strong>{labs.length}</strong> {language === 'vi' ? 'challenge' : 'challenges'}</span>
      </div>

      <section className="author-section">
        <div className="author-section-title">
          <div><BookOpen /><h2>Learning path</h2></div>
          <small>{language === 'vi' ? 'Draft không hiển thị với người học' : 'Drafts are invisible to students'}</small>
        </div>

        <form className="author-form author-form-path" onSubmit={e => { e.preventDefault(); run(() => api.author.createPath(pathForm)) }}>
          <input required placeholder={language === 'vi' ? 'Tên lộ trình' : 'Learning path title'} value={pathForm.title} onChange={e => setPathForm({ ...pathForm, title: e.target.value })} />
          <input placeholder={language === 'vi' ? 'Mô tả ngắn' : 'Short description'} value={pathForm.description} onChange={e => setPathForm({ ...pathForm, description: e.target.value })} />
          <select value={pathForm.difficulty} onChange={e => setPathForm({ ...pathForm, difficulty: e.target.value })}>
            <option value="BEGINNER">{language === 'vi' ? 'Người mới' : 'Beginner'}</option>
            <option value="INTERMEDIATE">{language === 'vi' ? 'Trung cấp' : 'Intermediate'}</option>
            <option value="ADVANCED">{language === 'vi' ? 'Nâng cao' : 'Advanced'}</option>
          </select>
          <input type="number" min="1" value={pathForm.estimatedHours} onChange={e => setPathForm({ ...pathForm, estimatedHours: Number(e.target.value) })} />
          <button className="btn btn-primary" disabled={busy}><Plus size={15} />{language === 'vi' ? 'Tạo bản nháp' : 'Create Draft'}</button>
        </form>

        <div className="author-content-list">
          {paths.map(path => (
            <div key={path.id}>
              <div>
                <strong>{path.title}</strong>
                <span>{path.difficulty} · {path.lessonCount || 0} {language === 'vi' ? 'bài' : 'lessons'} · {path.status}</span>
              </div>
              {path.status === 'DRAFT' && (
                <div className="author-row-actions">
                  <button className="btn btn-secondary btn-sm" disabled={busy} onClick={() => run(() => api.author.publishPath(path.id))}><Send size={14} />{language === 'vi' ? 'Xuất bản' : 'Publish'}</button>
                  <button className="btn btn-icon btn-sm" title={language === 'vi' ? 'Xoá bản nháp' : 'Delete draft'} disabled={busy} onClick={() => confirm(language === 'vi' ? 'Xoá bản nháp này?' : 'Delete this draft?') && run(() => api.author.deletePath(path.id))}><Trash2 size={14} /></button>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="author-section">
        <div className="author-section-title">
          <div><Plus /><h2>{language === 'vi' ? 'Thêm bài học' : 'Add Lesson'}</h2></div>
          <small>{language === 'vi' ? 'Mỗi bài có một mục tiêu chính' : 'Each lesson has one primary objective'}</small>
        </div>

        <form className="author-form author-lesson-form" onSubmit={e => { e.preventDefault(); run(() => api.author.addLesson(lessonForm.pathId, lessonForm)) }}>
          <select required value={lessonForm.pathId} onChange={e => setLessonForm({ ...lessonForm, pathId: e.target.value })}>
            <option value="">{language === 'vi' ? 'Chọn learning path' : 'Select learning path'}</option>
            {paths.filter(p => p.status === 'DRAFT').map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
          </select>
          <input required placeholder={language === 'vi' ? 'Tên bài học' : 'Lesson title'} value={lessonForm.title} onChange={e => setLessonForm({ ...lessonForm, title: e.target.value })} />
          <input required placeholder={language === 'vi' ? 'Mục tiêu học tập' : 'Learning objective'} value={lessonForm.learningObjective} onChange={e => setLessonForm({ ...lessonForm, learningObjective: e.target.value })} />
          <input type="number" min="5" value={lessonForm.estimatedMinutes} onChange={e => setLessonForm({ ...lessonForm, estimatedMinutes: Number(e.target.value) })} />
          <textarea required placeholder={language === 'vi' ? 'Nội dung Markdown' : 'Content Markdown'} value={lessonForm.contentMarkdown} onChange={e => setLessonForm({ ...lessonForm, contentMarkdown: e.target.value })} />
          <button className="btn btn-primary" disabled={busy}><Plus size={15} />{language === 'vi' ? 'Thêm bài' : 'Add Lesson'}</button>
        </form>
      </section>

      <section className="author-section">
        <div className="author-section-title">
          <div><FlaskConical /><h2>Lab challenge</h2></div>
          <small>{language === 'vi' ? 'AI tạo lab và flag riêng' : 'AI generates custom lab and flag'}</small>
        </div>

        <form className="author-form author-lab-form" onSubmit={e => { e.preventDefault(); run(() => api.author.createLab(labForm)) }}>
          <input required placeholder={language === 'vi' ? 'Tên challenge' : 'Challenge title'} value={labForm.title} onChange={e => setLabForm({ ...labForm, title: e.target.value })} />
          <select value={labForm.vulnerabilitySlug} onChange={e => setLabForm({ ...labForm, vulnerabilitySlug: e.target.value })}>
            <option value="sql-injection">SQL Injection</option>
            <option value="xss">XSS</option>
            <option value="idor">Access Control / IDOR</option>
            <option value="ssrf">SSRF</option>
          </select>
          <select value={labForm.difficulty} onChange={e => setLabForm({ ...labForm, difficulty: e.target.value })}>
            <option value="BEGINNER">{language === 'vi' ? 'Người mới' : 'Beginner'}</option>
            <option value="INTERMEDIATE">{language === 'vi' ? 'Trung cấp' : 'Intermediate'}</option>
            <option value="ADVANCED">{language === 'vi' ? 'Nâng cao' : 'Advanced'}</option>
          </select>
          <textarea required placeholder={language === 'vi' ? 'Bối cảnh, đối tượng học và mục tiêu kỹ thuật' : 'Scenario context, target audience, and technical objective'} value={labForm.scenario} onChange={e => setLabForm({ ...labForm, scenario: e.target.value })} />
          <button className="btn btn-primary" disabled={busy}><FlaskConical size={15} />{language === 'vi' ? 'Tạo challenge' : 'Create Challenge'}</button>
        </form>

        <div className="author-content-list">
          {labs.map(lab => (
            <div key={lab.id}>
              <div>
                <strong>{lab.title}</strong>
                <span>{lab.vulnerabilityName} · {lab.difficulty} · {lab.status}</span>
              </div>
              {lab.status === 'DRAFT' ? (
                <div className="author-row-actions">
                  <button className="btn btn-secondary btn-sm" disabled={busy} onClick={() => run(() => api.author.publishLab(lab.id))}><Send size={14} />{language === 'vi' ? 'Xuất bản' : 'Publish'}</button>
                  <button className="btn btn-icon btn-sm" title={language === 'vi' ? 'Xoá bản nháp' : 'Delete draft'} disabled={busy} onClick={() => confirm(language === 'vi' ? 'Xoá challenge nháp này?' : 'Delete this draft challenge?') && run(() => api.author.deleteLab(lab.id))}><Trash2 size={14} /></button>
                </div>
              ) : <CheckCircle2 size={17} />}
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BookOpen, CheckCircle2, FlaskConical, Plus, Send, Trash2 } from 'lucide-react';
import { api, Lab, LearningPath } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

export default function AuthorStudioPage() {
  const { user, loading: authLoading } = useAuth(); const router = useRouter();
  const [paths,setPaths]=useState<LearningPath[]>([]); const [labs,setLabs]=useState<Lab[]>([]); const [error,setError]=useState<string|null>(null); const [busy,setBusy]=useState(false);
  const [pathForm,setPathForm]=useState({title:'',description:'',difficulty:'BEGINNER',estimatedHours:2});
  const [lessonForm,setLessonForm]=useState({pathId:'',title:'',learningObjective:'',estimatedMinutes:12,contentMarkdown:''});
  const [labForm,setLabForm]=useState({title:'',vulnerabilitySlug:'sql-injection',difficulty:'BEGINNER',scenario:''});
  const load=()=>api.author.getWorkspace().then(r=>{setPaths(r.data.paths);setLabs(r.data.labs)}).catch(e=>setError(e.message));
  useEffect(()=>{if(authLoading)return;if(!user||!['INSTRUCTOR','ADMIN'].includes(user.role)){router.replace('/');return}load()},[user,authLoading,router]);
  const run=async(action:()=>Promise<unknown>)=>{setBusy(true);setError(null);try{await action();await load()}catch(e:any){setError(e.message)}finally{setBusy(false)}};
  if(authLoading||!user)return <div className="growth-loading">Đang kiểm tra quyền tác giả...</div>;
  return <main className="author-page">
    <header className="author-header"><div><span>SecHub Author Studio</span><h1>Xây nội dung thực hành</h1><p>Tạo bản nháp, kiểm tra nội dung rồi xuất bản khi sẵn sàng.</p></div></header>
    {error&&<p className="growth-inline-error">{error}</p>}
    <div className="author-tabs-summary"><span><BookOpen size={16}/><strong>{paths.length}</strong> lộ trình</span><span><FlaskConical size={16}/><strong>{labs.length}</strong> challenge</span></div>
    <section className="author-section"><div className="author-section-title"><div><BookOpen/><h2>Learning path</h2></div><small>Draft không hiển thị với người học</small></div>
      <form className="author-form author-form-path" onSubmit={e=>{e.preventDefault();run(()=>api.author.createPath(pathForm))}}><input required placeholder="Tên lộ trình" value={pathForm.title} onChange={e=>setPathForm({...pathForm,title:e.target.value})}/><input placeholder="Mô tả ngắn" value={pathForm.description} onChange={e=>setPathForm({...pathForm,description:e.target.value})}/><select value={pathForm.difficulty} onChange={e=>setPathForm({...pathForm,difficulty:e.target.value})}><option value="BEGINNER">Người mới</option><option value="INTERMEDIATE">Trung cấp</option><option value="ADVANCED">Nâng cao</option></select><input type="number" min="1" value={pathForm.estimatedHours} onChange={e=>setPathForm({...pathForm,estimatedHours:Number(e.target.value)})}/><button className="btn btn-primary" disabled={busy}><Plus size={15}/>Tạo bản nháp</button></form>
      <div className="author-content-list">{paths.map(path=><div key={path.id}><div><strong>{path.title}</strong><span>{path.difficulty} · {path.lessonCount||0} bài · {path.status}</span></div>{path.status==='DRAFT'&&<div className="author-row-actions"><button className="btn btn-secondary btn-sm" disabled={busy} onClick={()=>run(()=>api.author.publishPath(path.id))}><Send size={14}/>Xuất bản</button><button className="btn btn-icon btn-sm" title="Xoá bản nháp" disabled={busy} onClick={()=>confirm('Xoá bản nháp này?')&&run(()=>api.author.deletePath(path.id))}><Trash2 size={14}/></button></div>}</div>)}</div>
    </section>
    <section className="author-section"><div className="author-section-title"><div><Plus/><h2>Thêm bài học</h2></div><small>Mỗi bài có một mục tiêu chính</small></div>
      <form className="author-form author-lesson-form" onSubmit={e=>{e.preventDefault();run(()=>api.author.addLesson(lessonForm.pathId,lessonForm))}}><select required value={lessonForm.pathId} onChange={e=>setLessonForm({...lessonForm,pathId:e.target.value})}><option value="">Chọn learning path</option>{paths.filter(p=>p.status==='DRAFT').map(p=><option key={p.id} value={p.id}>{p.title}</option>)}</select><input required placeholder="Tên bài học" value={lessonForm.title} onChange={e=>setLessonForm({...lessonForm,title:e.target.value})}/><input required placeholder="Mục tiêu học tập" value={lessonForm.learningObjective} onChange={e=>setLessonForm({...lessonForm,learningObjective:e.target.value})}/><input type="number" min="5" value={lessonForm.estimatedMinutes} onChange={e=>setLessonForm({...lessonForm,estimatedMinutes:Number(e.target.value)})}/><textarea required placeholder="Nội dung Markdown" value={lessonForm.contentMarkdown} onChange={e=>setLessonForm({...lessonForm,contentMarkdown:e.target.value})}/><button className="btn btn-primary" disabled={busy}><Plus size={15}/>Thêm bài</button></form>
    </section>
    <section className="author-section"><div className="author-section-title"><div><FlaskConical/><h2>Lab challenge</h2></div><small>AI tạo sandbox và flag riêng</small></div>
      <form className="author-form author-lab-form" onSubmit={e=>{e.preventDefault();run(()=>api.author.createLab(labForm))}}><input required placeholder="Tên challenge" value={labForm.title} onChange={e=>setLabForm({...labForm,title:e.target.value})}/><select value={labForm.vulnerabilitySlug} onChange={e=>setLabForm({...labForm,vulnerabilitySlug:e.target.value})}><option value="sql-injection">SQL Injection</option><option value="xss">XSS</option><option value="idor">Access Control / IDOR</option><option value="ssrf">SSRF</option></select><select value={labForm.difficulty} onChange={e=>setLabForm({...labForm,difficulty:e.target.value})}><option value="BEGINNER">Người mới</option><option value="INTERMEDIATE">Trung cấp</option><option value="ADVANCED">Nâng cao</option></select><textarea required placeholder="Bối cảnh, đối tượng học và mục tiêu kỹ thuật" value={labForm.scenario} onChange={e=>setLabForm({...labForm,scenario:e.target.value})}/><button className="btn btn-primary" disabled={busy}><FlaskConical size={15}/>Tạo challenge</button></form>
      <div className="author-content-list">{labs.map(lab=><div key={lab.id}><div><strong>{lab.title}</strong><span>{lab.vulnerabilityName} · {lab.difficulty} · {lab.status}</span></div>{lab.status==='DRAFT'?<div className="author-row-actions"><button className="btn btn-secondary btn-sm" disabled={busy} onClick={()=>run(()=>api.author.publishLab(lab.id))}><Send size={14}/>Xuất bản</button><button className="btn btn-icon btn-sm" title="Xoá bản nháp" disabled={busy} onClick={()=>confirm('Xoá challenge nháp này?')&&run(()=>api.author.deleteLab(lab.id))}><Trash2 size={14}/></button></div>:<CheckCircle2 size={17}/>}</div>)}</div>
    </section>
  </main>;
}

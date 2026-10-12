import React, { useEffect, useState } from 'react';
import { ArrowLeft, Eye, Flag, Heart, MessageCircle, Reply, Share2, Send } from 'lucide-react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../lib/api.js';
import CommentActions from '../components/CommentActions.jsx';
import UserProfileLink from '../components/UserProfileLink.jsx';

function flattenComments(comments = [], parentId = null) {
  return comments.flatMap((comment) => [
    { ...comment, parentId: comment.parentId ?? parentId },
    ...flattenComments(comment.replies || [], comment.id),
  ]);
}

function updateCommentTree(comments, commentId, updater) {
  return comments.map((comment) => comment.id === commentId
    ? updater(comment)
    : { ...comment, replies: updateCommentTree(comment.replies || [], commentId, updater) });
}

function removeCommentTree(comments, commentId) {
  return comments.filter((comment) => comment.id !== commentId)
    .map((comment) => ({ ...comment, replies: removeCommentTree(comment.replies || [], commentId) }));
}

export default function LayiheDetay() {
  const { id } = useParams();
  const location = useLocation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [commentText, setCommentText] = useState('');
  const [replyTarget, setReplyTarget] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [editingComment, setEditingComment] = useState(null);
  useEffect(() => { api.getProject(id).then(setProject).catch((err) => setError(err.message)); }, [id]);
  useEffect(() => {
    if (!project || !location.hash) return undefined;
    const timer = window.setTimeout(() => document.getElementById(location.hash.slice(1))?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 0);
    return () => window.clearTimeout(timer);
  }, [project?.id, location.hash]);
  if (error) return <div className="ai-project-detail min-h-screen pt-32 text-center text-red-600">{error}</div>;
  if (!project) return <div className="ai-project-detail min-h-screen pt-32 text-center text-slate-400">Layihə yüklənir...</div>;
  const like = async () => {
    const result = await api.likeProject(project.id);
    setProject({ ...project, likes: result.likes, liked: result.liked });
  };
  const addComment = async (parentId = null) => {
    const text = parentId ? replyText : commentText;
    if (!text.trim()) return;
    const result = await api.addProjectComment(project.id, text, parentId);
    setProject((current) => ({
      ...current,
      commentsList: parentId
        ? updateCommentTree(current.commentsList || [], parentId, (comment) => ({ ...comment, replies: [...(comment.replies || []), result] }))
        : [...(current.commentsList || []), result],
    }));
    if (parentId) { setReplyText(''); setReplyTarget(null); } else setCommentText('');
  };
  const likeComment = async (commentId) => {
    const result = await api.likeProjectComment(project.id, commentId);
    setProject((current) => ({ ...current, commentsList: updateCommentTree(current.commentsList || [], commentId, (item) => ({ ...item, likes: result.likes, liked: result.liked })) }));
  };
  const saveCommentEdit = async () => {
    if (!editingComment?.text.trim()) return;
    try {
      const updated = await api.updateProjectComment(project.id, editingComment.id, editingComment.text);
      setProject((current) => ({ ...current, commentsList: updateCommentTree(current.commentsList || [], updated.id, (item) => ({ ...item, text: updated.text })) }));
      setEditingComment(null);
    } catch (err) { setNotice(err.message); }
  };
  const deleteComment = async (commentId) => {
    if (!window.confirm('Bu rəyi silmək istədiyinizə əminsiniz?')) return;
    try {
      await api.deleteProjectComment(project.id, commentId);
      setProject((current) => ({ ...current, commentsList: removeCommentTree(current.commentsList || [], commentId) }));
    } catch (err) { setNotice(err.message); }
  };
  const commentReportUrl = (comment) => `/sikayet?commentType=layihə-rəyi&commentId=${comment.id}&comment=${encodeURIComponent(comment.text)}&project=${encodeURIComponent(project.title)}&projectId=${project.id}`;
  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: project.title, text: project.description, url });
      else {
        await navigator.clipboard.writeText(url);
        setNotice('Layihənin linki kopyalandı.');
        window.setTimeout(() => setNotice(''), 2500);
      }
    } catch (err) {
      if (err?.name !== 'AbortError') setNotice('Paylaşmaq mümkün olmadı. Linki əl ilə kopyalayın.');
    }
  };
  const mediaUrls = Array.isArray(project.mediaUrls) && project.mediaUrls.length
    ? project.mediaUrls
    : [project.image || project.imageUrl].filter(Boolean);
  return <div className="ai-project-detail min-h-screen bg-[#F8FAFC] pt-28 pb-20 px-4"><main className="max-w-6xl mx-auto">
    <button onClick={() => navigate('/layiheler')} className="ai-detail-back flex items-center gap-2 text-slate-600 font-semibold mb-6"><ArrowLeft className="w-5 h-5" /> Layihələrə qayıt</button>
    <article className="ai-detail-shell bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm grid lg:grid-cols-2">
      <div className="ai-detail-gallery w-full min-h-[520px] bg-gradient-to-br from-blue-100 via-cyan-50 to-indigo-100 p-5 sm:p-8 space-y-6">
        {mediaUrls.map((url) => /\.(mp4|webm|mov|ogg)(\?|$)/i.test(url) ? (
          <video key={url} src={url} title={project.title} controls playsInline className="w-full max-h-[720px] object-contain rounded-2xl bg-slate-950/10" />
        ) : (
          <img key={url} src={url} alt={project.title} onError={(event) => { event.currentTarget.style.display = 'none'; }} className="w-full max-h-[720px] object-contain rounded-2xl" />
        ))}
        {!mediaUrls.length && <p className="m-auto text-sm font-medium text-slate-500">Bu layihə üçün şəkil əlavə edilməyib.</p>}
      </div>
      <div className="ai-detail-copy p-7 sm:p-10"><div className="flex items-start justify-between gap-4"><span className="ai-detail-category text-sm text-blue-600 font-bold">{project.category}</span><div className="flex gap-2"><button type="button" onClick={share} title="Layihəni paylaş" className="ai-detail-icon-button p-2 rounded-lg border border-slate-200 text-slate-500 hover:text-blue-600 hover:border-blue-200"><Share2 className="w-4 h-4" /></button><button type="button" onClick={() => navigate(`/sikayet?project=${encodeURIComponent(project.title)}&projectId=${project.id}`)} title="Layihəni şikayət et" className="ai-detail-icon-button p-2 rounded-lg border border-slate-200 text-slate-500 hover:text-orange-600 hover:border-orange-200"><Flag className="w-4 h-4" /></button></div></div><h1 className="text-3xl font-black text-slate-900 mt-3">{project.title}</h1><p className="text-slate-500 mt-2">Hazırlayan: {project.author}</p>{project.isDemo && <span className="mt-2 inline-block rounded-full bg-violet-100 px-2.5 py-1 text-[10px] font-bold text-violet-800">{project.demoLabel || 'Demo hesabı'}</span>}<p className="text-slate-700 leading-relaxed mt-8 whitespace-pre-wrap">{project.description}</p><div className="ai-detail-stats flex gap-4 mt-8 text-sm text-slate-500"><span><Eye className="inline w-4 h-4" /> {project.views}</span><button onClick={like} className={`flex items-center gap-1 ${project.liked ? 'text-red-500' : 'hover:text-red-500'}`}><Heart className="w-4 h-4" fill={project.liked ? 'currentColor' : 'none'} /> {project.likes}</button><span><MessageCircle className="inline w-4 h-4" /> {project.commentsList?.length || 0}</span></div>{notice && <p role="status" className="mt-4 text-sm font-semibold text-blue-600">{notice}</p>}</div>
    </article>
    <section className="ai-detail-comments mt-6 bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
      <h2 className="text-xl font-black text-slate-900 flex items-center gap-2"><MessageCircle className="w-5 h-5 text-blue-600" /> Şərhlər</h2>
      <div className="flex gap-3 mt-5">
        <input value={commentText} onChange={(event) => setCommentText(event.target.value)} placeholder="Layihə haqqında fikrinizi yazın..." className="flex-1 rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500" />
        <button type="button" onClick={() => addComment()} className="rounded-xl bg-blue-600 px-4 text-white hover:bg-blue-700"><Send className="w-4 h-4" /></button>
      </div>
      <div className="mt-6 space-y-4">
        {flattenComments(project.commentsList || []).map((comment) => (
          <div id={`comment-${comment.id}`} key={comment.id} className={`rounded-2xl bg-slate-50 p-4 ${comment.parentId ? 'ml-5 border-l-2 border-blue-200' : ''}`}>
            <div className="flex justify-between gap-3"><div className="min-w-0 flex-1"><UserProfileLink userId={comment.authorId} name={comment.author} avatarUrl={comment.authorAvatarUrl} />{editingComment?.id === comment.id ? <div className="mt-2 flex flex-wrap gap-2"><input value={editingComment.text} onChange={(event) => setEditingComment((current) => ({ ...current, text: event.target.value }))} className="min-w-0 flex-1 rounded-lg border border-slate-200 px-3 py-2" /><button type="button" onClick={saveCommentEdit} className="text-sm font-bold text-blue-700">Yadda saxla</button><button type="button" onClick={() => setEditingComment(null)} className="text-sm text-slate-500">Ləğv et</button></div> : <p className="text-slate-700 mt-1">{comment.text}</p>}<div className="mt-2"><CommentActions isAuthor={user?.id === comment.authorId} reportUrl={commentReportUrl(comment)} onEdit={() => setEditingComment({ id: comment.id, text: comment.text })} onDelete={() => deleteComment(comment.id)} /></div></div><button type="button" onClick={() => likeComment(comment.id)} className={`flex items-center gap-1 text-sm ${comment.liked ? 'text-red-500' : 'text-slate-400 hover:text-red-500'}`}><Heart className="w-4 h-4" fill={comment.liked ? 'currentColor' : 'none'} />{comment.likes || 0}</button></div>
            <button type="button" onClick={() => setReplyTarget(replyTarget === comment.id ? null : comment.id)} className="mt-3 text-xs font-bold text-blue-600 flex items-center gap-1"><Reply className="w-3 h-3" /> Cavab ver</button>
            {replyTarget === comment.id && <div className="flex gap-2 mt-3"><input value={replyText} onChange={(event) => setReplyText(event.target.value)} placeholder="Cavabınız..." className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm" /><button type="button" onClick={() => addComment(comment.id)} className="rounded-lg bg-blue-600 px-3 text-xs font-bold text-white">Göndər</button></div>}
          </div>
        ))}
      </div>
    </section>
  </main></div>;
}

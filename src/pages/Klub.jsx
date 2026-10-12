import React, { useEffect, useState } from 'react';
import { ArrowLeft, Check, ChevronDown, Clock, Eye, Loader2, MessageCircle, Search, Send, Share2, SlidersHorizontal } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../lib/api.js';
import CommentActions from '../components/CommentActions.jsx';
import UserProfileLink from '../components/UserProfileLink.jsx';
import { ALL_CATEGORY_OPTIONS } from '../lib/categoryOptions.js';

function daysAgo(value) {
  return value ? Math.max(0, Math.floor((Date.now() - new Date(value.replace(' ', 'T') + 'Z')) / 86400000)) : 0;
}

export default function Klub() {
  const { user } = useAuth();
  const { id: postId } = useParams();
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [categoryMenuOpen, setCategoryMenuOpen] = useState(false);
  const [comment, setComment] = useState('');
  const [editingComment, setEditingComment] = useState(null);
  const [postTitle, setPostTitle] = useState('');
  const [postContent, setPostContent] = useState('');
  const [postType, setPostType] = useState('müzakirə');
  const [postCategory, setPostCategory] = useState('');
  const [postFile, setPostFile] = useState(null);
  const [sharedCategories, setSharedCategories] = useState([]);
  const [showComposer, setShowComposer] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getCategories().then(setSharedCategories).catch((err) => setError(err.message));
  }, []);

  useEffect(() => {
    if (postId) {
      setLoading(true);
      api.getClubPost(postId).then((post) => { setSelected(post); setError(''); })
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
      return undefined;
    }
    setSelected(null);
    setError('');
    let active = true;
    setLoading(true);
    api.getClubPosts(search).then((data) => active && setPosts(data))
      .catch((err) => active && setError(err.message))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [search, postId]);

  const postCategories = [...new Set([
    ...ALL_CATEGORY_OPTIONS,
    ...sharedCategories,
    ...posts.flatMap((post) => post.tags || []),
    ...posts.map((post) => post.type).filter(Boolean),
  ])].sort((a, b) => a.localeCompare(b, 'az'));
  const visiblePosts = posts.filter((post) => !category || (post.tags || []).includes(category) || post.type === category);

  const openPost = (post) => navigate(`/klub/${post.id}`);

  const createPost = async (event) => {
    event.preventDefault();
    if (!user) return setError('Yazı paylaşmaq üçün daxil olun.');
    try {
      if (!postCategory.trim()) return setError('Yazı üçün kateqoriya daxil edin.');
      const savedCategory = await api.addCategory(postCategory.trim());
      const uploaded = postFile ? await api.uploadMedia(postFile) : null;
      await api.createClubPost({ title: postTitle, content: postContent, type: postType, tags: [savedCategory.name], mediaUrl: uploaded?.url || '' });
      setPostTitle(''); setPostContent(''); setPostType('müzakirə'); setPostCategory(''); setPostFile(null); setShowComposer(false); setPosts(await api.getClubPosts(search)); setError('');
    } catch (err) { setError(err.message); }
  };

  const addComment = async (event) => {
    event.preventDefault();
    if (!user) return setError('Rəy yazmaq üçün daxil olun.');
    if (!comment.trim()) return;
    try {
      await api.addClubComment(selected.id, comment);
      setComment('');
      setSelected(await api.getClubPost(selected.id));
      setError('');
    }
    catch (err) { setError(err.message); }
  };

  const saveCommentEdit = async () => {
    if (!editingComment?.text.trim()) return;
    try {
      const updated = await api.updateClubComment(selected.id, editingComment.id, editingComment.text);
      setSelected((current) => ({ ...current, commentsList: current.commentsList.map((item) => item.id === updated.id ? { ...item, text: updated.text } : item) }));
      setEditingComment(null);
      setError('');
    } catch (err) { setError(err.message); }
  };

  const deleteComment = async (commentId) => {
    if (!window.confirm('Bu rəyi silmək istədiyinizə əminsiniz?')) return;
    try {
      await api.deleteClubComment(selected.id, commentId);
      setSelected((current) => ({ ...current, commentsList: current.commentsList.filter((item) => item.id !== commentId) }));
      setError('');
    } catch (err) { setError(err.message); }
  };

  const commentReportUrl = (item) => `/sikayet?commentType=klub-rəyi&commentId=${item.id}&comment=${encodeURIComponent(item.text)}&project=${encodeURIComponent(selected.title)}&projectId=${selected.id}`;

  return (
    <div className="ai-community-page min-h-screen bg-[#F8FAFC] pt-24 px-4 sm:px-6 lg:px-8">
      <main className="max-w-7xl mx-auto py-8">
        {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-xl text-sm">{error}</div>}
        {postId && loading ? (
          <div className="py-24 flex justify-center text-blue-600"><Loader2 className="w-7 h-7 animate-spin" /></div>
        ) : !selected ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <section className="lg:col-span-8 space-y-5">
              <header className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-8 shadow-sm">
                <div className="flex justify-between items-center gap-3 mb-5">
                  <h1 className="text-2xl sm:text-3xl font-black text-slate-900">Klub <span className="text-blue-600">({posts.length})</span></h1>
                  <button onClick={() => setShowComposer((value) => !value)} className="text-sm font-bold text-white bg-blue-600 px-4 py-2 rounded-xl">Yazı paylaş</button>
                </div>
                {showComposer && <form onSubmit={createPost} className="space-y-3 mb-5 p-4 bg-blue-50 rounded-2xl"><input value={postTitle} onChange={(event) => setPostTitle(event.target.value)} required placeholder="Başlıq" className="w-full px-3 py-2 rounded-lg border border-slate-200" /><select value={postType} onChange={(event) => setPostType(event.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white"><option value="müzakirə">Müzakirə</option><option value="sual">Sual</option><option value="elan">Elan</option><option value="təcrübə">Təcrübə</option></select><input value={postCategory} onChange={(event) => setPostCategory(event.target.value)} required placeholder="Kateqoriya (özünüz daxil edin)" className="w-full px-3 py-2 rounded-lg border border-slate-200" /><textarea value={postContent} onChange={(event) => setPostContent(event.target.value)} required placeholder="Məzmun" className="w-full px-3 py-2 rounded-lg border border-slate-200 min-h-24" /><input type="file" accept="image/*,video/*,audio/*,application/pdf" onChange={(event) => setPostFile(event.target.files?.[0] || null)} className="w-full text-sm" /><button className="px-4 py-2 bg-slate-900 text-white rounded-lg font-semibold">Dərc et</button></form>}
                <div className="relative z-30 flex items-center border border-slate-200 rounded-xl overflow-visible bg-white"><Search className="ml-4 w-5 h-5 text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Post axtarışı" className="w-full min-w-0 px-3 py-3 outline-none" /><div className="relative border-l border-slate-200 shrink-0"><button type="button" onClick={() => setCategoryMenuOpen((open) => !open)} className="h-12 px-3 flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-blue-600"><SlidersHorizontal className="w-4 h-4" /><span>{category || 'Kateqoriya'}</span><ChevronDown className={`w-4 h-4 ${categoryMenuOpen ? 'rotate-180' : ''}`} /></button>{categoryMenuOpen && <div className="absolute right-0 top-[calc(100%+10px)] z-[100] w-72 max-h-[min(70vh,32rem)] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl"><p className="px-3 py-2 text-[11px] uppercase tracking-widest text-slate-400 font-black">Kateqoriya seç</p>{['', ...postCategories].map((item) => <button key={item || 'all'} type="button" onClick={() => { setCategory(item); setCategoryMenuOpen(false); }} className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-sm font-semibold ${category === item ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50'}`}><span>{item || 'Bütün kateqoriyalar'}</span>{category === item && <Check className="w-4 h-4" />}</button>)}</div>}</div></div>
              </header>
              {loading ? <div className="py-16 flex justify-center text-blue-600"><Loader2 className="animate-spin" /></div> : visiblePosts.map((post) => <article key={post.id} onClick={() => openPost(post)} className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-7 cursor-pointer hover:border-blue-300 hover:shadow-lg transition-all"><div className="flex flex-wrap justify-between gap-3"><div><h2 className="text-lg sm:text-xl font-bold text-slate-900">{post.title}</h2>{post.isDemo && <span className="mt-2 inline-block rounded-full bg-violet-100 px-2.5 py-1 text-[10px] font-bold text-violet-800">{post.demoLabel || 'Demo hesabı'}</span>}</div><span className="text-xs uppercase text-blue-600 bg-blue-50 px-2 py-1 rounded">{post.tags?.[0] || post.type}</span></div><div className="flex flex-wrap gap-4 text-sm text-slate-500 mt-4"><span><MessageCircle className="inline w-4 h-4" /> {post.comments} rəy</span><span><Eye className="inline w-4 h-4" /> {post.views} baxış</span><span><Clock className="inline w-4 h-4" /> {daysAgo(post.createdAt)} gün öncə</span></div><p className="text-slate-500 mt-4 line-clamp-2">{post.content}</p>{post.mediaUrl && (post.mediaUrl.match(/\.(mp4|webm)$/i) ? <video src={post.mediaUrl} controls className="mt-4 max-h-64 w-full rounded-xl" /> : <img src={post.mediaUrl} alt="" className="mt-4 max-h-64 w-full rounded-xl object-cover" />)}</article>)}
            </section>
            <aside className="lg:col-span-4 bg-white border border-slate-200 rounded-3xl p-5 sm:p-7 self-start lg:sticky lg:top-28"><h2 className="font-bold text-slate-900 mb-5">Son mövzular</h2>{posts.slice(0, 5).map((post) => <button key={post.id} onClick={() => openPost(post)} className="block text-left w-full py-3 border-b border-slate-100"><span className="font-semibold text-sm text-slate-700">{post.title}</span>{post.isDemo && <span className="ml-2 rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-bold text-violet-800">{post.demoLabel || 'Demo hesabı'}</span>}<span className="block text-xs text-slate-400 mt-1">{post.comments} rəy · {post.views} baxış</span></button>)}</aside>
          </div>
        ) : (
          <div className="max-w-4xl">
            <button type="button" onClick={() => { setSelected(null); setError(''); navigate('/klub'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="flex items-center gap-2 mb-5 text-slate-600 font-semibold"><ArrowLeft className="w-5 h-5" /> Kluba qayıt</button>
            <article className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-9 shadow-sm">
              <div className="flex justify-between gap-4">
                <div><h1 className="text-2xl sm:text-3xl font-black text-slate-900">{selected.title}</h1><p className="text-sm text-slate-500 mt-2">{selected.author} · {daysAgo(selected.createdAt)} gün öncə</p>{selected.isDemo && <span className="mt-2 inline-block rounded-full bg-violet-100 px-2.5 py-1 text-[10px] font-bold text-violet-800">{selected.demoLabel || 'Demo hesabı'}</span>}<span className="inline-block mt-3 text-xs font-bold uppercase text-blue-600 bg-blue-50 px-2 py-1 rounded">{selected.tags?.[0] || selected.type}</span></div>
                <button title="Paylaş" onClick={() => navigator.clipboard?.writeText(window.location.href)} className="p-2 h-10 border border-slate-200 rounded-lg"><Share2 className="w-5 h-5" /></button>
              </div>
              <div className="flex gap-4 text-sm text-slate-500 my-6 pb-5 border-b"><span><Eye className="inline w-4 h-4" /> {selected.views}</span><span><MessageCircle className="inline w-4 h-4" /> {selected.commentsList?.length || 0}</span></div>
              <p className="whitespace-pre-wrap leading-relaxed text-slate-700">{selected.content}</p>
              {selected.mediaUrl && (selected.mediaUrl.match(/\.(mp4|webm)$/i) ? <video src={selected.mediaUrl} controls className="mt-6 max-h-96 w-full rounded-xl" /> : <img src={selected.mediaUrl} alt="" className="mt-6 max-h-96 w-full rounded-xl object-contain" />)}
            </article>
            <section className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-8 mt-5">
              <h2 className="text-xl font-bold mb-5">Rəylər ({selected.commentsList?.length || 0})</h2>
              <form onSubmit={addComment} className="flex gap-2 mb-7"><input value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Rəyinizi yazın..." className="flex-1 min-w-0 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500/20" /><button className="p-3 bg-blue-600 text-white rounded-xl" title="Göndər"><Send className="w-5 h-5" /></button></form>
              <div className="space-y-4">
                {selected.commentsList?.map((item) => (
                  <article key={item.id} className="border-t pt-4">
                    <div className="flex items-start justify-between gap-3"><div><UserProfileLink userId={item.authorId} name={item.author} avatarUrl={item.authorAvatarUrl} />{editingComment?.id === item.id ? <div className="mt-2 flex flex-wrap gap-2"><input value={editingComment.text} onChange={(event) => setEditingComment((current) => ({ ...current, text: event.target.value }))} className="min-w-0 flex-1 rounded-lg border border-slate-200 px-3 py-2" /><button type="button" onClick={saveCommentEdit} className="text-sm font-bold text-blue-700">Yadda saxla</button><button type="button" onClick={() => setEditingComment(null)} className="text-sm text-slate-500">Ləğv et</button></div> : <p className="text-slate-600 mt-1">{item.text}</p>}</div>
                      <CommentActions isAuthor={user?.id === item.authorId} reportUrl={commentReportUrl(item)} onEdit={() => setEditingComment({ id: item.id, text: item.text })} onDelete={() => deleteComment(item.id)} />
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}

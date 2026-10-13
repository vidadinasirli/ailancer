import React, { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, Check, ChevronDown, Eye, Heart, Loader2, MessageCircle, Search, SlidersHorizontal, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api.js';
import { PORTFOLIO_CATEGORY_OPTIONS } from '../lib/categoryOptions.js';
import { SpotlightCard } from '../components/ui/spotlight-card.jsx';

const CATEGORIES = ['İnformasiya texnologiyaları', 'Dizayn', 'Media'];

function ProjectMedia({ project, detail = false }) {
  const mediaSource = project.image || project.imageUrl || project.mediaUrls?.[0] || '';
  const isVideo = /\.(mp4|webm|mov|ogg)(\?|$)/i.test(mediaSource);
  const videoRef = useRef(null);
  const mediaClass = detail
    ? 'w-full h-full max-h-[560px] object-contain'
    : 'w-full h-full object-contain transition-transform duration-500 group-hover:scale-[1.02]';

  useEffect(() => {
    if (!isVideo || detail || !window.matchMedia('(max-width: 640px)').matches) return undefined;
    const video = videoRef.current;
    if (!video) return undefined;
    video.play().catch(() => {});
    return () => {
      video.pause();
      video.currentTime = 0;
    };
  }, [detail, isVideo]);

  const playPreview = () => {
    if (!videoRef.current || detail) return;
    videoRef.current.currentTime = 0;
    videoRef.current.play().catch(() => {});
  };

  const stopPreview = () => {
    if (!videoRef.current || detail) return;
    videoRef.current.pause();
    videoRef.current.currentTime = 0;
  };

  return (
    <div
      className={`ai-project-media ${detail ? 'ai-project-media-detail min-h-[360px]' : 'aspect-square'} relative overflow-hidden flex items-center justify-center bg-gradient-to-br from-blue-100 via-cyan-50 to-indigo-100`}
      onMouseEnter={playPreview}
      onMouseLeave={stopPreview}
      onTouchStart={playPreview}
    >
      <div className="ai-project-media-grid absolute inset-0" aria-hidden="true" />
      <div className="ai-project-media-orb ai-project-media-orb-one" aria-hidden="true" />
      <div className="ai-project-media-orb ai-project-media-orb-two" aria-hidden="true" />
      {mediaSource && (isVideo ? (
        <video
          ref={videoRef}
          src={mediaSource}
          title={project.title}
          muted
          playsInline
          controls={detail}
          preload="metadata"
          onTimeUpdate={(event) => {
            if (!detail && event.currentTarget.currentTime >= 8) stopPreview();
          }}
          className={`${mediaClass} relative z-10`}
        />
      ) : (
        <img src={mediaSource} alt={project.title} onError={(event) => { event.currentTarget.style.display = 'none'; }} className={`${mediaClass} relative z-10`} />
      ))}
      {!mediaSource && <div className="ai-project-media-empty"><Sparkles size={detail ? 34 : 25} /><span>Layihə vitrini</span></div>}
    </div>
  );
}

export default function Layiheler() {
  const [projects, setProjects] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [sharedCategories, setSharedCategories] = useState([]);
  const [extraFilter, setExtraFilter] = useState('');
  const [categoryMenuOpen, setCategoryMenuOpen] = useState(false);
  const [clubPosts, setClubPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;
    setLoading(true);
    api.getProjects({ search }).then((data) => active && setProjects(data))
      .catch((err) => active && setError(err.message))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [search]);

  useEffect(() => {
    api.getCategories().then(setSharedCategories).catch((err) => setError(err.message));
  }, []);

  useEffect(() => {
    let active = true;
    api.getClubPosts().then((data) => active && setClubPosts(data.slice(0, 3))).catch(() => active && setClubPosts([]));
    return () => { active = false; };
  }, []);

  const categoryCounts = projects.reduce((counts, project) => {
    (project.categories || [project.category]).forEach((item) => {
      counts[item] = (counts[item] || 0) + 1;
    });
    return counts;
  }, {});
  const categoryOptions = [...new Set([...Object.entries(categoryCounts)
    .sort(([categoryA, countA], [categoryB, countB]) => countB - countA || categoryA.localeCompare(categoryB, 'az'))
    .map(([item]) => item), ...sharedCategories, ...CATEGORIES, ...PORTFOLIO_CATEGORY_OPTIONS])].sort((a, b) => a.localeCompare(b, 'az'));
  const popularCategories = categoryOptions;
  const visibleProjects = projects.filter((project) => (
    !category || (project.categories || [project.category]).includes(category)
  ) && (!extraFilter
    || (extraFilter === 'popular' && (project.views > 0 || project.likes > 0))
    || (extraFilter === 'liked' && project.likes > 0)
    || (extraFilter === 'viewed' && project.views > 0)));

  return (
    <div className="ai-marketplace-page ai-projects-page min-h-screen bg-[#F8FAFC] pt-24 px-4 sm:px-6 lg:px-8">
      <main className="max-w-7xl mx-auto py-8"><div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <section className="lg:col-span-9 space-y-6">
          <header className="bg-white/80 border border-slate-200 rounded-3xl p-5 sm:p-8 shadow-sm">
            <div className="ai-marketplace-heading mb-6">
              <div>
                <span className="ai-marketplace-eyebrow"><Sparkles size={14} /> Yaradıcı işlər</span>
                <h1 className="mt-3 text-2xl sm:text-3xl font-black text-slate-900">Layihə vitrini <span className="ai-marketplace-count">({projects.length})</span></h1>
                <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">İstedadları real iş nümunələri ilə kəşf et, ilham al və layihə müəllifi ilə əlaqə qur.</p>
              </div>
              <span className="ai-marketplace-live"><span /> Canlı portfolio</span>
            </div>
            <div className="relative z-30 flex items-center bg-white border border-slate-200 rounded-2xl overflow-visible focus-within:ring-2 focus-within:ring-blue-500/20">
              <Search className="ml-4 w-5 h-5 text-slate-400 shrink-0" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Layihə və ya müəllif axtarışı..." className="w-full min-w-0 px-3 py-4 outline-none text-sm sm:text-base" />
              <div className="relative shrink-0 border-l border-slate-200">
                <button type="button" onClick={() => setCategoryMenuOpen((open) => !open)} aria-expanded={categoryMenuOpen} className="h-14 px-4 flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-blue-600 hover:bg-slate-50">
                  <SlidersHorizontal className="w-4 h-4" /><span className="max-w-24 truncate">{category || 'Kateqoriya'}</span><ChevronDown className={`w-4 h-4 transition-transform ${categoryMenuOpen ? 'rotate-180' : ''}`} />
                </button>
                {categoryMenuOpen && <div className="absolute right-0 top-[calc(100%+10px)] z-[100] w-72 max-h-[min(70vh,32rem)] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl">
                  <p className="px-3 py-2 text-[11px] uppercase tracking-widest text-slate-400 font-black">Kateqoriya seç</p>
                  {['', ...categoryOptions].map((item) => <button key={item || 'all'} type="button" onClick={() => { setCategory(item); setCategoryMenuOpen(false); }} className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-sm font-semibold ${category === item ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50'}`}><span className="pr-2 text-left">{item || 'Bütün kateqoriyalar'}</span>{category === item && <Check className="w-4 h-4 shrink-0" />}</button>)}
                </div>}
              </div>
            </div>
          </header>
          {loading && <div className="py-16 flex justify-center text-blue-600"><Loader2 className="animate-spin" /></div>}
          {error && <div className="ai-marketplace-error p-4 rounded-xl bg-red-50 text-red-700">{error}</div>}
          {!loading && !error && visibleProjects.length === 0 && <div className="ai-marketplace-empty"><Sparkles size={22} /><strong>Axtarışa uyğun layihə tapılmadı</strong><span>Başqa sözlə axtar və ya filtrini dəyiş.</span></div>}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">{visibleProjects.map((project) => <SpotlightCard as="article" key={project.id} onClick={() => navigate(`/layiheler/${project.id}`)} className="ai-project-card group bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm hover:-translate-y-1 hover:shadow-xl transition-all cursor-pointer"><ProjectMedia project={project} /><div className="p-4"><div className="flex justify-between gap-3"><h2 className="font-bold text-slate-900 line-clamp-2">{project.title}</h2><button type="button" aria-label="Layihəni bəyən" onClick={async (event) => { event.stopPropagation(); const result = await api.likeProject(project.id); setProjects((items) => items.map((item) => item.id === project.id ? { ...item, likes: result.likes, liked: result.liked } : item)); }} className={`rounded-full p-1 transition-colors ${project.liked ? 'text-red-500 bg-red-50' : 'text-slate-300 hover:text-red-500 hover:bg-red-50'}`}><Heart className="w-5 h-5" fill={project.liked ? 'currentColor' : 'none'} /></button></div><div className="mt-1 flex items-center gap-2"><p className="text-sm text-slate-500">{project.author}</p>{project.isDemo && <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-bold text-violet-700">Demo hesabı</span>}</div><div className="flex items-center gap-4 text-xs text-slate-400 mt-4"><span className="text-blue-600">{project.category}</span><span className="flex items-center gap-1"><Eye className="w-4 h-4" />{project.views}</span><span className="flex items-center gap-1"><Heart className="w-4 h-4" />{project.likes}</span><ArrowUpRight className="ml-auto w-4 h-4 text-slate-500 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" /></div></div></SpotlightCard>)}</div>
        </section>
        <aside className="lg:col-span-3 self-start glass-panel rounded-3xl shadow-[0_15px_40px_-15px_rgba(0,0,0,0.05)] lg:sticky lg:top-28 overflow-hidden">
          <div className="p-8">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2 mb-6"><div className="w-2 h-6 bg-blue-500 rounded-full" />Məşhur layihə sahələri</h2>
            <div className="space-y-4 max-h-72 overflow-y-auto">
              {popularCategories.map((item) => <label key={item} className="flex items-center gap-4 cursor-pointer group"><input type="checkbox" checked={category === item} onChange={() => setCategory(category === item ? '' : item)} className="peer sr-only" /><span className="w-6 h-6 rounded-lg border-2 border-slate-300 flex items-center justify-center peer-checked:bg-blue-500 peer-checked:border-blue-500">{category === item && <Check className="w-4 h-4 text-white" />}</span><span className="text-base font-semibold text-slate-600 group-hover:text-slate-900">{item}</span></label>)}
            </div>
          </div>
          <div className="border-t border-slate-200/80 p-8">
            <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2"><div className="w-2 h-6 bg-indigo-500 rounded-full" />Əlavə olaraq</h2>
            <div className="space-y-4">
              {[{ value: 'popular', label: 'Populyar layihələr' }, { value: 'liked', label: 'Ən çox bəyənilənlər' }, { value: 'viewed', label: 'Ən çox baxılanlar' }].map((filter) => <label key={filter.value} className="flex items-center gap-4 cursor-pointer group"><input type="checkbox" checked={extraFilter === filter.value} onChange={() => setExtraFilter(extraFilter === filter.value ? '' : filter.value)} className="peer sr-only" /><span className="w-6 h-6 rounded-lg border-2 border-slate-300 flex items-center justify-center peer-checked:bg-indigo-500 peer-checked:border-indigo-500">{extraFilter === filter.value && <Check className="w-4 h-4 text-white" />}</span><span className="text-base font-semibold text-slate-600 group-hover:text-slate-900">{filter.label}</span></label>)}
            </div>
          </div>
          <div className="border-t border-slate-200/80 p-8">
            <h2 className="text-xl font-bold text-slate-900 mb-8 flex items-center gap-2"><div className="w-2 h-6 bg-emerald-500 rounded-full" />"Klub"-da yeni yazılar</h2>
            <div className="space-y-6 divide-y divide-slate-200/60">
              {clubPosts.map((post, index) => (
                <div key={post.id} onClick={() => navigate(`/klub/${post.id}`)} className={`${index ? 'pt-6 ' : ''}group cursor-pointer`}>
                  <div className="flex justify-between gap-3 text-xs text-blue-500 font-bold mb-3">
                    <span className="bg-blue-50 px-2 py-1 rounded-md">{post.type}</span>
                    <span className="text-slate-400 truncate">{post.author}</span>
                  </div>
                  <h3 className="font-bold text-slate-800 line-clamp-1 group-hover:text-blue-600">{post.title}</h3>
                  {post.isDemo && <span className="mt-1 inline-block rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-bold text-violet-800">{post.demoLabel || 'Demo hesabı'}</span>}
                  <div className="flex items-center gap-4 text-xs text-slate-400 mt-4">
                    <span className="flex items-center gap-1"><MessageCircle className="w-4 h-4" />{post.comments}</span>
                    <span className="flex items-center gap-1"><Eye className="w-4 h-4" />{post.views}</span>
                  </div>
                </div>
              ))}
              {clubPosts.length === 0 && <p className="text-sm text-slate-400">Yeni yazı yoxdur.</p>}
            </div>
            <button type="button" onClick={() => navigate('/klub')} className="w-full mt-8 py-4 text-sm font-bold text-slate-700 bg-slate-100/50 hover:text-blue-600 hover:bg-blue-50 rounded-2xl transition-all border border-slate-200/50">Bütün mövzular</button>
          </div>
        </aside>
      </div></main>
    </div>
  );
}

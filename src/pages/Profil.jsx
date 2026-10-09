import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../lib/api.js';
import UserProfileLink from '../components/UserProfileLink.jsx';
import { PORTFOLIO_CATEGORY_GROUPS } from '../lib/categoryOptions.js';
import { 
  MessageCircle, 
  Edit, 
  Share2, 
  Plus, 
  CheckCircle2, 
  Image as ImageIcon,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  List,
  Maximize,
  UploadCloud,
  ArrowLeft,
  MessageSquare,
  Award,
  Briefcase,
  Code,
  Globe,
  Languages,
  Palette,
  PenTool,
  Server,
  Smartphone,
  Video,
  Star,
} from 'lucide-react';

function activityIconFor(area) {
  const value = String(area || '').toLocaleLowerCase('az-AZ');
  if (/web|front|back|proqram|kod|developer|developer|seo|it/.test(value)) return Code;
  if (/dizayn|design|qrafik|logo/.test(value)) return Palette;
  if (/video|montaj|motion/.test(value)) return Video;
  if (/mobil|ios|android|app/.test(value)) return Smartphone;
  if (/server|backend|cloud/.test(value)) return Server;
  if (/yazı|copy|kontent|mətn|məzmun/.test(value)) return PenTool;
  if (/tərcümə|dil|translation/.test(value)) return Languages;
  if (/smm|marketinq|sosial/.test(value)) return Globe;
  return Briefcase;
}

export default function Profil() {
  const { user, profileData } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedProfileId = searchParams.get('userId');
  const [displayProfile, setDisplayProfile] = useState(profileData);
  const [view, setView] = useState('profile'); // 'profile' or 'add-portfolio'
  const [activeCategory, setActiveCategory] = useState('it');
  const [portfolio, setPortfolio] = useState({ title: '', description: '', categories: ['Dizayn'], imageUrl: '', mediaFiles: [], mediaUrls: [] });
  const [portfolioMessage, setPortfolioMessage] = useState('');
  const [portfolioCategoryInput, setPortfolioCategoryInput] = useState('');
  const [sharedCategories, setSharedCategories] = useState([]);
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    const profileId = requestedProfileId || profileData?.id;
    if (!profileId) return;
    api.getUser(profileId).then(setDisplayProfile).catch(() => {
      if (!requestedProfileId) setDisplayProfile(profileData);
    });
  }, [requestedProfileId, profileData]);

  useEffect(() => {
    const draftParam = searchParams.get('aiDraft');
    if (!draftParam || !user || (requestedProfileId && requestedProfileId !== String(user.id))) return;
    try {
      const draft = JSON.parse(draftParam);
      if (!draft || typeof draft !== 'object') throw new Error('AI portfolio qaralaması düzgün deyil.');
      setPortfolio((current) => ({
        ...current,
        title: String(draft.title || '').slice(0, 120),
        description: String(draft.description || '').slice(0, 3000),
        categories: [String(draft.category || 'Dizayn').slice(0, 100)],
      }));
      setView('add-portfolio');
      setPortfolioMessage('Gemini qaralaması gətirildi. Dərc etməzdən əvvəl mətni yoxlayın və media əlavə edin.');
      setSearchParams({}, { replace: true });
    } catch {
      setPortfolioMessage('AI portfolio qaralaması açıla bilmədi.');
      setSearchParams({}, { replace: true });
    }
  }, [requestedProfileId, searchParams, setSearchParams, user]);

  useEffect(() => {
    if (displayProfile?.id) api.getProjects({ ownerId: displayProfile.id }).then(setProjects).catch(() => setProjects([]));
  }, [displayProfile?.id]);

  useEffect(() => {
    api.getCategories().then(setSharedCategories).catch((error) => setPortfolioMessage(error.message));
  }, []);

  const addPortfolioCategory = async () => {
    const name = portfolioCategoryInput.trim();
    if (!name) return;
    try {
      const saved = await api.addCategory(name);
      setSharedCategories((current) => [...new Set([...current, saved.name])]);
      setPortfolio((current) => ({ ...current, categories: current.categories.includes(saved.name) ? current.categories : [...current.categories, saved.name] }));
      setPortfolioCategoryInput('');
      setPortfolioMessage('');
    } catch (error) {
      setPortfolioMessage(error.message);
    }
  };

  const handlePortfolioFile = (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;
    setPortfolio((current) => ({
      ...current,
      mediaFiles: files,
      mediaUrls: files.map((file) => URL.createObjectURL(file)),
      imageUrl: URL.createObjectURL(files[0]),
    }));
  };

  const handlePortfolioSubmit = async (event) => {
    event.preventDefault();
    if (displayProfile?.id !== user?.id) return;
    if (!portfolio.title.trim() || !portfolio.description.trim() || !portfolio.mediaFiles.length) {
      setPortfolioMessage('Başlıq, təsvir və ən azı bir şəkil və ya video əlavə edin.');
      return;
    }
    try {
      setPortfolioMessage('Fayl yüklənir...');
      const uploaded = await Promise.all(portfolio.mediaFiles.map((file) => api.uploadMedia(file)));
      const mediaUrls = uploaded.map((item) => item.url);
      const categories = portfolio.categories.length ? portfolio.categories : ['Dizayn'];
      await api.createProject({ title: portfolio.title, description: portfolio.description, category: categories[0], categories, imageUrl: mediaUrls[0], mediaUrls });
      setPortfolioMessage('Portfolio layihəsi əlavə edildi.');
      setProjects(await api.getProjects({ ownerId: displayProfile.id }));
      setPortfolio({ title: '', description: '', categories: ['Dizayn'], imageUrl: '', mediaFiles: [], mediaUrls: [] });
    } catch (error) {
      setPortfolioMessage(error.message);
    }
  };

  const isOwnProfile = Boolean(user && displayProfile?.id === user.id);

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-800 selection:bg-blue-200 selection:text-blue-900 flex flex-col relative overflow-hidden pt-24">
      
      {/* Global Ambient Background Effects - Premium Look */}
      <div className="fixed top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-blue-400/10 blur-[150px] pointer-events-none z-0"></div>
      <div className="fixed bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-cyan-400/10 blur-[150px] pointer-events-none z-0"></div>

      {}
      <style>{`
        .glass-panel {
          background: rgba(255, 255, 255, 0.75);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(255, 255, 255, 0.9);
        }
        .hero-pattern {
          background-color: #94a3b8;
          background-image: radial-gradient(circle at 100% 100%, rgba(255,255,255,0.1) 0, rgba(255,255,255,0.1) 10px, transparent 10px), radial-gradient(circle at 0 0, rgba(255,255,255,0.1) 0, rgba(255,255,255,0.1) 10px, transparent 10px);
          background-size: 40px 40px;
        }
        /* Custom Scrollbar for inner elements if needed */
        ::-webkit-scrollbar {
          width: 6px;
        }
        ::-webkit-scrollbar-track {
          background: transparent;
        }
        ::-webkit-scrollbar-thumb {
          background-color: #CBD5E1;
          border-radius: 20px;
        }
      `}</style>

      {/* Main Content Container */}
      <main className="flex-grow max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full relative z-10 flex flex-col">
        
        {view === 'profile' ? (
          /* =========================================
             PROFILE VIEW
             ========================================= */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in zoom-in-95 duration-500">
            
            {/* LEFT COLUMN - MAIN PROFILE INFO */}
            <div className="lg:col-span-8 space-y-8">
              
              {/* Hero Banner Card */}
              <div className="glass-panel rounded-3xl overflow-hidden shadow-[0_15px_40px_-15px_rgba(0,0,0,0.05)] border border-slate-200/60 relative">
                
                {/* Banner Background */}
                <div className="h-64 hero-pattern relative" style={displayProfile.bannerUrl ? { backgroundImage: `url(${displayProfile.bannerUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}>
                  {/* Decorative skyline silhouette mockup using CSS */}
                  <div className="absolute bottom-0 left-0 w-full h-32 opacity-20 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBwcmVzZXJ2ZUFzcGVjdFJhdGlvPSJub25lIj48cGF0aCBkPSJNMCAxMDBMMCA4MEwxMCA4MEwxMCA2MEwyMCA2MEwyMCA5MEwzMCA5MEwzMCA1MEw0MCA1MEw0MCA3MEw1MCA3MEw1MCA0MEw2MCA0MEw2MCA4MEw3MCA4MEw3MCAzMEw4MCAzMEw4MCA5MEw5MCA5MEw5MCAxMDBaIiBmaWxsPSIjMDAwIi8+PC9zdmc+')] bg-repeat-x bg-[length:100px_100%]"></div>
                  
                  <div className="absolute top-6 right-6 flex items-center gap-2">
                    <span className="flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full text-white text-sm font-bold shadow-sm border border-white/30">
                      <div className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-pulse"></div>
                      {displayProfile.onlineStatus?.isOnline ? 'Onlayn' : 'Offline'}
                    </span>
                  </div>

                  {/* Banner Action Buttons (Bottom Right) */}
                  <div className="absolute bottom-6 right-6 flex items-center gap-3">
                    {isOwnProfile && <button type="button" onClick={() => navigate('/kabinet?tab=personal_info')} className="p-3 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white rounded-xl transition-all border border-white/30 shadow-sm"><Edit className="w-5 h-5" /></button>}
                    <button className="p-3 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white rounded-xl transition-all border border-white/30 shadow-sm">
                      <Share2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Profile Details Area */}
                <div className="px-8 pb-8 pt-0 relative">
                  <div className="flex flex-col md:flex-row items-start gap-6">
                    
                    {/* Avatar (Overlapping banner) */}
                    <div className="w-32 h-32 rounded-3xl bg-slate-100 border-4 border-white shadow-xl flex items-center justify-center font-bold text-slate-400 text-4xl -mt-16 relative z-10 overflow-hidden">
                      {displayProfile.avatarUrl ? <img src={displayProfile.avatarUrl} alt={displayProfile.fullName} className="w-full h-full object-cover" /> : <UserIconPlaceholder />}
                    </div>

                    <div className="flex-1 pt-4">
                      <div className="flex items-center gap-3 mb-1">
                        <h1 className="text-3xl font-black text-slate-900">{displayProfile.fullName || user?.fullName || 'İstifadəçi'}</h1>
                      </div>
                      <p className="text-slate-500 font-medium mb-4">@{(displayProfile.nickname || displayProfile.fullName || 'istifadeci').toLowerCase().replace(/\s+/g, '')}</p>
                      
                      {user && !isOwnProfile && <button onClick={() => navigate(`/mesajlar?to=${displayProfile.id}`)} className="flex items-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-600 font-bold px-5 py-2.5 rounded-xl transition-colors border border-blue-200/50 shadow-sm">
                        <MessageCircle className="w-5 h-5" />
                        Mesajlar
                      </button>}
                    </div>
                  </div>
                </div>
              </div>

              <section className="glass-panel rounded-3xl border border-slate-200/60 p-6 shadow-sm sm:p-8">
                <div className="mb-5 flex items-center justify-between border-b border-slate-200/80 pb-4">
                  <h2 className="text-xl font-bold text-slate-900">Haqqımda</h2>
                  {user?.id === displayProfile?.id && <button type="button" onClick={() => navigate('/kabinet?tab=personal_info')} className="text-sm font-bold text-blue-700 hover:underline">Bio-nu redaktə et</button>}
                </div>
                <p className="whitespace-pre-wrap text-base leading-7 text-slate-700">{displayProfile.about || 'Bio məlumatı əlavə edilməyib.'}</p>
                <div className="mt-6 border-t border-slate-100 pt-5">
                  <h3 className="mb-3 text-sm font-bold text-slate-800">Fəaliyyət sahələri</h3>
                  <div className="flex flex-wrap gap-2">
                    {[...new Set([...(displayProfile.activityAreas || []), ...(displayProfile.specialties || []).map((item) => item.category).filter(Boolean)])].map((area) => {
                      const Icon = activityIconFor(area);
                      return <span key={area} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700"><Icon className="h-4 w-4 text-blue-600" />{area}</span>;
                    })}
                    {!displayProfile.activityAreas?.length && !displayProfile.specialties?.length && <span className="text-sm text-slate-500">Fəaliyyət sahəsi əlavə edilməyib.</span>}
                  </div>
                </div>
              </section>

              {displayProfile.role === 'musteri' && <section className="glass-panel rounded-3xl border border-slate-200/60 p-6 shadow-sm sm:p-8">
                <div className="mb-5 flex items-center justify-between border-b border-slate-200/80 pb-4"><h2 className="text-xl font-bold text-slate-900">Şirkət haqqında</h2>{user?.id === displayProfile?.id && <button type="button" onClick={() => navigate('/kabinet?tab=personal_info')} className="text-sm font-bold text-blue-700 hover:underline">Redaktə et</button>}</div>
                <dl className="grid gap-4 sm:grid-cols-2">{displayProfile.companyName && <div><dt className="text-xs font-semibold text-slate-500">Şirkət</dt><dd className="mt-1 font-bold text-slate-900">{displayProfile.companyName}</dd></div>}{displayProfile.companyIndustry && <div><dt className="text-xs font-semibold text-slate-500">Fəaliyyət sahəsi</dt><dd className="mt-1 font-bold text-slate-900">{displayProfile.companyIndustry}</dd></div>}{displayProfile.companySize && <div><dt className="text-xs font-semibold text-slate-500">Ölçü</dt><dd className="mt-1 font-bold text-slate-900">{displayProfile.companySize}</dd></div>}{displayProfile.companyWebsite && <div><dt className="text-xs font-semibold text-slate-500">Veb-sayt</dt><dd className="mt-1"><a href={displayProfile.companyWebsite} target="_blank" rel="noreferrer" className="font-bold text-blue-700 hover:underline">{displayProfile.companyWebsite}</a></dd></div>}</dl>
                {!displayProfile.companyName && !displayProfile.companyIndustry && !displayProfile.companySize && !displayProfile.companyWebsite && <p className="text-sm text-slate-500">Şirkət məlumatı əlavə edilməyib.</p>}
              </section>}

              {displayProfile.role === 'freelancer' && <section className="glass-panel rounded-3xl border border-slate-200/60 p-6 shadow-sm sm:p-8">
                <div className="mb-5 flex items-center justify-between border-b border-slate-200/80 pb-4">
                  <h2 className="flex items-center gap-2 text-xl font-bold text-slate-900"><Briefcase className="h-5 w-5 text-blue-600" /> İş təcrübəsi</h2>
                  {user?.id === displayProfile?.id && <button type="button" onClick={() => navigate('/profil/tecrubeler?tab=experience')} className="inline-flex items-center gap-1 text-sm font-bold text-blue-700 hover:underline"><Plus className="h-4 w-4" /> Əlavə et</button>}
                </div>
                {displayProfile.workExperiences?.length ? <div className="space-y-5">{displayProfile.workExperiences.map((item) => <article key={item.id} className="flex gap-4"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600"><Briefcase className="h-5 w-5" /></span><div className="min-w-0"><h3 className="font-bold text-slate-900">{item.positionTitle}</h3><p className="mt-0.5 text-sm font-medium text-slate-700">{item.companyName}{item.location ? ` · ${item.location}` : ''}</p><p className="mt-1 text-xs text-slate-500">{item.employmentType}{item.employmentType ? ' · ' : ''}{item.startDate || 'Tarix qeyd edilməyib'} – {item.isCurrent ? 'Hazırda' : (item.endDate || 'Tarix qeyd edilməyib')}</p>{item.description && <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">{item.description}</p>}</div></article>)}</div> : <p className="text-sm text-slate-500">İş təcrübəsi əlavə edilməyib.</p>}
              </section>}

              {displayProfile.role === 'freelancer' && <section className="glass-panel rounded-3xl border border-slate-200/60 p-6 shadow-sm sm:p-8">
                <div className="mb-5 flex items-center justify-between border-b border-slate-200/80 pb-4">
                  <h2 className="flex items-center gap-2 text-xl font-bold text-slate-900"><Award className="h-5 w-5 text-blue-600" /> Sertifikatlar</h2>
                  {user?.id === displayProfile?.id && <button type="button" onClick={() => navigate('/profil/tecrubeler?tab=certificates')} className="inline-flex items-center gap-1 text-sm font-bold text-blue-700 hover:underline"><Plus className="h-4 w-4" /> Əlavə et</button>}
                </div>
                {displayProfile.certificates?.length ? <div className="space-y-4">{displayProfile.certificates.map((item) => <article key={item.id} className="flex gap-4"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700"><Award className="h-5 w-5" /></span><div className="min-w-0 flex-1"><h3 className="font-bold text-slate-900">{item.name}</h3><p className="mt-0.5 text-sm text-slate-600">{item.issuer}{item.issueDate ? ` · ${item.issueDate}` : ''}</p>{item.credentialId && <p className="mt-1 text-xs text-slate-500">ID: {item.credentialId}</p>}{item.description && <p className="mt-2 text-sm text-slate-600">{item.description}</p>}</div>{item.credentialUrl && <a href={item.credentialUrl} target="_blank" rel="noreferrer" className="shrink-0 self-start text-sm font-bold text-blue-700 hover:underline">Bax</a>}</article>)}</div> : <p className="text-sm text-slate-500">Sertifikat əlavə edilməyib.</p>}
              </section>}

              {displayProfile.role === 'freelancer' && <section className="glass-panel rounded-3xl border border-slate-200/60 p-6 shadow-sm sm:p-8">
                <div className="mb-5 flex items-center justify-between border-b border-slate-200/80 pb-4">
                  <h2 className="text-xl font-bold text-slate-900">İşlər və xidmətlər</h2>
                  {user?.id === displayProfile?.id && <button type="button" onClick={() => navigate('/kabinet?tab=freelancer_info')} className="text-sm font-bold text-blue-700 hover:underline">Freelancer məlumatlarını redaktə et</button>}
                </div>
                {displayProfile.specialties?.length ? <div className="grid gap-3 sm:grid-cols-2">{displayProfile.specialties.map((item) => { const Icon = activityIconFor(item.category); return <article key={item.id} className="rounded-xl border border-slate-200 bg-white p-4"><div className="flex items-start gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600"><Icon className="h-4 w-4" /></span><div className="min-w-0 flex-1"><p className="text-xs font-semibold text-slate-500">{item.category}</p><h3 className="mt-1 font-bold text-slate-900">{item.title}</h3>{item.about && <p className="mt-2 text-sm leading-5 text-slate-600">{item.about}</p>}<p className="mt-3 text-xs font-semibold text-slate-600">Təcrübə: {item.experience || 'Göstərilməyib'}</p></div></div></article>; })}</div> : <p className="text-sm text-slate-500">İş və xidmətlərinizi Freelancer məlumatları bölməsindən əlavə edin.</p>}
              </section>}

              <section className="glass-panel rounded-3xl border border-slate-200/60 p-6 shadow-sm sm:p-8">
                <div className="mb-5 flex items-center justify-between border-b border-slate-200/80 pb-4"><h2 className="flex items-center gap-2 text-xl font-bold text-slate-900"><Star className="h-5 w-5 text-amber-500" /> Rəylər</h2><span className="text-sm text-slate-500">{displayProfile.reviews?.length || 0}</span></div>
                {displayProfile.reviews?.length ? <div className="space-y-5">{displayProfile.reviews.map((review) => <article key={review.id} className="border-b border-slate-100 pb-5 last:border-0 last:pb-0"><div className="flex flex-wrap items-center justify-between gap-2"><div><UserProfileLink userId={review.authorId} name={review.authorName} avatarUrl={review.authorAvatarUrl} /><p className="ml-11 text-xs text-slate-500">{review.taskTitle}{review.createdAt ? ` · ${new Date(review.createdAt).toLocaleDateString('az-AZ')}` : ''}</p></div><span className="inline-flex items-center gap-1 text-sm font-bold text-amber-600">{Array.from({ length: 5 }, (_, index) => <Star key={index} className={`h-4 w-4 ${index < review.rating ? 'fill-current' : 'text-slate-200'}`} />)}</span></div><p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">{review.text}</p></article>)}</div> : <p className="text-sm text-slate-500">Hələ rəy yazılmayıb.</p>}
              </section>

              {/* Portfolio Section */}
              <div className="glass-panel rounded-3xl p-8 shadow-[0_15px_40px_-15px_rgba(0,0,0,0.05)] border border-slate-200/60">
                <div className="flex justify-between items-center border-b border-slate-200/80 pb-4 mb-6">
                  <h2 className="text-2xl font-bold text-slate-900">Portfolio</h2>
                  <button onClick={() => navigate('/layiheler')} className="text-blue-600 font-bold hover:text-blue-700 hover:bg-blue-50 px-4 py-2 rounded-xl transition-colors">
                    Hamısına bax
                  </button>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
                  {/* Add New Portfolio Button Card */}
                  {isOwnProfile && <button
                    type="button"
                    onClick={() => setView('add-portfolio')}
                    className="aspect-square rounded-2xl border-2 border-dashed border-blue-300 bg-blue-50/50 hover:bg-blue-50 flex items-center justify-center group transition-all duration-300 hover:border-blue-400 hover:shadow-md"
                  >
                    <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-300">
                      <Plus className="w-8 h-8 text-blue-500" />
                    </div>
                  </button>}
                  {projects.map((project) => {
                    const isVideo = /\.(mp4|webm|mov|ogg)(\?|$)/i.test(project.image || '');
                    return <button key={project.id} onClick={() => navigate(`/layiheler/${project.id}`)} className="aspect-square rounded-2xl overflow-hidden bg-slate-100 group relative">
                      {isVideo ? (
                        <video src={project.image} muted playsInline autoPlay loop preload="metadata" className="w-full h-full object-contain bg-gradient-to-br from-blue-100 via-cyan-50 to-indigo-100 group-hover:scale-105 transition-transform" />
                      ) : (
                        <img src={project.image} alt={project.title} className="w-full h-full object-contain bg-gradient-to-br from-blue-100 via-cyan-50 to-indigo-100 group-hover:scale-105 transition-transform" />
                      )}
                      <span className="absolute inset-x-2 bottom-2 bg-slate-950/75 text-white rounded-lg px-2 py-1 text-xs text-left truncate">{project.title}</span>
                    </button>;
                  })}
                </div>
              </div>


            </div>

            {/* RIGHT COLUMN - SIDEBAR */}
            {}
            <div className="lg:col-span-4 space-y-8">
              
              <div className="glass-panel rounded-3xl shadow-[0_15px_40px_-15px_rgba(0,0,0,0.05)] border border-slate-200/60 overflow-hidden sticky top-28">
                
                {/* Statistics Block */}
                <div className="p-8">
                  <h3 className="font-black text-slate-900 mb-6">Statistika</h3>
                  <div className="flex justify-between items-center mb-8">
                    <span className="text-slate-500 font-medium">Baxış sayı</span>
                    <span className="font-black text-slate-900 text-lg">{displayProfile.stats?.projectViews || 0}</span>
                  </div>

                  {displayProfile.role === 'freelancer' && <><h3 className="font-black text-slate-900 mb-6">Frilanserin statistikası</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-medium">Tamamlanmış sifarişlər</span>
                      <span className="font-black text-slate-900">{displayProfile.stats?.completedOrders || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-medium">Davam edən sifarişlər</span>
                      <span className="font-black text-slate-900">{displayProfile.stats?.activeOrders || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-medium">Müştərilərin rəyi</span>
                      <div className="font-black">
                        <span className="text-emerald-500">{displayProfile.stats?.customerReviews?.pos || '+0'}</span>
                        <span className="text-slate-300 mx-1">/</span>
                        <span className="text-red-500">{displayProfile.stats?.customerReviews?.neg || '-0'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 mt-6 border-t border-slate-100 space-y-4">
                    {displayProfile.role === 'musteri' && displayProfile.companySize && <div className="flex justify-between items-center"><span className="text-slate-500 font-medium">Şirkətin ölçüsü</span><span className="font-bold text-slate-900">{displayProfile.companySize}</span></div>}
                  </div>
                  </>}

                  {displayProfile.role === 'musteri' && <div className="pt-6 mt-6 border-t border-slate-100 space-y-4">
                    {displayProfile.companyName && <div><p className="text-xs font-semibold text-slate-500">Şirkət</p><p className="mt-1 font-bold text-slate-900">{displayProfile.companyName}</p></div>}
                    {displayProfile.companyIndustry && <div><p className="text-xs font-semibold text-slate-500">Fəaliyyət sahəsi</p><p className="mt-1 font-bold text-slate-900">{displayProfile.companyIndustry}</p></div>}
                    {displayProfile.companySize && <div><p className="text-xs font-semibold text-slate-500">Şirkətin ölçüsü</p><p className="mt-1 font-bold text-slate-900">{displayProfile.companySize}</p></div>}
                    {displayProfile.companyWebsite && <a href={displayProfile.companyWebsite} target="_blank" rel="noreferrer" className="block text-sm font-bold text-blue-700 hover:underline">Şirkətin saytı</a>}
                  </div>}
                </div>

                {/* Contact Block */}
                <div className="p-8 border-t border-slate-200/60">
                  <h3 className="font-black text-slate-900 mb-3">Frilanser ilə əlaqə</h3>
                  {Object.entries(displayProfile.socialLinks || {}).filter(([key, value]) => ['github', 'instagram', 'linkedin', 'facebook'].includes(key) && value).map(([key, value]) => <a key={key} href={value} target="_blank" rel="noreferrer" className="block text-blue-600 hover:underline text-sm font-semibold">{key}</a>)}
                  {!Object.entries(displayProfile.socialLinks || {}).some(([key, value]) => ['github', 'instagram', 'linkedin', 'facebook'].includes(key) && value) && <p className="text-slate-400 font-medium text-sm">Heç bir sosial link təyin edilməyib.</p>}
                </div>

              </div>
            </div>
          </div>
        ) : (
          /* =========================================
             ADD PORTFOLIO VIEW
             ========================================= */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in slide-in-from-bottom-8 duration-500">
            
            {/* LEFT COLUMN - FORM */}
            <div className="lg:col-span-8 space-y-8">
              
              <div className="glass-panel rounded-[2.5rem] p-10 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.1)] border border-slate-200/60 relative overflow-hidden">
                
                {/* Back Button & Title */}
                <div className="flex items-center gap-6 mb-10 pb-6 border-b border-slate-200/80">
                  <button 
                    onClick={() => setView('profile')}
                    className="p-3 bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-blue-600 rounded-2xl transition-all shadow-sm"
                  >
                    <ArrowLeft className="w-6 h-6" />
                  </button>
                  <h1 className="text-3xl font-black text-slate-900">Yeni Portfolio</h1>
                </div>

                <form onSubmit={handlePortfolioSubmit} className="space-y-10">
                  
                  {/* Project Name Input */}
                  <div>
                    <label className="block text-slate-700 font-bold mb-3 text-lg">
                      Layihənin adı <span className="text-red-500">*</span>
                    </label>
                    <input 
                      type="text" 
                      placeholder="Mənim ilk qrafik işim" 
                      value={portfolio.title}
                      onChange={(event) => setPortfolio({ ...portfolio, title: event.target.value })}
                      className="w-full bg-slate-100/80 border border-slate-200 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-2xl px-6 py-4 text-lg font-medium outline-none transition-all"
                    />
                  </div>

                  {/* Project Description (Rich Text Mockup) */}
                  <div>
                    <label className="block text-slate-700 font-bold mb-3 text-lg">
                      Layihənin təsviri <span className="text-red-500">*</span>
                    </label>
                    <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10 transition-all">
                      
                      {/* Editor Toolbar */}
                      <div className="bg-slate-50 border-b border-slate-200 p-2 flex flex-wrap items-center gap-1">
                        <button className="p-2 hover:bg-slate-200 rounded-lg text-slate-600 transition-colors"><ImageIcon className="w-5 h-5" /></button>
                        <div className="w-px h-6 bg-slate-300 mx-1"></div>
                        <button className="p-2 hover:bg-slate-200 rounded-lg text-slate-600 font-serif font-bold transition-colors">B</button>
                        <button className="p-2 hover:bg-slate-200 rounded-lg text-slate-600 font-serif italic transition-colors">I</button>
                        <button className="p-2 hover:bg-slate-200 rounded-lg text-slate-600 underline transition-colors">U</button>
                        <button className="p-2 hover:bg-slate-200 rounded-lg text-slate-600 line-through transition-colors">S</button>
                        <div className="w-px h-6 bg-slate-300 mx-1"></div>
                        <button className="p-2 hover:bg-slate-200 rounded-lg text-slate-600 transition-colors"><AlignLeft className="w-5 h-5" /></button>
                        <button className="p-2 hover:bg-slate-200 rounded-lg text-slate-600 transition-colors"><List className="w-5 h-5" /></button>
                        <div className="w-px h-6 bg-slate-300 mx-1"></div>
                        <button className="p-2 hover:bg-slate-200 rounded-lg text-slate-600 transition-colors"><Maximize className="w-5 h-5" /></button>
                      </div>
                      
                      <textarea
                        value={portfolio.description}
                        onChange={(event) => setPortfolio({ ...portfolio, description: event.target.value })}
                        placeholder="Layihə haqqda məlumat daxil edin.."
                        className="w-full min-h-[200px] p-6 resize-y outline-none text-lg font-medium text-slate-700 bg-transparent"
                      ></textarea>
                    </div>
                  </div>

                  {/* Redesigned Category Selection (Professional, No Neon) */}
                  {}
                  <div>
                    <label className="block text-slate-700 font-bold mb-4 text-lg">
                      Fəaliyyət sahəsi <span className="text-red-500">*</span>
                    </label>
                    
                    {/* Clean Tabs */}
                    <div className="flex flex-wrap gap-3 mb-6 bg-slate-100 p-1.5 rounded-2xl w-fit">
                      {Object.values(PORTFOLIO_CATEGORY_GROUPS).map((cat) => (
                        <button
                          type="button"
                          key={cat.id}
                          onClick={() => setActiveCategory(cat.id)}
                          className={`px-8 py-3 rounded-xl font-bold text-sm transition-all duration-200 ${
                            activeCategory === cat.id 
                              ? 'bg-white text-blue-600 shadow-sm' 
                              : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                          }`}
                        >
                          {cat.label}
                        </button>
                      ))}
                    </div>

                    {/* Clean Checkbox List */}
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-2 max-h-[300px] overflow-y-auto">
                      <div className="flex flex-col">
                        {[...new Set([...PORTFOLIO_CATEGORY_GROUPS[activeCategory].items, ...sharedCategories])].map((item, idx) => (
                          <label key={idx} className="flex items-center gap-4 p-4 hover:bg-white rounded-xl cursor-pointer group transition-colors border border-transparent hover:border-slate-200 hover:shadow-sm">
                            <div className="relative flex items-center justify-center">
                              <input 
                                type="checkbox"
                                checked={portfolio.categories.includes(item)}
                                onChange={() => setPortfolio((current) => ({
                                  ...current,
                                  categories: current.categories.includes(item)
                                    ? current.categories.filter((category) => category !== item)
                                    : [...current.categories, item],
                                }))}
                                className="peer appearance-none w-5 h-5 border-2 border-slate-300 rounded-md checked:bg-blue-500 checked:border-blue-500 transition-all cursor-pointer"
                              />
                              <CheckCircle2 className="w-3.5 h-3.5 text-white absolute pointer-events-none opacity-0 peer-checked:opacity-100" strokeWidth={4} />
                            </div>
                            <span className="text-slate-700 font-semibold group-hover:text-slate-900 transition-colors">{item}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <input value={portfolioCategoryInput} onChange={(event) => setPortfolioCategoryInput(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); addPortfolioCategory(); } }} placeholder="Yeni portfolio kateqoriyası" className="min-w-0 flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500" />
                      <button type="button" onClick={addPortfolioCategory} className="rounded-xl bg-blue-600 px-4 text-sm font-bold text-white hover:bg-blue-700">Əlavə et</button>
                    </div>
                  </div>

                  {/* Image Upload Area */}
                  <div>
                    <label className="block text-slate-700 font-bold mb-2 text-lg">
                      Layihənin görüntüləri <span className="text-red-500">*</span>
                    </label>
                    <p className="text-slate-500 text-sm mb-4">
                      Layihənizi göstərmək üçün bir və ya daha çox şəkil və ya video yükləyin. Media öz ölçü nisbətini qoruyaraq nümayiş olunacaq.
                    </p>
                    
                    <label className="border-2 border-dashed border-slate-300 bg-slate-50 hover:bg-blue-50/50 hover:border-blue-300 transition-all rounded-3xl p-10 flex flex-col items-center justify-center cursor-pointer group">
                      <input type="file" accept="image/*,video/*" multiple onChange={handlePortfolioFile} className="sr-only" />
                      <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <UploadCloud className="w-8 h-8 text-blue-500" />
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="bg-white border border-slate-200 px-4 py-2 rounded-lg text-slate-700 font-bold shadow-sm">
                          Choose Files
                        </span>
                        <span className="text-slate-500 font-medium">{portfolio.mediaFiles.length ? `${portfolio.mediaFiles.length} media seçildi` : 'Fayl seçilməyib'}</span>
                      </div>
                    </label>
                  </div>

                  {/* Actions */}
                  <div className="pt-6 border-t border-slate-200/80 flex gap-4">
                    <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-10 rounded-2xl shadow-sm shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 transition-all hover:-translate-y-0.5">
                      Əlavə et
                    </button>
                    <button 
                      onClick={() => setView('profile')}
                      className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold py-4 px-10 rounded-2xl shadow-sm transition-all"
                    >
                      Ləğv et
                    </button>
                  </div>
                  {portfolioMessage && <p className="text-sm font-semibold text-slate-600">{portfolioMessage}</p>}

                </form>
              </div>
            </div>

            {/* RIGHT COLUMN - INFO SIDEBAR */}
            {}
            <div className="lg:col-span-4 space-y-8">
              <div className="glass-panel rounded-3xl p-10 shadow-[0_15px_40px_-15px_rgba(0,0,0,0.05)] border border-slate-200/60 sticky top-28">
                
                <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center mb-8 shadow-inner border border-white">
                  <MessageSquare className="w-10 h-10 text-slate-300" />
                </div>
                
                <h3 className="text-xl font-black text-slate-900 mb-6">«Frilans»-da Portfolio</h3>
                
                <div className="space-y-6 text-slate-600 font-medium leading-relaxed text-[15px]">
                  <p>
                    Frilans-dəki hər bir frilanser istifadəçi hər kəsə portfoliosunu göstərə bilər.
                  </p>
                  <p>
                    Portfolio, xidmətdə qəbul olunan başlıqlara bölünərək fərdi layihələrdən ibarətdir. Hər bir layihədə ən azı bir illüstrasiya olmalıdır və təsviri ola bilər.
                  </p>
                  <p>
                    Portfolio-dəki işlər hər zaman istifadəçinin profilində, eləcə də "Layihələr" bölməsində xidmət üzrə axtarış da mövcuddur.
                  </p>
                </div>
              </div>
            </div>

          </div>
        )}
      </main>
    </div>
  );
}

// Helper component for the default avatar icon
function UserIconPlaceholder() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-16 h-16 opacity-30">
      <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clipRule="evenodd" />
    </svg>
  );
}
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight, ArrowUpRight, BadgeCheck, Bot, BriefcaseBusiness,
  ChevronDown, CircleHelp, Code2, Compass,
  LoaderCircle, Megaphone, MessageSquareText, PenTool,
  Search, Send, ShieldCheck, Sparkles, Target, Users, WandSparkles, FileText,
} from 'lucide-react';
import { api, getApiHealth } from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { BackgroundPaths } from '../components/ui/background-paths.tsx';
import { SpotlightCard } from '../components/ui/spotlight-card.jsx';
import { Button } from '../components/ui/button';
import './AnaSayfa.css';

const AI_API = (import.meta.env.DEV ? (import.meta.env.VITE_AI_API_URL || '/api') : '/api').replace(/\/+$/, '');
const ASSISTANT_NAME = 'Lumi';

const assistantTools = [
  { id: 'general', label: 'AI ilə danış', icon: Bot },
  { id: 'search', label: 'Freelancer / layihə tap', icon: Search },
  { id: 'portfolio', label: 'Portfolio yarat / redaktə et', icon: WandSparkles },
  { id: 'proposal', label: 'Müraciət mətni yaz', icon: FileText },
  { id: 'brief', label: 'Briefi analiz et', icon: Target },
];

const starterPrompts = [
  { text: 'Restoran üçün mobil uyğun vebsayt hazırlayan freelancer tap', mode: 'search', icon: Code2 },
  { text: 'Portfolio layihəmin təsvirini peşəkarlaşdır: kiçik biznes üçün logo dizayn etmişəm', mode: 'portfolio', icon: PenTool },
  { text: 'React developer işi üçün müraciət məktubu hazırla', mode: 'proposal', icon: FileText },
];

const categories = [
  { title: 'Proqramlaşdırma', detail: 'Veb, mobil tətbiq, frontend və backend', icon: Code2, query: 'Proqramlaşdırma və veb developer', tone: 'code', tags: ['React · API', 'Veb · Mobil'] },
  { title: 'Dizayn və kreativ', detail: 'UI/UX, loqo, brend və illüstrasiya', icon: PenTool, query: 'Dizayn və kreativ mütəxəssis', tone: 'design', tags: ['UI · UX', 'Brend sistemi'] },
  { title: 'Marketinq', detail: 'SMM, SEO, reklam və kontent', icon: Megaphone, query: 'Marketinq SMM və SEO mütəxəssisi', tone: 'marketing', tags: ['SEO · SMM', 'Kontent'] },
  { title: 'Biznes dəstəyi', detail: 'Tərcümə, maliyyə, araşdırma və məsləhət', icon: BriefcaseBusiness, query: 'Biznes dəstəyi tərcümə və maliyyə', tone: 'business', tags: ['Araşdırma', 'Məsləhət'] },
];

const steps = [
  { title: 'Ehtiyacını izah et', text: 'Bacarıq, layihə və büdcəni adi dildə yaz; Lumi məqsədini anlamağa çalışsın.', icon: MessageSquareText },
  { title: 'AI nəticəsini yoxla', text: 'Lumi mövcud profil və elanlardan uyğun seçimləri səbəbləri ilə təklif edir.', icon: Target },
  { title: 'Platformada davam et', text: 'Profilə və ya layihəyə keç, detalları yoxla və əlaqəni Ailancer-də qur.', icon: BadgeCheck },
];

function ResultCard({ result, onClick }) {
  const isTask = result.type === 'task';
  const person = result.data;
  const subtitle = isTask
    ? `${person.ownerName || 'İşəgötürən'} · ${person.price ? `${person.price} ${person.currency || 'AZN'}` : 'Razılaşma yolu ilə'}`
    : result.type === 'employer'
      ? `İşəgötürən · ${person.title || 'Elan'} üzrə axtarışda uyğunluq`
      : person.status || person.activityAreas?.slice?.(0, 2).join(' · ') || 'Freelancer profili';
  return (
    <button type="button" onClick={onClick} className="group flex w-full items-start gap-4 border-b border-slate-100 py-5 text-left transition hover:bg-blue-50/60 last:border-0">
      {isTask ? <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700"><BriefcaseBusiness size={20} /></span>
        : person.avatarUrl ? <img className="h-12 w-12 shrink-0 rounded-full object-cover ring-2 ring-blue-100" src={person.avatarUrl} alt="" />
          : <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700"><Users size={20} /></span>}
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2"><span className="font-bold text-slate-900">{isTask ? person.title : person.fullName}</span><span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-blue-800">{result.score}% uyğun</span></span>
        <span className="mt-1 block text-sm text-slate-500">{subtitle}</span>
        {(isTask ? person.description : person.about) && <span className="mt-2 line-clamp-2 block max-w-2xl text-sm leading-6 text-slate-600">{isTask ? person.description : person.about}</span>}
        {result.reason && <span className="mt-2 block text-sm leading-5 text-blue-800">{result.reason}</span>}
      </span>
      <ArrowUpRight className="mt-1 shrink-0 text-slate-300 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-blue-600" size={19} />
    </button>
  );
}

function CategoryCard({ item, onChoose }) {
  const Icon = item.icon;
  return (
    <SpotlightCard as="button" type="button" onClick={() => onChoose(item.query)} className="ai-depth-card group overflow-hidden border border-slate-200 bg-white text-left shadow-[0_18px_45px_-36px_rgba(15,23,42,.65)] transition duration-500 hover:border-blue-300 hover:shadow-[0_28px_60px_-35px_rgba(37,99,235,.5)]">
      <span className={`ai-category-art ai-category-art-${item.tone} relative block aspect-[1.55] overflow-hidden`}>
        <span className="ai-category-art-grid" />
        <span className="ai-category-art-orbit ai-category-art-orbit-one" />
        <span className="ai-category-art-orbit ai-category-art-orbit-two" />
        <span className="ai-category-art-icon"><Icon size={25} /></span>
        <span className="ai-category-art-tag ai-category-art-tag-one">{item.tags[0]}</span>
        <span className="ai-category-art-tag ai-category-art-tag-two">{item.tags[1]}</span>
        <span className="ai-category-arrow absolute bottom-4 right-4 grid h-11 w-11 place-items-center rounded-full bg-white text-blue-700 shadow-lg transition group-hover:rotate-45"><ArrowUpRight size={20} /></span>
      </span>
      <span className="flex min-h-[126px] items-center justify-between gap-4 px-5 py-5 sm:px-6">
        <span><span className="flex items-center gap-2 text-lg font-extrabold text-slate-900 sm:text-xl"><Icon size={20} className="text-blue-700" />{item.title}</span><span className="mt-2 block text-sm leading-6 text-slate-600">{item.detail}</span></span>
      </span>
    </SpotlightCard>
  );
}

export default function AnaSayfa() {
  const navigate = useNavigate();
  const { user, profileData } = useAuth();
  const composerRef = useRef(null);
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState('search');
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [aiStatus, setAiStatus] = useState(() => (AI_API ? null : {
    error: 'Lumi xidməti hələ qoşulmayıb. Sayt konfiqurasiyasını yoxlayın.',
  }));

  useEffect(() => {
    if (!AI_API) return undefined;
    let active = true;
    fetch(`${AI_API}/ai/status`)
      .then(async (response) => {
        const status = await response.json().catch(() => null);
        if (!response.ok) throw new Error(status?.error || `Server xətası (${response.status})`);
        return status;
      })
      .then((status) => {
        if (active) setAiStatus(status);
      })
      .catch(() => {
        if (active) setAiStatus({ error: 'Lumi xidmətinə qoşulmaq olmadı. Backend konfiqurasiyasını yoxlayın.' });
      });
    return () => { active = false; };
  }, []);

  async function runSearch(event) {
    event?.preventDefault();
    if (!query.trim() || isLoading) return;
    if (!AI_API) {
      setError('Lumi xidməti qoşulmayıb. Saytın AI ünvanı konfiqurasiyasını yoxlayın.');
      return;
    }
    const prompt = query.trim();
    const nextMessages = [...messages, { role: 'user', content: prompt }].slice(-8);
    setMessages((current) => [...current, { role: 'user', content: prompt }]);
    setQuery('');
    setIsLoading(true);
    setError('');
    requestAnimationFrame(() => document.getElementById('ai-chat')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    try {
      if (mode === 'brief') {
        if (!AI_API) throw new Error('Lumi xidməti qoşulmayıb.');
        const response = await fetch(`${AI_API}/ai/analyze-brief`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ brief: prompt }),
        });
        const data = await response.json().catch(() => null);
        if (!response.ok) throw new Error(data?.error || `Server xətası (${response.status})`);
        setMessages((current) => [...current, { role: 'assistant', content: data.result.summary, analysis: data.result }]);
        return;
      }

      let candidates = [];
      const candidateLookup = new Map();
      if (mode === 'search' || mode === 'proposal') {
        const [freelancersResponse, tasksResponse] = await Promise.allSettled([api.getFreelancers(), api.getTasks()]);
        if (freelancersResponse.status === 'rejected' && tasksResponse.status === 'rejected') {
          const health = await getApiHealth().catch(() => null);
          if (health?.database?.ready === false) {
            throw new Error('Marketplace backend serveri cavab verir, amma verilənlər bazası hazır deyil. Host-da DATABASE_URL-ni və database bağlantısını yoxlayın.');
          }
          throw new Error('Freelancer və layihə məlumatları yüklənmədi. Marketplace backend bağlantısını yoxlayın.');
        }
        const freelancers = freelancersResponse.status === 'fulfilled' && Array.isArray(freelancersResponse.value) ? freelancersResponse.value : [];
        const tasks = tasksResponse.status === 'fulfilled' && Array.isArray(tasksResponse.value) ? tasksResponse.value : [];
        candidates = [
          ...freelancers.slice(0, 20).map((data) => {
            const item = { id: String(data.id), type: 'freelancer', name: data.fullName, summary: `${data.about || ''} ${data.status || ''}`, skills: data.activityAreas || [], category: data.experience || '' };
            candidateLookup.set(`freelancer:${item.id}`, data);
            return item;
          }),
          ...tasks.slice(0, 20).map((data) => {
            const item = { id: String(data.id), type: 'task', title: data.title, name: data.ownerName, summary: data.description, skills: data.categories || [], price: data.price ? `${data.price} ${data.currency || 'AZN'}` : '' };
            candidateLookup.set(`task:${item.id}`, data);
            return item;
          }),
        ];
      }
      const response = await fetch(`${AI_API}/ai/assistant`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode,
          messages: nextMessages,
          candidates,
          profile: user ? {
            name: profileData.fullName || user.fullName,
            about: profileData.about,
            skills: profileData.activityAreas,
            experience: profileData.experience,
          } : null,
        }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.error || `Server xətası (${response.status})`);
      const results = (data.results || []).flatMap((item) => {
        const original = candidateLookup.get(`${item.type}:${item.id}`);
        return original ? [{ type: item.type, data: original, score: item.matchPercent, reason: item.reason }] : [];
      });
      setMessages((current) => [...current, {
        role: 'assistant',
        content: data.reply,
        action: data.action,
        results,
        portfolio: data.portfolio,
        proposal: data.proposal,
      }]);
    } catch (searchError) {
      setError(searchError.message || 'Axtarış zamanı xəta baş verdi.');
    } finally {
      setIsLoading(false);
    }
  }

  function openResult(result) {
    if (result.type === 'task') navigate('/tapsiriqlar', { state: { taskId: result.data.id } });
    else navigate(`/profil?userId=${result.data.id}`);
  }

  function choosePrompt(text, nextMode = mode) {
    setQuery(text);
    setMode(nextMode);
    setError('');
    requestAnimationFrame(() => composerRef.current?.focus());
  }

  function openPortfolioDraft(draft) {
    if (!user) {
      navigate('/giris');
      return;
    }
    navigate(`/profil?aiDraft=${encodeURIComponent(JSON.stringify(draft))}`);
  }

  async function copyText(text) {
    try {
      if (!navigator.clipboard?.writeText) throw new Error('clipboard unavailable');
      await navigator.clipboard.writeText(text);
      setError('');
    } catch {
      setError('Mətn panoya köçürülmədi. Mətni seçib əl ilə köçürün.');
    }
  }

  return (
    <main className="ai-home overflow-hidden bg-white text-slate-900">
      <section className="ai-hero relative isolate px-5 pb-10 pt-20 sm:px-8 sm:pb-14 sm:pt-24 lg:pb-20 lg:pt-16">
        <BackgroundPaths />
        <div className="ai-hero-grid" aria-hidden="true" />
        <div className="ai-hero-glow ai-hero-glow-one" aria-hidden="true" />
        <div className="ai-hero-glow ai-hero-glow-two" aria-hidden="true" />
        <div className="relative mx-auto max-w-7xl">
          <header className="ai-hero-layout">
            <div className="ai-hero-copy">
              <span className="ai-hero-kicker"><span className="ai-live-dot" /> Ailancer · Lumi ilə</span>
              <h1>İşini izah et.<br /><span>Düzgün addımı tap.</span></h1>
              <p>Freelancer axtar, portfolio mətni hazırla və layihə briefini təkmilləşdir — hamısı bir ağıllı məkanda.</p>
              <div className="ai-hero-actions">
                <Button type="button" className="ai-hero-primary" onClick={() => { document.getElementById('ai-chat')?.scrollIntoView({ behavior: 'smooth', block: 'center' }); composerRef.current?.focus({ preventScroll: true }); }}>
                  <Sparkles size={17} /> AI ilə başla <ArrowRight size={16} />
                </Button>
                <Button type="button" variant="outline" className="ai-hero-secondary" onClick={() => navigate('/tapsiriqlar')}>
                  Layihələrə bax <ArrowUpRight size={16} />
                </Button>
              </div>
              <div className="ai-hero-proof"><span className="ai-proof-avatars" aria-hidden="true"><i>F</i><i>UI</i><i>AZ</i></span><span><strong>İnsan + AI</strong><small> qərar yenə də səndədir</small></span><span className="ai-proof-divider" /><span className="ai-proof-secure"><ShieldCheck size={15} /> Yoxlanıla bilən nəticələr</span></div>
            </div>

            <div className="ai-hero-visual" aria-label={`${ASSISTANT_NAME} köməkçisinin nümunə iş axını`}>
              <SpotlightCard className="ai-copilot-panel">
                <div className="ai-copilot-heading">
                  <span className="ai-copilot-mark"><WandSparkles size={19} /></span>
                  <span><strong>Lumi ilə iş axını</strong><small>Ailancer AI köməkçisi</small></span>
                  <span className="ai-copilot-status"><span className="ai-live-dot" /> Hazırdır</span>
                </div>
                <div className="ai-copilot-body">
                  <span className="ai-copilot-overline">NÜMUNƏ SORĞU</span>
                  <div className="ai-copilot-prompt">“Onlayn mağazam üçün uyğun veb developer tapmağa kömək et.”</div>
                  <div className="ai-copilot-response">
                    <span className="ai-copilot-response-mark"><Sparkles size={14} /></span>
                    <span><strong>Əvvəlcə ehtiyacı aydınlaşdıraq</strong><small>Bacarıqları, büdcəni və layihə müddətini bir sorğuda dəqiqləşdir.</small></span>
                  </div>
                  <div className="ai-copilot-chips"><span><Code2 size={13} /> Bacarıq uyğunluğu</span><span><ShieldCheck size={13} /> Nəzarət səndədir</span></div>
                </div>
                <div className="ai-copilot-footer"><span><span className="ai-live-dot" /> Nəticələr mövcud profillərdən</span><ArrowUpRight size={16} /></div>
              </SpotlightCard>
              <span className="ai-visual-orbit ai-visual-orbit-outer" />
              <span className="ai-visual-orbit ai-visual-orbit-inner" />
            </div>
          </header>

          <div className="ai-hero-metrics" aria-label="Platformanın üstünlükləri">
            <div><span className="ai-metric-icon"><Search size={16} /></span><span><strong>Tap</strong><small> uyğun freelancer və layihə</small></span></div>
            <div><span className="ai-metric-icon"><WandSparkles size={16} /></span><span><strong>Yarat</strong><small> portfolio və müraciət mətni</small></span></div>
            <div><span className="ai-metric-icon"><Target size={16} /></span><span><strong>Dəqiqləşdir</strong><small> brief və növbəti addımlar</small></span></div>
          </div>

        </div>
      </section>

      <div className="ai-capabilities-marquee" aria-label="Ailancer platform capabilities">
        <div className="ai-capabilities-track" aria-hidden="true">
          {[0, 1].map((copy) => (
            <span className="ai-capabilities-set" key={copy}>
              {['AI ilə freelancer axtar', 'Portfolio yarat', 'Layihəni paylaş', 'Birbaşa əlaqə qur', 'Briefini dəqiqləşdir'].map((label) => (
                <span className="ai-capability-word" key={`${copy}-${label}`}><Sparkles size={13} />{label}</span>
              ))}
            </span>
          ))}
        </div>
      </div>

      <section className="ai-chat-section relative isolate overflow-hidden px-5 py-14 sm:px-8 sm:py-20">
        <div className="ai-chat-section-glow" aria-hidden="true" />
        <div className="relative z-10 mx-auto max-w-6xl">
          <div className="ai-chat-intro mx-auto mb-8 max-w-3xl text-center">
            <span className="ai-category-eyebrow"><Sparkles size={14} /> Lumi AI köməkçisi</span>
            <h2 className="mt-4 text-3xl font-extrabold leading-tight text-slate-950 sm:text-4xl lg:text-5xl">Fikrinizi yazın. <span className="text-blue-700">Növbəti addımı birlikdə tapaq.</span></h2>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-600">Freelancer tapmaqdan brief hazırlamağa qədər — Lumi ilə söhbət edərək başlayın.</p>
          </div>

          <SpotlightCard as="div" id="ai-chat" className="ai-enter ai-delay-1 ai-chat-shell ai-chat-spotlight relative z-10 mx-auto max-w-4xl rounded-2xl border border-blue-100 bg-white/90">
            <div className="relative z-10 flex items-center justify-between gap-3 border-b border-slate-200 bg-white/90 px-4 py-3 sm:px-6 sm:py-4">
              <div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-700 text-white"><WandSparkles size={20} /></span><span><span className="block text-sm font-extrabold text-slate-900">{ASSISTANT_NAME} · Ailancer</span><span className="block text-xs text-slate-500">Axtar, yarat, təkmilləşdir</span></span></div>
              <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ${aiStatus?.assistantReady ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}><Sparkles size={14} />{aiStatus?.assistantReady ? `${ASSISTANT_NAME} hazırdır` : aiStatus?.error || `${ASSISTANT_NAME} bağlantısı yoxlanılır`}</span>
            </div>

            <div className="ai-chat-messages relative z-10 max-h-[620px] space-y-5 overflow-y-auto bg-slate-50/70 px-4 py-5 sm:px-6">
              {!messages.length && <div className="flex items-start gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-700"><Bot size={19} /></span><div><p className="text-sm font-bold text-slate-800">Lumi — sənin iş yoldaşın</p><p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600 sm:text-[15px]">Freelancer və layihələri təbii dildə axtar, portfolio mətnini yarat və ya redaktə et, müraciət hazırla, briefini analiz et.</p></div></div>}
              {!messages.length && <div className="flex flex-wrap gap-2 pl-12">
                {starterPrompts.map(({ text, mode: nextMode, icon: Icon }) => <button key={text} type="button" onClick={() => choosePrompt(text, nextMode)} className="group inline-flex min-h-9 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-left text-xs font-semibold text-slate-600 transition hover:-translate-y-0.5 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-800 sm:text-[13px]"><Icon size={14} className="shrink-0 text-blue-600" />{text}<ArrowUpRight size={13} className="ml-1 text-slate-400" /></button>)}
              </div>}
              {messages.map((message, index) => (
                <article key={`${message.role}-${index}`} className={message.role === 'user' ? 'ml-auto max-w-[88%] rounded-2xl rounded-br-sm bg-blue-700 px-4 py-3 text-sm leading-6 text-white' : 'max-w-full'}>
                  {message.role === 'user' ? message.content : <>
                    <div className="flex items-start gap-3"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-700"><Bot size={17} /></span><p className="pt-1 text-sm leading-6 text-slate-700">{message.content}</p></div>
                    {message.results?.length > 0 && <div className="mt-3 rounded-xl border border-slate-200 bg-white px-4">{message.results.map((result, resultIndex) => <ResultCard key={`${result.type}-${result.data.id}-${resultIndex}`} result={result} onClick={() => openResult(result)} />)}</div>}
                    {message.portfolio && <div className="ml-11 mt-3 space-y-3 rounded-xl border border-blue-200 bg-white p-4">
                      <label className="block text-xs font-bold text-slate-600">Portfolio başlığı<input value={message.portfolio.title || ''} onChange={(event) => setMessages((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, portfolio: { ...item.portfolio, title: event.target.value } } : item))} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-800" /></label>
                      <label className="block text-xs font-bold text-slate-600">Kateqoriya<input value={message.portfolio.category || ''} onChange={(event) => setMessages((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, portfolio: { ...item.portfolio, category: event.target.value } } : item))} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-800" /></label>
                      <label className="block text-xs font-bold text-slate-600">Layihənin təsviri<textarea value={message.portfolio.description || ''} onChange={(event) => setMessages((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, portfolio: { ...item.portfolio, description: event.target.value } } : item))} rows={5} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium leading-6 text-slate-800" /></label>
                      <button type="button" onClick={() => openPortfolioDraft(message.portfolio)} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-blue-700 px-4 text-sm font-bold text-white hover:bg-blue-800">Portfolio formasına köçür <ArrowRight size={15} /></button>
                      {!user && <p className="text-xs text-slate-500">Dərc etmək üçün hesabınıza daxil olun.</p>}
                    </div>}
                    {message.proposal && <div className="ml-11 mt-3 rounded-xl border border-slate-200 bg-white p-4"><p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">{message.proposal}</p><button type="button" onClick={() => copyText(message.proposal)} className="mt-3 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50">Mətni köçür</button></div>}
                    {message.analysis && <div className="ml-11 mt-3 grid gap-3 sm:grid-cols-2"><div className="rounded-xl border border-slate-200 bg-white p-4"><h3 className="text-sm font-bold">Brief xülasəsi</h3><p className="mt-2 text-sm leading-6 text-slate-600">{message.analysis.summary}</p><p className="mt-2 text-xs text-slate-500">Kateqoriya: {message.analysis.category}</p></div><div className="rounded-xl border border-slate-200 bg-white p-4"><h3 className="text-sm font-bold">Təxmini qiymət</h3><p className="mt-2 text-lg font-extrabold text-blue-800">{message.analysis.price_azn?.min}–{message.analysis.price_azn?.max} AZN</p><p className="text-xs text-slate-500">Qiymət yalnız ilkin təxmindir.</p></div></div>}
                  </>}
                </article>
              ))}
              {isLoading && <div className="flex items-center gap-3 text-sm text-slate-500" role="status"><LoaderCircle className="animate-spin text-blue-600" size={20} />Lumi sorğunu işləyir...</div>}
              {error && <p className="ml-11 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">{error}</p>}
            </div>

            <form onSubmit={runSearch} className="relative z-10 border-t border-slate-200 bg-white/90 p-3 sm:p-4">
              <div className="mb-3 flex flex-wrap gap-2" aria-label="AI aləti">{assistantTools.map(({ id, label, icon: Icon }) => <button key={id} type="button" onClick={() => setMode(id)} aria-pressed={mode === id} className={`inline-flex min-h-9 items-center gap-2 rounded-lg px-3 text-xs font-bold transition ${mode === id ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-blue-800'}`}><Icon size={14} />{label}</button>)}</div>
              <label htmlFor="ai-search" className="mb-2 block px-1 text-xs font-bold text-slate-700">Lumi-yə yaz</label>
              <div className="flex items-end gap-2">
                <textarea ref={composerRef} id="ai-search" rows={2} value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); runSearch(event); } }} placeholder="Məsələn: büdcəm 500 AZN-dir, mağazam üçün uyğun freelancer tap..." className="min-h-[58px] w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm leading-6 text-slate-800 outline-none placeholder:text-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 sm:text-[15px]" />
                <button type="submit" disabled={!query.trim() || isLoading} aria-label="Lumi-yə göndər" className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 text-sm font-extrabold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-45">{isLoading ? <LoaderCircle size={18} className="animate-spin" /> : <Send size={16} />}<span className="hidden sm:inline">Göndər</span></button>
              </div>
            </form>
          </SpotlightCard>
        </div>
      </section>

      <section className="ai-category-section px-5 py-16 sm:px-8 sm:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mb-9 flex flex-col gap-7 lg:mb-11 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <span className="ai-category-eyebrow"><Sparkles size={14} /> Ailancer-də imkanlar</span>
              <h2 className="mt-4 text-3xl font-extrabold leading-tight text-slate-950 sm:text-4xl lg:text-5xl">Bacarıq axtar, <span className="text-blue-700">işini irəli apar.</span></h2>
              <p className="mt-4 max-w-xl text-base leading-7 text-slate-600">Layihənə uyğun sahəni seç. Lumi ehtiyacını dəqiqləşdirib uyğun profilləri və açıq elanları tapmağa kömək edəcək.</p>
            </div>
            <button type="button" className="ai-category-assist group" onClick={() => choosePrompt('Layihəm üçün uyğun sahəni və freelancerləri tap', 'search')}>
              <span className="ai-category-buddy" aria-hidden="true"><Bot size={29} /></span>
              <span className="grid gap-1 text-left"><strong>Lumi-dən kömək al</strong><small>Uyğun sahəni tapmağa başla</small></span>
              <ArrowRight className="ml-auto transition-transform group-hover:translate-x-1" size={19} />
            </button>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">{categories.map((item) => <CategoryCard key={item.title} item={item} onChoose={(text) => choosePrompt(text, 'search')} />)}</div>
        </div>
      </section>

      <section className="relative overflow-hidden border-y border-slate-200 bg-[#f7faff] px-5 py-16 sm:px-8 sm:py-20">
        <div className="pointer-events-none absolute right-0 top-0 h-full w-1/3 border-l border-blue-100/70 bg-[linear-gradient(135deg,transparent_0%,rgba(219,234,254,.5)_100%)]" />
        <div className="relative mx-auto max-w-7xl">
          <div className="max-w-3xl"><h2 className="text-3xl font-extrabold leading-tight sm:text-4xl">Axtarışdan əlaqəyə, sadə axın.</h2><p className="mt-3 text-base leading-7 text-slate-600">Ehtiyacını izah et, açıq platforma məlumatlarından gələn nəticələri nəzərdən keçir və özün qərar ver.</p></div>
          <div className="mt-10 grid gap-8 border-y border-slate-200 py-8 md:grid-cols-3 md:gap-10">
            {steps.map((step) => <article key={step.title} className="flex gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700"><step.icon size={21} /></span>
              <div><h3 className="text-lg font-extrabold">{step.title}</h3><p className="mt-2 max-w-sm text-sm leading-6 text-slate-600">{step.text}</p></div>
            </article>)}
          </div>
        </div>
      </section>

      <section className="bg-white px-5 py-16 sm:px-8 sm:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl"><h2 className="text-3xl font-extrabold sm:text-4xl">İşə götür, ya iş tap. Eyni platformada.</h2><p className="mt-3 text-sm leading-6 text-slate-600">Ailancer profilləri, tapşırıqları və mesajları birləşdirir. Uyğun nəticəni seç, əlaqəni platformada davam etdir.</p></div>
          <div className="mt-10 grid gap-5 lg:grid-cols-2">
            <article className="group relative overflow-hidden border border-blue-200 bg-[linear-gradient(135deg,#eff6ff_0%,#fff_62%,#e0f2fe_100%)] p-7 sm:p-9">
              <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rotate-12 border border-blue-200/70 bg-white/30 transition-transform duration-700 group-hover:rotate-6 group-hover:scale-110" />
              <div className="relative"><span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1.5 text-xs font-bold text-blue-800"><BriefcaseBusiness size={14} /> Sifarişçi üçün</span><h3 className="mt-5 max-w-md text-2xl font-extrabold sm:text-3xl">Komandanı böyüt,<br />layihəni irəli apar.</h3><p className="mt-3 max-w-lg text-sm leading-6 text-slate-600">Ehtiyacına uyğun freelancer axtar, tapşırıq elanlarına bax, maraqlandığın profillə birbaşa əlaqə qur.</p><div className="mt-6 flex flex-wrap gap-2"><span className="rounded-lg border border-blue-100 bg-white/80 px-3 py-2 text-xs font-semibold text-slate-600">Uyğun bacarıqları tap</span><span className="rounded-lg border border-blue-100 bg-white/80 px-3 py-2 text-xs font-semibold text-slate-600">Profilləri araşdır</span><span className="rounded-lg border border-blue-100 bg-white/80 px-3 py-2 text-xs font-semibold text-slate-600">Birbaşa danış</span></div><button type="button" onClick={() => { choosePrompt('Layihəm üçün uyğun freelancer tap', 'search'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="mt-7 inline-flex min-h-11 items-center gap-2 rounded-xl bg-blue-700 px-5 text-sm font-bold text-white transition hover:bg-blue-800">Freelancer tap <ArrowRight size={16} /></button></div>
            </article>
            <article className="group relative overflow-hidden border border-blue-200 bg-[linear-gradient(135deg,#eff6ff_0%,#fff_58%,#dbeafe_100%)] p-7 sm:p-9">
              <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rotate-12 border border-blue-200/70 bg-white/30 transition-transform duration-700 group-hover:rotate-6 group-hover:scale-110" />
              <div className="relative"><span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1.5 text-xs font-bold text-blue-800"><Compass size={14} /> Freelancer üçün</span><h3 className="mt-5 max-w-md text-2xl font-extrabold sm:text-3xl">Bacarıqlarını göstər,<br />növbəti işini tap.</h3><p className="mt-3 max-w-lg text-sm leading-6 text-slate-600">Özünə uyğun elanları tap, təcrübəni təqdim et, müştərilərlə təklif və mesajlar üzərindən ünsiyyət qur.</p><div className="mt-6 flex flex-wrap gap-2"><span className="rounded-lg border border-blue-100 bg-white/80 px-3 py-2 text-xs font-semibold text-slate-600">Layihələri axtar</span><span className="rounded-lg border border-blue-100 bg-white/80 px-3 py-2 text-xs font-semibold text-slate-600">Təklif göndər</span><span className="rounded-lg border border-blue-100 bg-white/80 px-3 py-2 text-xs font-semibold text-slate-600">Portfelini paylaş</span></div><button type="button" onClick={() => { choosePrompt('Mənim bacarıqlarıma uyğun açıq layihə axtar', 'search'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="mt-7 inline-flex min-h-11 items-center gap-2 rounded-xl border border-blue-200 bg-white px-5 text-sm font-bold text-blue-800 transition hover:border-blue-400 hover:bg-blue-50">Layihə axtar <ArrowRight size={16} /></button></div>
            </article>
          </div>
        </div>
      </section>

      <section className="border-y border-blue-100 bg-[#f4f8ff] px-5 py-16 sm:px-8 sm:py-20">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[.8fr_1.2fr]">
          <div><h2 className="text-3xl font-extrabold sm:text-4xl">AI kömək edir. Seçim sənindir.</h2><p className="mt-4 max-w-md text-sm leading-7 text-slate-700">Uyğunluq göstəricisi nəticələri araşdırmaq üçündür. Razılaşmadan əvvəl profil, təcrübə, büdcə və iş şərtlərini özün yoxla.</p><button type="button" onClick={() => navigate('/nece-isleyir')} className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-blue-700 hover:text-blue-900">Platforma qaydaları <ArrowRight size={16} /></button></div>
          <div className="grid gap-x-8 gap-y-7 sm:grid-cols-2">
            {[
              { title: 'Açıq platforma məlumatı', text: 'Uyğunlaşdırma görünən freelancer profilləri və elandakı məlumatlardan istifadə edir.', icon: Search, color: 'text-blue-700 bg-blue-100' },
              { title: 'Uyğunluğun səbəbi', text: 'Nəticədə sorğu ilə üst-üstə düşən sözlər göstərilir; bal tövsiyə xarakterlidir.', icon: Target, color: 'text-blue-700 bg-blue-100' },
              { title: 'Özün araşdır', text: 'Profil məlumatlarını və layihə şərtlərini yoxla, qərarı məlumatlı ver.', icon: ShieldCheck, color: 'text-blue-700 bg-blue-100' },
              { title: 'Söhbəti davam etdir', text: 'Mövcud platforma mesajları və layihə axını ilə əlaqəni davam etdir.', icon: MessageSquareText, color: 'text-blue-700 bg-blue-100' },
            ].map((item) => <article key={item.title} className="flex gap-4 border-t border-blue-200/80 pt-5"><span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${item.color}`}><item.icon size={19} /></span><span><h3 className="font-extrabold">{item.title}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{item.text}</p></span></article>)}
          </div>
        </div>
      </section>

      <section className="bg-white px-5 py-16 sm:px-8 sm:py-20">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[.8fr_1.2fr]">
          <div><h2 className="text-3xl font-extrabold sm:text-4xl">Başlamazdan əvvəl</h2><p className="mt-3 max-w-sm text-sm leading-6 text-slate-600">Axtarış və Ailancer-dəki növbəti addımlar barədə.</p><div className="mt-6 flex items-center gap-2 text-sm font-semibold text-slate-600"><CircleHelp size={18} className="text-blue-700" /> Başqa sualın var? <button type="button" onClick={() => navigate('/faq')} className="text-blue-700 hover:underline">FAQ bölməsinə keç</button></div></div>
          <div className="divide-y divide-slate-200 border-y border-slate-200">
            {[
              { q: 'AI ilə necə axtarış edə bilərəm?', a: 'Lumi alətindən freelancer və layihə axtarışını seç, ehtiyacını təbii dildə izah et. AI yalnız platformanın təqdim etdiyi açıq profil və elanları sıralayır.' },
              { q: 'Uyğunluq balı nə deməkdir?', a: 'Bu, AI-nin təqdim etdiyin ehtiyacla platformadakı açıq profil və elanlar arasında hesabladığı təxmini uyğunluqdur. Keyfiyyət, etibarlılıq və nəticəyə zəmanət vermir.' },
              { q: 'Portfolio mətnini AI ilə dəyişə bilərəm?', a: 'Portfolio yarat/redaktə et alətində mövcud mətnini göndər, Lumi yenilənmiş başlıq və təsvir qaralaması hazırlasın. Qaralamanı yoxlayıb portfel formasına köçürə bilərsən; media əlavə etmək və dərc etmək sənin təsdiqindən sonra baş verir.' },
              { q: 'Axtardığım şəxs çıxmasa nə edim?', a: 'Bacarıq və layihəni daha dəqiq izah et. Lumi yalnız hazırda yüklənən açıq freelancer profilləri və elanları araşdıra bilər; məlumat yoxdursa nəticə uydurmur.' },
              { q: 'Freelancer və sifarişçi necə əlaqə qurur?', a: 'Uyğun profil və ya elan seçildikdən sonra Ailancer-dəki profil, tapşırıq və mesajlaşma səhifələrindən əlaqəni davam etdirə bilərsən.' },
            ].map((item) => <details key={item.q} className="group py-5"><summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left font-bold text-slate-800"><span>{item.q}</span><ChevronDown size={18} className="shrink-0 text-slate-400 transition group-open:rotate-180 group-open:text-blue-700" /></summary><p className="max-w-3xl pt-3 pr-8 text-sm leading-7 text-slate-600">{item.a}</p></details>)}
          </div>
        </div>
      </section>

      <section className="bg-[#f1f6ff] px-5 py-12 sm:px-8 sm:py-16">
        <div className="relative mx-auto max-w-7xl overflow-hidden rounded-2xl border border-blue-200 bg-white px-6 py-10 shadow-[0_20px_55px_-42px_rgba(37,99,235,.45)] sm:px-10 sm:py-14 lg:px-16">
          <div className="pointer-events-none absolute -right-12 -top-24 h-80 w-80 rotate-12 border border-blue-100 bg-blue-50/70" />
          <div className="relative flex flex-col justify-between gap-8 md:flex-row md:items-center"><div><h2 className="max-w-2xl text-3xl font-extrabold text-slate-950 sm:text-4xl">Növbəti iş birliyinə başla.</h2><p className="mt-3 max-w-xl text-sm leading-6 text-slate-600">Ailancer-də hesab yarat, profilini tamamla və platformadan istifadə et.</p></div><button type="button" onClick={() => navigate('/giris?mode=register')} className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-700 px-6 text-sm font-extrabold text-white transition hover:-translate-y-0.5 hover:bg-blue-800">Qeydiyyatdan keç <ArrowUpRight size={17} /></button></div>
        </div>
      </section>
    </main>
  );
}
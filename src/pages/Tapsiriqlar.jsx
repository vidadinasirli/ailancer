import { ALL_CATEGORY_OPTIONS } from '../lib/categoryOptions.js';
import React, { useState, useEffect, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { TiltCard } from '../components/Effects.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../lib/api.js';
import CommentActions from '../components/CommentActions.jsx';
import UserProfileLink from '../components/UserProfileLink.jsx';
import { 
  Search, 
  MessageCircle, 
  Heart,
  Reply,
  Eye, 
  Clock, 
  Share2, 
  Flag,
  ArrowLeft,
  Send,
  User,
  CheckCircle2,
  ChevronRight,
  MapPin,
  Briefcase,
  Star,
  Award,
  ShieldCheck,
  Globe,
  Github,
  Twitter,
  Mail,
  SlidersHorizontal,
  ChevronDown,
  Check,
  Camera,
  Layout,
  Code,
  PenTool,
  Smartphone,
  Server,
  Image as ImageIcon,
  Plus,
  X,
  Loader2
} from 'lucide-react';

const isNegotiationRate = (rateType = '') => rateType.toLocaleLowerCase('az-AZ').includes('razılaşma');

function formatPostedAt(iso, now = Date.now()) {
  if (!iso) return 'Tarix göstərilməyib';
  const rawValue = String(iso).trim();
  const date = new Date(/(?:Z|[+-]\d{2}:?\d{2})$/i.test(rawValue)
    ? rawValue
    : `${rawValue.replace(' ', 'T')}Z`);
  if (Number.isNaN(date.getTime())) return 'Tarix göstərilməyib';
  const elapsedSeconds = Math.max(0, Math.floor((now - date.getTime()) / 1000));
  const relative = elapsedSeconds < 60
    ? `${elapsedSeconds} saniyə əvvəl`
    : elapsedSeconds < 3600
      ? `${Math.floor(elapsedSeconds / 60)} dəqiqə əvvəl`
      : elapsedSeconds < 86400
        ? `${Math.floor(elapsedSeconds / 3600)} saat əvvəl`
        : `${Math.floor(elapsedSeconds / 86400)} gün əvvəl`;
  return relative;
}

function formatTaskPriceType(value) {
  const normalized = String(value || '').toLocaleLowerCase('az-AZ');
  if (!value || normalized.includes('sifarişçi') || normalized.includes('sifarisci') || normalized.includes('büdc') || normalized.includes('budc')) {
    return 'Sifarişçi büdcəni təyin edib';
  }
  return value;
}

function formatApplicationData(message) {
  if (message && typeof message === 'object') return message;
  if (typeof message !== 'string') return null;
  try {
    let value = JSON.parse(message || '{}');
    for (let depth = 0; depth < 2 && typeof value === 'string'; depth += 1) {
      value = JSON.parse(value);
    }
    return value && typeof value === 'object' ? value : null;
  } catch {
    return null;
  }
}

function formatDisplayText(value) {
  if (typeof value === 'string') return value;
  if (!value || typeof value !== 'object') return '';
  const nested = value.text ?? value.message ?? value.content ?? value.body;
  if (nested !== undefined) return formatDisplayText(nested);
  return '';
}

function formatApplicationMessage(message) {
  const data = formatApplicationData(message);
  return formatDisplayText(data?.text ?? data?.message ?? message);
}

const TASK_CATEGORY_OPTIONS = [
  'Veb-Saytların hazırlanması', 'Front-end', 'Back-end', 'iOS', 'Android',
  'Dizayn', 'Logotipin hazırlanması', 'SMM', 'Video montaj', 'Kopiraytinq', 'Tərcümə'
];

export default function Tapsiriqlar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profileData } = useAuth();
  const initialView = location.pathname === '/frilanserler' ? 'freelancers' : 'tasks';
  const [currentView, setCurrentView] = useState(initialView);
  const [selectedTask, setSelectedTask] = useState(null);
  const [selectedFreelancer, setSelectedFreelancer] = useState(null);
  const [selectedOwner, setSelectedOwner] = useState(null);
  const [commentText, setCommentText] = useState("");
  const [proposalPrice, setProposalPrice] = useState('');
  const [proposalPriceType, setProposalPriceType] = useState('iş başına');
  const [proposalDays, setProposalDays] = useState('');
  const [applySubmitting, setApplySubmitting] = useState(false);
  const [acceptingApplicationId, setAcceptingApplicationId] = useState(null);
  const [applyMessage, setApplyMessage] = useState("");
  const [replyDrafts, setReplyDrafts] = useState({});
  const [activeReplyTarget, setActiveReplyTarget] = useState(null);
  const [replySubmittingId, setReplySubmittingId] = useState(null);
  const [editingApplicationId, setEditingApplicationId] = useState(null);
  const [editingReply, setEditingReply] = useState(null);
  const [likeSubmittingId, setLikeSubmittingId] = useState(null);
  const [taskSearch, setTaskSearch] = useState('');
  const [taskCategory, setTaskCategory] = useState('');
  const [taskExtraFilter, setTaskExtraFilter] = useState('');
  const [taskCategoryMenuOpen, setTaskCategoryMenuOpen] = useState(false);
  const [freelancerSearch, setFreelancerSearch] = useState('');
  const [freelancerCategory, setFreelancerCategory] = useState('');
  const [freelancerExtraFilter, setFreelancerExtraFilter] = useState('');
  const [categoryMenuOpen, setCategoryMenuOpen] = useState(false);
  const [sharedCategories, setSharedCategories] = useState([]);

  const [tasks, setTasks] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [tasksError, setTasksError] = useState("");
  const [freelancers, setFreelancers] = useState([]);
  const [freelancersLoading, setFreelancersLoading] = useState(true);
  const [clubPosts, setClubPosts] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({ title: '', description: '', price: '', priceType: 'Sifarişçi büdcəni təyin edib', categories: [], mediaUrls: [] });
  const [createMediaFiles, setCreateMediaFiles] = useState([]);
  const [newTaskCategory, setNewTaskCategory] = useState('');
  const [customTaskCategories, setCustomTaskCategories] = useState([]);
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createError, setCreateError] = useState('');
  const [currentTime, setCurrentTime] = useState(Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const loadTasks = useCallback(async () => {
    setTasksLoading(true);
    setTasksError('');
    try {
      const data = await api.getTasks({ search: taskSearch });
      setTasks(data);
    } catch (err) {
      setTasksError(err.message);
    } finally {
      setTasksLoading(false);
    }
  }, [taskSearch]);

  const loadFreelancers = useCallback(async () => {
    setFreelancersLoading(true);
    try {
      const data = await api.getFreelancers();
      setFreelancers(data.map((profile) => ({
        ...profile,
        name: profile.fullName,
        username: `@${profile.fullName.toLowerCase().replace(/\s+/g, '')}`,
        avatar: profile.fullName.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase(),
        title: profile.status || profile.specialties?.[0]?.title || profile.activityAreas?.[0] || '',
        isNegotiationRate: isNegotiationRate(profile.rateType),
        reviews: { pos: '+0', neg: '-0' },
        description: profile.about || 'Profil məlumatı əlavə edilməyib.',
        skills: [...new Set([...(profile.activityAreas || []), ...(profile.specialties || []).map((item) => item.category).filter(Boolean)])],
        stats: { ...(profile.stats || {}), views: profile.stats?.projectViews || 0, customerReviews: profile.stats?.customerReviews || { pos: '+0', neg: '-0' }, registration: profile.createdAt || '', lastActive: profile.status || 'Aktiv' },
        coverImage: profile.bannerUrl || 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&q=80&w=1200',
        portfolio: profile.projects || [],
      })));
    } catch {
      setTasksError('Freelancer siyahısını yükləmək mümkün olmadı.');
    } finally {
      setFreelancersLoading(false);
    }
  }, []);

  useEffect(() => { loadTasks(); loadFreelancers(); }, [loadTasks, loadFreelancers]);
  useEffect(() => {
    api.getClubPosts().then(setClubPosts).catch(() => setClubPosts([]));
  }, []);
  useEffect(() => {
    api.getCategories().then(setSharedCategories).catch((err) => setTasksError(err.message));
  }, []);

  const visibleFreelancers = freelancers.filter((freelancer) => {
    const query = freelancerSearch.toLowerCase();
    const matchesSearch = !query || [freelancer.name, freelancer.title, ...(freelancer.skills || [])]
      .some((value) => value.toLowerCase().includes(query));
    const matchesCategory = !freelancerCategory || (freelancer.skills || []).includes(freelancerCategory);
    const hasReviews = Number(freelancer.stats?.customerReviews?.pos?.replace('+', '') || 0) > 0
      || Number(freelancer.stats?.customerReviews?.neg?.replace('-', '') || 0) > 0;
    const isPopular = Number(freelancer.stats?.views || 0) > 0
      || Number(freelancer.stats?.completedOrders || 0) > 0;
    const hasWorkExperience = Number(freelancer.workExperienceCount || 0) > 0;
    const hasCertificates = Number(freelancer.certificateCount || 0) > 0;
    const matchesExtraFilter = !freelancerExtraFilter
      || (freelancerExtraFilter === 'reviewed' && hasReviews)
      || (freelancerExtraFilter === 'popular' && isPopular)
      || (freelancerExtraFilter === 'experienced' && hasWorkExperience)
      || (freelancerExtraFilter === 'certified' && hasCertificates);
    return matchesSearch && matchesCategory && matchesExtraFilter;
  });
  const freelancerCategoryCounts = freelancers.flatMap((freelancer) => freelancer.skills || []).reduce((counts, category) => {
    counts[category] = (counts[category] || 0) + 1;
    return counts;
  }, {});
  const popularFreelancerCategories = [...new Set([...Object.entries(freelancerCategoryCounts)
    .sort(([categoryA, countA], [categoryB, countB]) => countB - countA || categoryA.localeCompare(categoryB, 'az'))
    .slice(0, 5)
    .map(([category]) => category), ...sharedCategories])];
  const freelancerCategories = [...new Set([...freelancers.flatMap((freelancer) => freelancer.skills || []), ...sharedCategories])].sort((a, b) => a.localeCompare(b, 'az'));
  const taskCategoryCounts = tasks.flatMap((task) => task.categories || []).reduce((counts, category) => {
    counts[category] = (counts[category] || 0) + 1;
    return counts;
  }, {});
  const popularTaskCategories = [...new Set([...Object.entries(taskCategoryCounts)
    .sort(([categoryA, countA], [categoryB, countB]) => countB - countA || categoryA.localeCompare(categoryB, 'az'))
    .slice(0, 5)
    .map(([category]) => category), ...sharedCategories])];
  const taskCategories = [...new Set([
    ...TASK_CATEGORY_OPTIONS,
    ...customTaskCategories,
    ...sharedCategories,
    ...freelancers.flatMap((freelancer) => freelancer.skills || []),
    ...tasks.flatMap((task) => task.categories || []),
  ])].filter(Boolean).sort((a, b) => a.localeCompare(b, 'az'));
  const visibleTasks = tasks.filter((task) => (
    (!taskCategory || (task.categories || []).includes(taskCategory))
    && (
    !taskExtraFilter
    || (taskExtraFilter === 'replies' && Number(task.applicationCount || 0) > 0)
    || (taskExtraFilter === 'priced' && Number(task.price || 0) > 0)
    || (taskExtraFilter === 'popular' && Number(task.views || 0) > 0)
    )
  ));

  // Navbar-dakı "Tapşırıqlar" / "Freelancerlər" linkləri fərqli route-lardır,
  // amma eyni komponentdən istifadə edir — path dəyişəndə görünüşü sinxronlaşdırırıq.
  React.useEffect(() => {
    setCurrentView(location.pathname === '/frilanserler' ? 'freelancers' : 'tasks');
    setSelectedTask(null);
    setSelectedOwner(null);
    setSelectedFreelancer(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const openTaskDetail = async (task) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    try {
      const full = await api.getTask(task.id);
      setSelectedTask(full);
      setSelectedOwner(null);
      try {
        setSelectedOwner(await api.getUser(full.ownerId));
      } catch {
        setSelectedOwner({
          id: full.ownerId,
          fullName: full.ownerName,
          avatarUrl: full.ownerAvatarUrl || '',
        });
      }
    } catch {
      setSelectedTask(task);
      setSelectedOwner({
        id: task.ownerId,
        fullName: task.ownerName,
        avatarUrl: task.ownerAvatarUrl || '',
      });
    }
  };

  const handleTaskClick = (task) => openTaskDetail(task);

  React.useEffect(() => {
    const taskId = location.state?.taskId;
    if (taskId) openTaskDetail({ id: taskId });
  }, [location.state?.taskId]);

  const handleFreelancerClick = async (freelancer) => {
    const hasCompleteProfile = Array.isArray(freelancer.portfolio)
      && Array.isArray(freelancer.skills)
      && typeof freelancer.description === 'string';
    setSelectedFreelancer(hasCompleteProfile ? freelancer : null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    try {
      const profile = await api.getUser(freelancer.id);
      setSelectedFreelancer({
        ...freelancer,
        ...profile,
        name: profile.fullName,
        username: `@${(profile.nickname || profile.fullName).toLowerCase().replace(/\s+/g, '')}`,
        title: profile.status || profile.specialties?.[0]?.title || profile.activityAreas?.[0] || '',
        isNegotiationRate: isNegotiationRate(profile.rateType),
        description: profile.about || 'Profil məlumatı əlavə edilməyib.',
        skills: [...new Set([...(profile.activityAreas || []), ...(profile.specialties || []).map((item) => item.category).filter(Boolean)])],
        coverImage: profile.bannerUrl || freelancer.coverImage,
        portfolio: profile.projects || [],
        stats: { ...(profile.stats || {}), views: profile.stats?.projectViews || 0, customerReviews: { pos: '+0', neg: '-0' }, registration: profile.createdAt || '', lastActive: profile.status || 'Aktiv' },
      });
    } catch {
      if (!hasCompleteProfile) setSelectedFreelancer(null);
    }
  };

  React.useEffect(() => {
    const profileId = location.state?.profileId;
    if (profileId) handleFreelancerClick({ id: profileId });
  }, [location.state?.profileId]);

  const handleBackToTasks = () => { setSelectedTask(null); setSelectedOwner(null); };
  const handleBackToFreelancers = () => setSelectedFreelancer(null);
  const shareTask = async () => {
    const url = window.location.href;
    if (navigator.share) await navigator.share({ title: selectedTask.title, text: selectedTask.description, url });
    else await navigator.clipboard.writeText(url);
  };
  const reportTask = () => navigate(`/sikayet?task=${encodeURIComponent(selectedTask.title)}&taskId=${selectedTask.id}`);
  const reportComment = (type, id, text) => `/sikayet?commentType=${encodeURIComponent(type)}&commentId=${id}&comment=${encodeURIComponent(text)}&task=${encodeURIComponent(selectedTask.title)}&taskId=${selectedTask.id}`;

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim() || !selectedTask) return;
    if (!user) {
      setApplyMessage('Təklif göndərmək üçün əvvəlcə daxil olun.');
      return;
    }
    if (user.role !== 'freelancer') {
      setApplyMessage('Yalnız frilanser hesabları təklif göndərə bilər.');
      return;
    }
    setApplySubmitting(true);
    setApplyMessage('');
    try {
      if (editingApplicationId) {
        await api.updateApplication(selectedTask.id, editingApplicationId, { message: commentText, price: proposalPrice, priceType: proposalPriceType, deliveryDays: proposalDays });
        setEditingApplicationId(null);
      } else {
        await api.applyToTask(selectedTask.id, commentText, proposalPrice, proposalPriceType, proposalDays);
      }
      setCommentText('');
      setProposalPrice('');
      setProposalDays('');
      const full = await api.getTask(selectedTask.id);
      setSelectedTask(full);
      setApplyMessage('Təklifiniz göndərildi!');
    } catch (err) {
      setApplyMessage(err.message);
    } finally {
      setApplySubmitting(false);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    setCreateError('');
    if (!createForm.title.trim() || !createForm.description.trim()) {
      setCreateError('Başlıq və təsvir tələb olunur.');
      return;
    }
    setCreateSubmitting(true);
    try {
      const uploadedMedia = await Promise.all(createMediaFiles.map((file) => api.uploadMedia(file)));
      await api.createTask({
        title: createForm.title,
        description: createForm.description,
        currency: 'AZN',
        priceType: createForm.priceType,
        price: createForm.priceType === 'Razılaşma yolu ilə' ? 0 : Number(createForm.price) || 0,
        categories: createForm.categories,
        mediaUrls: uploadedMedia.map(({ url }) => url),
      });
      setShowCreateModal(false);
      setCreateForm({ title: '', description: '', price: '', priceType: 'Sifarişçi büdcəni təyin edib', categories: [], mediaUrls: [] });
      setCreateMediaFiles([]);
      loadTasks();
    } catch (err) {
      setCreateError(err.message);
    } finally {
      setCreateSubmitting(false);
    }
  };

  const handleReplyToApplication = async (applicationId, parentId = null) => {
    const key = parentId || applicationId;
    const text = (replyDrafts[key] || '').trim();
    if (!text || !user) return;
    setReplySubmittingId(key);
    try {
      await api.replyToApplication(selectedTask.id, applicationId, text, parentId);
      const full = await api.getTask(selectedTask.id);
      setSelectedTask(full);
      setReplyDrafts((current) => ({ ...current, [key]: '' }));
      setActiveReplyTarget(null);
    } catch (err) {
      setApplyMessage(err.message);
    } finally {
      setReplySubmittingId(null);
    }
  };

  const handleUpdateReply = async () => {
    if (!editingReply?.text.trim()) return;
    try {
      await api.updateApplicationReply(selectedTask.id, editingReply.applicationId, editingReply.id, editingReply.text);
      setSelectedTask(await api.getTask(selectedTask.id));
      setEditingReply(null);
    } catch (err) { setApplyMessage(err.message); }
  };

  const handleDeleteReply = async (applicationId, replyId) => {
    if (!window.confirm('Bu cavabı silmək istədiyinizə əminsiniz?')) return;
    try {
      await api.deleteApplicationReply(selectedTask.id, applicationId, replyId);
      setSelectedTask(await api.getTask(selectedTask.id));
    } catch (err) { setApplyMessage(err.message); }
  };

  const handleEditApplication = (application) => {
    const offer = formatApplicationData(application.message) || {};
    setEditingApplicationId(application.id);
    setCommentText(formatApplicationMessage(application.message));
    setProposalPrice(offer.price ? String(offer.price) : '');
    setProposalPriceType(offer.priceType || 'iş başına');
    setProposalDays(offer.deliveryDays ? String(offer.deliveryDays) : '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteApplication = async (applicationId) => {
    if (!window.confirm('Bu təklifi silmək istədiyinizə əminsiniz?')) return;
    try {
      await api.deleteApplication(selectedTask.id, applicationId);
      setSelectedTask(await api.getTask(selectedTask.id));
    } catch (err) { setApplyMessage(err.message); }
  };

  const handleLikeApplication = async (applicationId) => {
    if (!user) {
      setApplyMessage('Bəyənmək üçün əvvəlcə daxil olun.');
      return;
    }
    setLikeSubmittingId(applicationId);
    try {
      const result = await api.likeApplication(selectedTask.id, applicationId);
      setSelectedTask((current) => ({
        ...current,
        applications: current.applications.map((application) => application.id === applicationId
          ? { ...application, liked: result.liked, likes: result.likes }
          : application),
      }));
    } catch (err) {
      setApplyMessage(err.message);
    } finally {
      setLikeSubmittingId(null);
    }
  };

  const addTaskCategory = async () => {
    const category = newTaskCategory.trim();
    if (!category) return;
    try {
      const savedCategory = await saveSharedCategory(category);
      setCreateForm((current) => ({
        ...current,
        categories: current.categories.includes(savedCategory) ? current.categories : [...current.categories, savedCategory],
      }));
      setCustomTaskCategories((current) => current.includes(savedCategory) ? current : [...current, savedCategory]);
      setNewTaskCategory('');
      setCreateError('');
    } catch (err) {
      setCreateError(err.message);
    }
  };

  const saveSharedCategory = async (rawName) => {
    const saved = await api.addCategory(rawName);
    setSharedCategories((current) => [...new Set([...current, saved.name])]);
    return saved.name;
  };

  const toggleCreateCategory = (cat) => {
    setCreateForm((prev) => ({
      ...prev,
      categories: prev.categories.includes(cat)
        ? prev.categories.filter((c) => c !== cat)
        : [...prev.categories, cat],
    }));
  };

  const renderIconForSkill = (skill) => {
    const s = skill.toLowerCase();
    if (s.includes('veb') || s.includes('front') || s.includes('back')) return <Code className="w-4 h-4" />;
    if (s.includes('dizayn') || s.includes('qrafika') || s.includes('loqotip')) return <PenTool className="w-4 h-4" />;
    if (s.includes('ios') || s.includes('android')) return <Smartphone className="w-4 h-4" />;
    if (s.includes('server')) return <Server className="w-4 h-4" />;
    if (s.includes('video') || s.includes('audio') || s.includes('smm')) return <Camera className="w-4 h-4" />;
    return <Layout className="w-4 h-4" />;
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-800 selection:bg-blue-200 selection:text-blue-900 flex flex-col relative overflow-visible pt-24">
      
      {/* Global Ambient Background Effects - Premium Look */}
      <div className="fixed top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-blue-400/10 blur-[150px] pointer-events-none z-0"></div>
      <div className="fixed bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-cyan-400/10 blur-[150px] pointer-events-none z-0"></div>

      <style>{`
        @keyframes shine {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .premium-card {
          transition: all 0.5s cubic-bezier(0.23, 1, 0.32, 1);
        }
        .premium-card:hover {
          transform: translateY(-6px) scale(1.01);
          box-shadow: 0 30px 60px -20px rgba(37, 99, 235, 0.15), 0 0 20px 0 rgba(37, 99, 235, 0.05);
          border-color: rgba(59, 130, 246, 0.3);
        }
        .glass-panel {
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(255, 255, 255, 0.8);
        }
        .text-gradient {
          background: linear-gradient(135deg, #0F172A 0%, #334155 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .price-gradient {
          background: linear-gradient(135deg, #2563EB 0%, #06B6D4 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .nav-link {
          position: relative;
        }
        .nav-link::after {
          content: '';
          position: absolute;
          width: 0;
          height: 2px;
          bottom: -4px;
          left: 0;
          background-color: #3b82f6;
          transition: width 0.3s ease;
        }
        .nav-link:hover::after, .nav-link.active::after {
          width: 100%;
        }
      `}</style>

      <main className="flex-grow max-w-[1440px] mx-auto px-2 sm:px-4 lg:px-5 py-6 w-full relative z-10">
        
        {/* VIEW: TASKS */}
        {currentView === 'tasks' && (
          !selectedTask ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 animate-in fade-in duration-500">
              <div className="lg:col-span-8 space-y-6">
                <div className="glass-panel rounded-3xl p-6 shadow-[0_15px_40px_-15px_rgba(0,0,0,0.05)] relative z-30 overflow-visible">
                  <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
                    <div>
                      <h1 className="text-2xl sm:text-3xl font-black text-slate-900">İş Elanları</h1>
                      <p className="text-slate-500 font-medium text-lg mt-1">Sizə uyğun <span className="text-blue-600 font-bold">tapşırıqları</span> tapın</p>
                    </div>
                    {user?.role === 'musteri' && (
                      <button
                        onClick={() => setShowCreateModal(true)}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-blue-600/20 transition-all"
                      >
                        <Plus className="w-5 h-5" /> Yeni tapşırıq
                      </button>
                    )}
                  </div>

                  <div className="flex w-full bg-white/90 backdrop-blur border border-slate-200/80 rounded-2xl overflow-visible focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all shadow-sm group relative z-50">
                    <div className="flex items-center pl-4 pr-2 text-slate-400 group-focus-within:text-blue-500 transition-colors">
                      <Search className="w-5 h-5" />
                    </div>
                    <input value={taskSearch} onChange={(e) => setTaskSearch(e.target.value)} placeholder="Tapşırıq axtarışı..." className="w-full min-w-0 py-3 px-2 bg-transparent outline-none text-slate-700 placeholder:text-slate-400 font-medium text-sm" />
                    <button type="button" className="shrink-0 bg-blue-600 hover:bg-blue-700 text-white px-5 sm:px-7 font-bold text-sm transition-colors">Axtar</button>
                    <div className="relative shrink-0 border-l border-slate-200/80">
                      <button type="button" onClick={() => setTaskCategoryMenuOpen((open) => !open)} className={`h-full min-w-[155px] px-3 flex items-center justify-center gap-2 font-bold text-sm transition-all ${taskCategory ? 'text-blue-600 bg-blue-50/80' : 'text-slate-600 hover:text-blue-600 hover:bg-slate-50'}`}>
                        <SlidersHorizontal className="w-4 h-4" />
                        <span className="truncate">{taskCategory || 'Bütün kateqoriyalar'}</span>
                        <ChevronDown className={`w-4 h-4 shrink-0 transition-transform ${taskCategoryMenuOpen ? 'rotate-180' : ''}`} />
                      </button>
                      {taskCategoryMenuOpen && (
                        <div className="absolute right-0 top-[calc(100%+8px)] z-[100] w-full min-w-64 max-h-72 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl">
                          {['', ...taskCategories].map((item) => (
                            <button key={item || 'all'} type="button" onClick={() => { setTaskCategory(item); setTaskCategoryMenuOpen(false); }} className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-sm font-semibold ${taskCategory === item ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50'}`}>
                              <span>{item || 'Bütün kateqoriyalar'}</span>
                              {taskCategory === item && <Check className="w-4 h-4" />}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {tasksLoading && (
                    <div className="flex items-center justify-center py-16 text-slate-400 gap-2">
                      <Loader2 className="w-6 h-6 animate-spin" /> Yüklənir...
                    </div>
                  )}
                  {!tasksLoading && tasksError && (
                    <div className="p-4 rounded-xl bg-red-50 text-red-700 font-medium text-sm">{tasksError}</div>
                  )}
                  {!tasksLoading && !tasksError && tasks.length === 0 && (
                    <div className="p-10 text-center text-slate-400">Hələ heç bir tapşırıq yoxdur.</div>
                  )}

                  <div className="space-y-4 mt-6">
                    {visibleTasks.map((task) => (
                      <div 
                        key={task.id} 
                        onClick={() => handleTaskClick(task)}
                        className="premium-card bg-white/80 p-4 sm:p-6 rounded-2xl border border-slate-200 cursor-pointer flex justify-between items-center gap-4"
                      >
                        <div className="min-w-0">
                          <h3 className="text-base sm:text-xl font-bold text-slate-900 mb-2 truncate">{task.title}</h3>
                          <p className="text-slate-500 text-sm leading-relaxed whitespace-pre-wrap break-words line-clamp-4">{task.description}</p>
                          <p className="text-slate-400 text-xs mt-2 font-semibold"><button type="button" onClick={(event) => { event.stopPropagation(); navigate(`/profil?userId=${task.ownerId}`); }} className="text-left hover:text-blue-700 hover:underline">{task.ownerName}</button> · {formatPostedAt(task.createdAt, currentTime)} · {task.applicationCount || 0} təklif</p>
                          {!!task.categories?.length && (
                            <div className="flex flex-wrap gap-2 mt-3">
                              {task.categories.map((category) => (
                                <span key={category} className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-600 border border-blue-100 text-xs font-bold">{category}</span>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="text-right shrink-0">
                          {task.priceType !== 'Razılaşma yolu ilə' && <div className="text-base sm:text-xl font-black price-gradient">
                            {task.price} {task.currency}
                          </div>}
                          {task.priceType === 'Razılaşma yolu ilə' ? <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Razılaşma yolu ilə</div> : <div className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">{formatTaskPriceType(task.priceType)}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Filters Box */}
              <div className="lg:col-span-4 space-y-8 sticky top-28 self-start">
                
                <div className="glass-panel rounded-3xl shadow-[0_15px_40px_-15px_rgba(0,0,0,0.05)] sidebar-card overflow-hidden">
                  <div className="p-8">
                    <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                      <div className="w-2 h-6 bg-blue-500 rounded-full"></div>
                      Məşhur tapşırıq sahələri
                    </h3>
                    <div className="space-y-4 max-h-72 overflow-y-auto">
                      {popularTaskCategories.map((item) => (
                        <label key={item} className="flex items-center gap-4 cursor-pointer group">
                          <input type="checkbox" checked={taskCategory === item} onChange={() => setTaskCategory(taskCategory === item ? '' : item)} className="peer sr-only" />
                          <span className="w-6 h-6 rounded-lg border-2 border-slate-300 flex items-center justify-center group-hover:border-blue-500 peer-checked:border-blue-500 peer-checked:bg-blue-500 transition-all shadow-sm">
                            {taskCategory === item && <Check className="w-4 h-4 text-white" />}
                          </span>
                          <span className="text-slate-600 font-semibold group-hover:text-slate-900 transition-colors">{item}</span>
                        </label>
                      ))}
                      {!popularTaskCategories.length && <p className="text-sm text-slate-400">Kateqoriyalar yüklənir...</p>}
                    </div>
                  </div>

                  <div className="border-t border-slate-200/80 p-8">
                    <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                      <div className="w-2 h-6 bg-indigo-500 rounded-full"></div>
                      Əlavə olaraq
                    </h3>
                    <div className="space-y-4">
                      {[
                        { value: 'replies', label: 'Cavab verilənlər' },
                        { value: 'popular', label: 'Populyar tapşırıqlar' },
                        { value: 'priced', label: 'Göstərilən qiymət ilə' },
                      ].map((filter) => (
                        <label key={filter.value} className="flex items-center gap-4 cursor-pointer group">
                          <input type="checkbox" checked={taskExtraFilter === filter.value} onChange={() => setTaskExtraFilter(taskExtraFilter === filter.value ? '' : filter.value)} className="peer sr-only" />
                          <span className="w-6 h-6 rounded-lg border-2 border-slate-300 flex items-center justify-center group-hover:border-indigo-500 peer-checked:border-indigo-500 peer-checked:bg-indigo-500 transition-all shadow-sm">
                            {taskExtraFilter === filter.value && <Check className="w-4 h-4 text-white" />}
                          </span>
                          <span className="text-slate-600 font-semibold group-hover:text-slate-900 transition-colors">{filter.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Club Posts Box */}
                <div className="glass-panel rounded-3xl p-8 shadow-[0_15px_40px_-15px_rgba(0,0,0,0.05)] sidebar-card">
                  <h3 className="text-xl font-bold text-slate-900 mb-8 flex items-center gap-2">
                    <div className="w-2 h-6 bg-emerald-500 rounded-full"></div>
                    <span>"Klub"-da yeni yazılar</span>
                  </h3>
                  <div className="space-y-6 divide-y divide-slate-200/60">
                    {clubPosts.slice(0, 3).map((post, i) => (
                        <div key={i} onClick={() => navigate(`/klub/${post.id}`)} className={i !== 0 ? "pt-6 group cursor-pointer" : "group cursor-pointer"}>
                        <div className="flex justify-between text-xs text-blue-500 font-bold mb-3 tracking-wide">
                          <span className="bg-blue-50 px-2 py-1 rounded-md">{post.type}</span>
                          <span className="text-slate-400 bg-slate-100 px-2 py-1 rounded-md">{post.author}</span>
                        </div>
                        <h4 className="font-bold text-slate-800 text-lg group-hover:text-blue-600 transition-colors mb-4 leading-snug">{post.title}</h4>
                        <div className="flex items-center gap-5 text-sm text-slate-500 font-semibold">
                          <span className="flex items-center gap-2"><MessageCircle className="w-4 h-4 text-slate-400 group-hover:text-blue-500 transition-colors" /> {post.comments} rəy</span>
                          <span className="flex items-center gap-2"><Eye className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 transition-colors" /> {post.views} baxış</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => navigate('/klub')} className="w-full mt-8 py-4 text-sm font-bold text-slate-700 bg-slate-100/50 hover:text-blue-600 hover:bg-blue-50 rounded-2xl transition-all border border-slate-200/50 shadow-sm hover:shadow-md">
                    Bütün mövzular
                  </button>
                </div>

              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
              
              {/* LEFT COLUMN - TASK DETAILS & COMMENTS */}
              <div className="lg:col-span-8 space-y-8">
                
                {/* Header & Search */}
                <div className="glass-panel rounded-2xl p-4 shadow-[0_12px_30px_-15px_rgba(0,0,0,0.05)] relative overflow-visible z-30">
                  <button 
                    onClick={handleBackToTasks}
                    className="flex items-center gap-2 text-sm text-slate-600 hover:text-blue-600 font-bold transition-all glass-panel px-3 py-2 rounded-xl shadow-sm w-fit hover:shadow-md hover:-translate-x-1 group"
                  >
                    <div className="bg-white p-1 rounded-full group-hover:bg-blue-50 transition-colors">
                      <ArrowLeft className="w-4 h-4" />
                    </div>
                    Bütün tapşırıqlara qayıt
                  </button>
                </div>

                {/* Task Content Card */}
                <div className="glass-panel rounded-2xl p-5 md:p-6 shadow-[0_16px_40px_-20px_rgba(0,0,0,0.1)] relative overflow-hidden">
                  {/* Decorative Elements */}
                  <div className="absolute -top-32 -right-32 w-96 h-96 bg-gradient-to-br from-blue-200/40 to-transparent rounded-full blur-[100px] pointer-events-none"></div>
                  <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-blue-500 to-cyan-400"></div>

                  {/* Actions (Share, Flag) */}
                  <div className="absolute top-5 right-5 flex gap-2 z-10">
                    <button onClick={shareTask} title="Tapşırığı paylaş" className="w-9 h-9 rounded-xl bg-white/90 backdrop-blur border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm hover:-translate-y-0.5">
                      <Share2 className="w-4 h-4" />
                    </button>
                    <button onClick={reportTask} title="Tapşırığı bildir" className="w-9 h-9 rounded-xl bg-white/90 backdrop-blur border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-all shadow-sm hover:-translate-y-0.5">
                      <Flag className="w-4 h-4" />
                    </button>
                  </div>

                  <h1 className="text-2xl md:text-3xl font-black text-slate-900 pr-24 leading-tight mb-5">{selectedTask.title}</h1>
                  
                  <div className="flex flex-wrap items-center gap-3 mb-5">
                      {selectedTask.priceType !== 'Razılaşma yolu ilə' && <div className="bg-white/80 px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
                        <span className="text-2xl font-black price-gradient">{selectedTask.price} {selectedTask.currency}</span>
                      </div>}
                      {selectedTask.priceType === 'Razılaşma yolu ilə' ? <span className="text-xs font-bold text-blue-800 uppercase tracking-wider px-3 py-2 bg-blue-50 rounded-xl border border-blue-100/80">Razılaşma yolu ilə</span> : <span className="text-xs font-bold text-blue-800 uppercase tracking-wider px-3 py-2 bg-blue-50 rounded-xl border border-blue-100/80">{formatTaskPriceType(selectedTask.priceType)}</span>}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600 font-semibold mb-6 pb-5 border-b border-slate-200/80">
                    <span className="flex items-center gap-2 bg-white/60 px-3 py-2 rounded-xl border border-slate-200/50"><MessageCircle className="w-4 h-4 text-blue-500" /> {(selectedTask.applications || []).length} cavab</span>
                    <span className="flex items-center gap-2 bg-white/60 px-3 py-2 rounded-xl border border-slate-200/50"><Eye className="w-4 h-4 text-indigo-500" /> {selectedTask.views || 0} baxış</span>
                    <span className="flex items-center gap-2 bg-white/60 px-3 py-2 rounded-xl border border-slate-200/50"><Clock className="w-4 h-4 text-emerald-500" /> {formatPostedAt(selectedTask.createdAt, currentTime)}</span>
                    {selectedTask.ownerName && <UserProfileLink userId={selectedTask.ownerId} name={selectedTask.ownerName} avatarUrl={selectedTask.ownerAvatarUrl} compact />}
                  </div>

                  <div className="flex flex-wrap gap-2 mb-6">
                    {(selectedTask.categories || []).map((cat, idx) => (
                      <span key={idx} className="px-3 py-1.5 bg-slate-100/80 text-slate-700 text-xs font-bold rounded-lg border border-slate-200/80 hover:border-blue-300 hover:bg-blue-50 transition-colors cursor-default">
                        {cat}
                      </span>
                    ))}
                  </div>

                  <div className="prose prose-slate max-w-none text-slate-700 leading-7 text-base">
                    <p>{selectedTask.description}</p>
                  </div>
                  {(selectedTask.mediaUrls || []).length > 0 && (
                    <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {selectedTask.mediaUrls.map((url) => (
                        /\.(mp4|webm)(\?|$)/i.test(url)
                          ? <video key={url} src={url} controls className="w-full aspect-video object-cover rounded-xl border border-slate-200 bg-slate-900" />
                          : <img key={url} src={url} alt="Tapşırıq əlavəsi" className="w-full aspect-video object-cover rounded-xl border border-slate-200" />
                      ))}
                    </div>
                  )}
                </div>

                {/* Comments Section */}
                <div className="glass-panel rounded-2xl p-5 md:p-6 shadow-[0_16px_40px_-20px_rgba(0,0,0,0.1)] relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50/50 rounded-bl-full -z-10"></div>
                  
                  <h3 className="text-xl font-black text-slate-900 mb-5 flex items-center gap-3">
                    <div className="w-9 h-9 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                      <MessageCircle className="w-4 h-4" />
                    </div>
                    Təkliflər ({(selectedTask.applications || []).length})
                  </h3>

                  {/* Comment / Proposal Input */}
                  <form onSubmit={handleAddComment} className="mb-6 relative">
                    <div className="relative bg-white rounded-xl p-1 border border-slate-200 shadow-sm">
                      <textarea
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        placeholder="Müştəriyə öz təklifini və ya layihə haqqında rəyini yaz..."
                        className="w-full p-3 bg-transparent resize-none h-24 focus:outline-none text-slate-700 font-medium text-sm placeholder:text-slate-400"
                      ></textarea>
                       <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-2 border-t border-slate-100">
                      <input type="number" min="0" value={proposalPrice} onChange={(e) => setProposalPrice(e.target.value)} placeholder="Təklif qiyməti" className="px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none" />
                      <select value={proposalPriceType} onChange={(e) => setProposalPriceType(e.target.value)} className="px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none bg-white"><option>iş başına</option><option>saatlıq</option><option>günlük</option></select>
                      <input type="number" min="1" value={proposalDays} onChange={(e) => setProposalDays(e.target.value)} placeholder="Gün sayı" className="px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none" />
                       </div>
                       <div className="flex justify-between items-center p-2">
                        {applyMessage && <span className="text-sm font-semibold text-blue-600 px-2">{applyMessage}</span>}
                        <button 
                          type="submit" 
                          disabled={!commentText.trim() || applySubmitting}
                          className="ml-auto bg-gradient-to-r from-blue-600 to-blue-500 text-white px-5 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 hover:shadow-lg hover:shadow-blue-500/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5"
                        >
                          {applySubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />} {editingApplicationId ? 'Təklifi yenilə' : 'Göndər'}
                        </button>
                      </div>
                    </div>
                    {editingApplicationId && <button type="button" onClick={() => { setEditingApplicationId(null); setCommentText(''); setProposalPrice(''); setProposalDays(''); }} className="mt-2 text-sm font-semibold text-slate-500 hover:text-slate-800">Redaktəni ləğv et</button>}
                  </form>

                  {/* Proposals List */}
                  <div className="space-y-3">
                    {(selectedTask.applications || []).map((app) => (
                      <div key={app.id} className="flex gap-3 p-4 bg-white/60 rounded-xl border border-slate-200/60 hover:bg-white hover:shadow-lg hover:shadow-slate-200/50 transition-all duration-300 group">
                        <div className="flex-1">
                          <div className="flex justify-between items-center mb-3 flex-wrap gap-2">
                            <h4 className="font-bold text-slate-900 text-base"><UserProfileLink userId={app.freelancerId} name={app.freelancerName} avatarUrl={app.freelancerAvatarUrl} compact /></h4>
                            <span className={`text-sm font-bold px-3 py-1.5 rounded-xl border ${app.status === 'qəbul edilib' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100/80 text-slate-500 border-slate-200'}`}>
                              {app.status}
                            </span>
                          </div>
                          <p className="text-slate-600 font-medium leading-relaxed text-sm">{formatApplicationMessage(app.message)}</p>
                          {formatApplicationData(app.message)?.price > 0 && <p className="text-xs text-blue-600 mt-2 font-bold">{formatApplicationData(app.message).price} AZN · {formatApplicationData(app.message).priceType} · {formatApplicationData(app.message).deliveryDays || '-'} gün</p>}
                          <div className="flex justify-end mt-1">
                            <CommentActions
                              isAuthor={user?.id === app.freelancerId}
                              reportUrl={reportComment('təklif', app.id, formatApplicationMessage(app.message))}
                              onEdit={() => handleEditApplication(app)}
                              onDelete={() => handleDeleteApplication(app.id)}
                            />
                          </div>
                          <div className="flex items-center gap-3 mt-3">
                            <button type="button" onClick={() => handleLikeApplication(app.id)} disabled={likeSubmittingId === app.id} className={`inline-flex items-center gap-1.5 text-xs font-bold transition-colors ${app.liked ? 'text-rose-500' : 'text-slate-400 hover:text-rose-500'}`}>
                              <Heart className={`w-4 h-4 ${app.liked ? 'fill-current' : ''}`} /> {app.likes || 0}
                            </button>
                            <button type="button" onClick={() => setActiveReplyTarget({ applicationId: app.id, parentId: null })} className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-blue-600">
                              <Reply className="w-4 h-4" /> Cavab ver
                            </button>
                          </div>
                          {(app.replies || []).length > 0 && (
                            <div className="mt-3 ml-3 pl-3 border-l-2 border-slate-100 space-y-2">
                              {app.replies.map((reply) => (
                                <div key={reply.id} className="text-sm bg-slate-50 rounded-lg px-3 py-2">
                                  <UserProfileLink userId={reply.authorId} name={reply.authorName} avatarUrl={reply.authorAvatarUrl} compact />
                                  {editingReply?.id === reply.id ? (
                                    <div className="mt-1 flex gap-2"><input value={editingReply.text} onChange={(event) => setEditingReply((current) => ({ ...current, text: event.target.value }))} className="min-w-0 flex-1 rounded border border-slate-200 px-2 py-1" /><button type="button" onClick={handleUpdateReply} className="text-xs font-bold text-blue-700">Yadda saxla</button><button type="button" onClick={() => setEditingReply(null)} className="text-xs text-slate-500">Ləğv et</button></div>
                                  ) : <p className="text-slate-600 mt-0.5">{reply.text}</p>}
                                  <div className="flex justify-end">
                                    <CommentActions
                                      isAuthor={user?.id === reply.authorId}
                                      reportUrl={reportComment('təklif-cavabı', reply.id, reply.text)}
                                      onEdit={() => setEditingReply({ id: reply.id, applicationId: app.id, text: reply.text })}
                                      onDelete={() => handleDeleteReply(app.id, reply.id)}
                                    />
                                  </div>
                                  <button type="button" onClick={() => setActiveReplyTarget({ applicationId: app.id, parentId: reply.id })} className="mt-1 text-xs font-bold text-slate-400 hover:text-blue-600">Cavab ver</button>
                                </div>
                              ))}
                            </div>
                          )}
                          {activeReplyTarget?.applicationId === app.id && (
                            <div className="mt-2 flex gap-2">
                              <input
                                value={replyDrafts[activeReplyTarget.parentId || app.id] || ''}
                                onChange={(e) => setReplyDrafts((current) => ({ ...current, [activeReplyTarget.parentId || app.id]: e.target.value }))}
                                placeholder="Cavabınızı yazın..."
                                className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-xs outline-none focus:ring-2 focus:ring-blue-500"
                              />
                              <button type="button" onClick={() => handleReplyToApplication(app.id, activeReplyTarget.parentId)} disabled={replySubmittingId === (activeReplyTarget.parentId || app.id)} className="px-3 py-2 rounded-lg bg-blue-600 text-white text-xs font-bold disabled:opacity-60">
                                Göndər
                              </button>
                            </div>
                          )}
                          {user && user.id === selectedTask.ownerId && app.status !== 'qəbul edilib' && (
                            <button
                              disabled={acceptingApplicationId === app.id}
                              onClick={async () => {
                                setAcceptingApplicationId(app.id);
                                setApplyMessage('');
                                try {
                                  await api.acceptApplication(selectedTask.id, app.id);
                                  const full = await api.getTask(selectedTask.id);
                                  setSelectedTask(full);
                                  setApplyMessage('Təklif qəbul edildi və frilanserə mesaj göndərildi.');
                                } catch (err) {
                                  setApplyMessage(err.message);
                                } finally {
                                  setAcceptingApplicationId(null);
                                }
                              }}
                              className="mt-4 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-wait text-white text-sm font-bold rounded-xl transition-colors"
                            >
                              {acceptingApplicationId === app.id ? 'Qəbul edilir...' : 'Qəbul et'}
                            </button>
                          )}
                          {user && (user.id === selectedTask.ownerId || user.id === app.freelancerId) && (
                            <button
                              onClick={() => navigate(`/mesajlar?to=${user.id === selectedTask.ownerId ? app.freelancerId : selectedTask.ownerId}`)}
                              className="mt-4 px-5 py-2 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-600 text-sm font-bold rounded-xl transition-colors"
                            >
                              Mesaj göndər
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* RIGHT COLUMN - CLIENT DETAILS */}
              <div className="lg:col-span-4 space-y-8 sticky top-28 self-start">
                <div className="glass-panel rounded-2xl shadow-[0_16px_40px_-20px_rgba(0,0,0,0.1)] overflow-hidden border border-white/60">
                  
                  {/* Profile Header */}
                  <div className="p-5 flex flex-col items-center text-center border-b border-slate-200/80 bg-gradient-to-b from-white/80 to-transparent relative overflow-hidden">
                     {/* Background Glow */}
                     <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-amber-400/10 rounded-full blur-[60px] pointer-events-none"></div>

                     <div className="relative mb-3 group">
                       <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-amber-300 via-yellow-400 to-orange-400 p-1 shadow-lg shadow-yellow-500/20 group-hover:rotate-3 group-hover:scale-105 transition-all duration-500">
                         {(selectedOwner?.avatarUrl || selectedTask.ownerAvatarUrl) ? (
                           <img
                             src={selectedOwner?.avatarUrl || selectedTask.ownerAvatarUrl}
                             alt={selectedOwner?.fullName || selectedTask.ownerName || 'Müştəri profili'}
                             className="w-full h-full object-cover rounded-[0.9rem] bg-white"
                           />
                         ) : (
                           <div className="w-full h-full bg-white rounded-[0.9rem]" aria-label="Müştəri profil şəkli yoxdur" />
                         )}
                       </div>
                     </div>
                     <h2 className="text-xl font-black text-slate-900 mb-1 relative z-10"><Link to={`/profil?userId=${selectedOwner?.id || selectedTask.ownerId}`} className="hover:text-blue-700 hover:underline">{selectedOwner?.fullName || selectedTask.ownerName || 'Sifarişçi'}</Link></h2>
                     <div className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] relative z-10">Müştəri</div>
                  </div>

                  {/* Stats Sections */}
                  <div className="p-5 space-y-5 bg-white/40">
                    
                    {/* User Stats */}
                    <div>
                      <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <div className="p-1.5 bg-slate-200/50 rounded-lg"><User className="w-3.5 h-3.5 text-slate-500" /></div>
                        İstifadəçi statistikası
                      </h3>
                      <div className="flex justify-between items-center bg-white px-4 py-3 rounded-xl border border-slate-200 shadow-sm">
                        <span className="text-slate-600 text-sm font-bold">Baxış sayı</span>
                        <span className="font-black text-slate-900">{selectedOwner?.stats?.projectViews || 0}</span>
                      </div>
                    </div>

                    {/* Client Stats Detailed */}
                    <div className="pt-5 border-t border-slate-200/80">
                      <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <div className="p-1.5 bg-slate-200/50 rounded-lg"><CheckCircle2 className="w-3.5 h-3.5 text-slate-500" /></div>
                        Müştərinin statistikası
                      </h3>
                      <div className="space-y-3">
                        {[
                          { label: "Tamamlanmış sifarişlər", val: selectedOwner?.stats?.completedOrders || 0 },
                          { label: "Aktiv tapşırıqlar", val: selectedOwner?.stats?.activeOrders || 0 },
                          { label: "Arbitraj işləri", val: selectedOwner?.stats?.conflictJobs || 0 }
                        ].map((stat, i) => (
                          <div key={i} className="flex justify-between items-center px-4 py-2.5 bg-white/50 hover:bg-white rounded-xl transition-all border border-transparent hover:border-slate-200 hover:shadow-sm">
                            <span className="text-sm text-slate-600 font-semibold">{stat.label}</span>
                            <span className="font-black text-slate-900 bg-white shadow-sm border border-slate-200 px-3 py-1 rounded-lg">{stat.val}</span>
                          </div>
                        ))}
                        
                        {/* Reviews specific styling */}
                        <div className="flex justify-between items-center px-4 py-2.5 bg-white/50 hover:bg-white rounded-xl transition-all border border-transparent hover:border-slate-200 hover:shadow-sm">
                          <span className="text-sm text-slate-600 font-semibold">Frilanserlərin rəyi</span>
                          <div className="font-black bg-white shadow-sm border border-slate-200 px-3 py-1 rounded-lg flex items-center gap-1">
                            <span className="text-emerald-500">+0</span>
                            <span className="text-slate-300 mx-1">/</span>
                            <span className="text-red-500">-0</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Timeline Stats */}
                  </div>
                </div>
              </div>

            </div>
          )
        )}

        {/* VIEW: FREELANCERS */}
        {currentView === 'freelancers' && (
          !selectedFreelancer ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 animate-in fade-in duration-500">
              
              {/* LEFT COLUMN - FREELANCERS LIST */}
              <div className="lg:col-span-8 space-y-8">
                
                {/* Header & Search */}
                <div className="glass-panel rounded-3xl p-6 shadow-[0_15px_40px_-15px_rgba(0,0,0,0.05)] relative z-30 overflow-visible">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-100/40 rounded-full blur-[80px] -z-10 translate-x-1/2 -translate-y-1/2"></div>
                  
                  <div className="flex justify-between items-end mb-6">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-black text-gradient tracking-tight mb-2">
                        Frilanserlər ({freelancersLoading ? '...' : freelancers.length})
                      </h1>
                      <p className="text-slate-500 font-medium text-lg">Layihəniz üçün ən yaxşı <span className="text-blue-600 font-bold">mütəxəssisləri</span> tapın</p>
                    </div>
                  </div>
                  
                  <div className="flex w-full bg-white/90 backdrop-blur border border-slate-200/80 rounded-2xl overflow-visible focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all shadow-sm group relative z-50">
                    <div className="flex items-center pl-4 pr-2 text-slate-400 group-focus-within:text-blue-500 transition-colors">
                      <Search className="w-5 h-5" />
                    </div>
                    <input 
                      type="text" 
                      value={freelancerSearch}
                      onChange={(e) => setFreelancerSearch(e.target.value)}
                      placeholder="Frilanser axtarışı..." 
                      className="w-full py-3 px-2 bg-transparent outline-none text-slate-700 placeholder:text-slate-400 font-medium text-sm"
                    />
                    <button type="button" className="bg-blue-600 hover:bg-blue-700 text-white px-5 sm:px-7 font-bold text-sm transition-colors">
                      Axtar
                    </button>
                    <div className="relative shrink-0 border-l border-slate-200/80">
                      <button
                        type="button"
                        onClick={() => setCategoryMenuOpen((open) => !open)}
                        className={`h-full min-w-[155px] px-3 flex items-center justify-center gap-2 font-bold text-sm transition-all ${
                          freelancerCategory
                            ? 'text-blue-600 bg-blue-50/80'
                            : 'text-slate-600 hover:text-blue-600 hover:bg-slate-50'
                        }`}
                        aria-expanded={categoryMenuOpen}
                        aria-label="Kateqoriya filtri"
                      >
                        <SlidersHorizontal className="w-4 h-4" />
                        <span className="max-w-[115px] truncate">{freelancerCategory || 'Kateqoriya'}</span>
                        <ChevronDown className={`w-4 h-4 transition-transform ${categoryMenuOpen ? 'rotate-180' : ''}`} />
                      </button>
                      {categoryMenuOpen && (
                        <div className="absolute right-0 top-[calc(100%+12px)] z-[100] w-72 rounded-2xl border border-slate-200 bg-white/95 backdrop-blur-xl p-2 shadow-2xl shadow-blue-900/15 animate-in fade-in slide-in-from-top-2 duration-200">
                          <div className="px-3 py-2 text-[11px] uppercase tracking-widest text-slate-400 font-black">
                            Fəaliyyət sahəsi seç
                          </div>
                          <button
                            type="button"
                            onClick={() => { setFreelancerCategory(''); setCategoryMenuOpen(false); }}
                            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-sm font-bold transition-colors ${
                              !freelancerCategory ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            Bütün kateqoriyalar
                            {!freelancerCategory && <Check className="w-4 h-4" />}
                          </button>
                          <div className="max-h-64 overflow-y-auto mt-1">
                            {freelancerCategories.map((category) => (
                              <button
                                key={category}
                                type="button"
                                onClick={() => { setFreelancerCategory(category); setCategoryMenuOpen(false); }}
                                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-sm font-semibold transition-colors ${
                                  freelancerCategory === category ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50 hover:text-blue-600'
                                }`}
                              >
                                <span className="truncate">{category}</span>
                                {freelancerCategory === category && <Check className="w-4 h-4 shrink-0" />}
                              </button>
                            ))}
                            {!freelancerCategories.length && <p className="px-3 py-3 text-sm text-slate-400">Kateqoriyalar yüklənir...</p>}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Freelancers Mapping */}
                <div className="space-y-6">
                  {freelancersLoading && [1, 2, 3].map((item) => (
                    <div key={item} className="bg-white/80 rounded-3xl p-8 border border-blue-100/60 animate-pulse">
                      <div className="flex items-center gap-5">
                        <div className="w-20 h-20 rounded-[1.5rem] bg-slate-200" />
                        <div className="space-y-3 flex-1">
                          <div className="h-6 bg-slate-200 rounded-lg w-1/3" />
                          <div className="h-4 bg-slate-100 rounded-lg w-1/2" />
                          <div className="h-4 bg-slate-100 rounded-lg w-3/4" />
                        </div>
                      </div>
                    </div>
                  ))}
                  {!freelancersLoading && visibleFreelancers.map((freelancer) => (
                    <div 
                      key={freelancer.id} 
                      onClick={() => handleFreelancerClick(freelancer)}
                      className="premium-card bg-gradient-to-br from-blue-50/80 to-white/90 backdrop-blur rounded-3xl p-6 cursor-pointer group relative overflow-hidden border border-blue-100/50"
                    >
                      {/* Hover Effects */}
                      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/60 to-transparent -translate-x-[150%] group-hover:animate-[shine_1.5s_ease-in-out] pointer-events-none z-0"></div>
                      <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-blue-400/10 rounded-full blur-[40px] group-hover:bg-blue-400/20 transition-colors pointer-events-none"></div>

                      <div className="flex flex-col sm:flex-row justify-between items-start gap-6 relative z-10">
                        
                        {/* Avatar & Info */}
                        <div className="flex items-start gap-5 w-full sm:w-auto">
                          <div className="relative">
                            <div className="w-20 h-20 rounded-[1.5rem] bg-gradient-to-tr from-blue-400 to-cyan-400 p-1 shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform duration-300">
                              <div className="w-full h-full bg-white rounded-[1.3rem] overflow-hidden flex items-center justify-center text-2xl font-black text-transparent bg-clip-text bg-gradient-to-br from-blue-600 to-cyan-600">
                                {freelancer.avatarUrl ? (
                                  <img src={freelancer.avatarUrl} alt={freelancer.name} className="w-full h-full object-cover" />
                                ) : freelancer.avatar}
                              </div>
                            </div>
                            {freelancer.isVerified && (
                              <div className="absolute -top-2 -right-2 bg-blue-500 text-white p-1 rounded-full border-2 border-white shadow-sm" title="Verified">
                                <ShieldCheck className="w-4 h-4" />
                              </div>
                            )}
                          </div>

                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-lg sm:text-2xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                                {freelancer.name}
                              </h3>
                            </div>
                            <p className="text-slate-600 text-sm leading-relaxed mb-4 line-clamp-2 max-w-2xl">
                              {freelancer.description}
                            </p>
                          </div>
                        </div>

                      </div>

                      {/* Skills */}
                      <div className="flex flex-wrap gap-2 mt-6 relative z-10 pl-0 sm:pl-25 ml-0 sm:ml-[100px]">
                        {freelancer.skills.map((skill, idx) => (
                          <span key={idx} className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-slate-600 text-xs font-bold rounded-lg border border-slate-200 shadow-sm hover:border-blue-300 hover:text-blue-600 transition-colors">
                            {renderIconForSkill(skill)}
                            {skill}
                          </span>
                        ))}
                        {!freelancersLoading && !visibleFreelancers.length && (
                          <div className="rounded-3xl border border-slate-200 bg-white/80 p-10 text-center text-slate-500 font-medium">
                            Axtarışınıza uyğun freelancer tapılmadı.
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* RIGHT COLUMN - FILTERS & CLUB */}
              <div className="lg:col-span-4 space-y-8 sticky top-28 self-start">
                
                {/* Filters Box */}
                <div className="glass-panel rounded-3xl shadow-[0_15px_40px_-15px_rgba(0,0,0,0.05)] sidebar-card overflow-hidden">
                  <div className="p-8">
                    <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                      <div className="w-2 h-6 bg-blue-500 rounded-full"></div>
                      Məşhur fəaliyyət sahələri
                    </h3>
                    <div className="space-y-4 max-h-72 overflow-y-auto">
                      {popularFreelancerCategories.map((category) => (
                        <label key={category} className="flex items-center gap-4 cursor-pointer group">
                          <input
                            type="checkbox"
                            checked={freelancerCategory === category}
                            onChange={() => setFreelancerCategory(freelancerCategory === category ? '' : category)}
                            className="peer sr-only"
                          />
                          <span className="w-6 h-6 rounded-lg border-2 border-slate-300 flex items-center justify-center group-hover:border-blue-500 peer-checked:border-blue-500 peer-checked:bg-blue-500 transition-all shadow-sm">
                            {freelancerCategory === category && <Check className="w-4 h-4 text-white" />}
                          </span>
                          <span className="text-slate-600 font-semibold group-hover:text-slate-900 transition-colors">{category}</span>
                        </label>
                      ))}
                      {!popularFreelancerCategories.length && <p className="text-sm text-slate-400">Kateqoriyalar yüklənir...</p>}
                    </div>
                  </div>

                  <div className="border-t border-slate-200/80 p-8">
                    <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                      <div className="w-2 h-6 bg-indigo-500 rounded-full"></div>
                      Əlavə olaraq
                    </h3>
                    <div className="space-y-4">
                      {[
                        { value: 'reviewed', label: 'Müştəri rəyi olanlar' },
                        { value: 'popular', label: 'Populyar istifadəçilər' },
                        { value: 'experienced', label: 'İş təcrübəsi olanlar' },
                        { value: 'certified', label: 'Sertifikatı olanlar' },
                      ].map((filter) => (
                        <label key={filter.value} className="flex items-center gap-4 cursor-pointer group">
                          <input
                            type="checkbox"
                            checked={freelancerExtraFilter === filter.value}
                            onChange={() => setFreelancerExtraFilter(freelancerExtraFilter === filter.value ? '' : filter.value)}
                            className="peer sr-only"
                          />
                          <span className="w-6 h-6 rounded-lg border-2 border-slate-300 flex items-center justify-center group-hover:border-indigo-500 peer-checked:border-indigo-500 peer-checked:bg-indigo-500 transition-all shadow-sm">
                            {freelancerExtraFilter === filter.value && <Check className="w-4 h-4 text-white" />}
                          </span>
                          <span className="text-slate-600 font-semibold group-hover:text-slate-900 transition-colors">{filter.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Club Posts Box */}
                <div className="glass-panel rounded-3xl p-8 shadow-[0_15px_40px_-15px_rgba(0,0,0,0.05)] sidebar-card">
                  <h3 className="text-xl font-bold text-slate-900 mb-8 flex items-center gap-2">
                    <div className="w-2 h-6 bg-emerald-500 rounded-full"></div>
                    <span>"Klub"-da yeni yazılar</span>
                  </h3>
                  <div className="space-y-6 divide-y divide-slate-200/60">
                    {clubPosts.slice(0, 3).map((post, i) => (
                      <div key={i} onClick={() => navigate(`/klub/${post.id}`)} className={i !== 0 ? "pt-6 group cursor-pointer" : "group cursor-pointer"}>
                        <div className="flex justify-between text-xs text-blue-500 font-bold mb-3 tracking-wide">
                          <span className="bg-blue-50 px-2 py-1 rounded-md">{post.type}</span>
                          <span className="text-slate-400 bg-slate-100 px-2 py-1 rounded-md">{post.author}</span>
                        </div>
                        <h4 className="font-bold text-slate-800 text-lg group-hover:text-blue-600 transition-colors mb-4 leading-snug">{post.title}</h4>
                        <div className="flex items-center gap-5 text-sm text-slate-500 font-semibold">
                          <span className="flex items-center gap-2"><MessageCircle className="w-4 h-4 text-slate-400 group-hover:text-blue-500 transition-colors" /> {post.comments} rəy</span>
                          <span className="flex items-center gap-2"><Eye className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 transition-colors" /> {post.views} baxış</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => navigate('/klub')} className="w-full mt-8 py-4 text-sm font-bold text-slate-700 bg-slate-100/50 hover:text-blue-600 hover:bg-blue-50 rounded-2xl transition-all border border-slate-200/50 shadow-sm hover:shadow-md">
                    Bütün mövzular
                  </button>
                </div>

              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
              
              {/* Back Button - Top Full Width */}
              <div className="lg:col-span-12">
                <button 
                  onClick={handleBackToFreelancers}
                  className="flex items-center gap-3 text-slate-600 hover:text-blue-600 font-bold transition-all glass-panel px-6 py-3 rounded-2xl shadow-sm w-fit hover:shadow-md hover:-translate-x-2 group"
                >
                  <div className="bg-white p-1 rounded-full group-hover:bg-blue-50 transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                  </div>
                  Bütün frilanserlərə qayıt
                </button>
              </div>

              {/* LEFT COLUMN - PROFILE DETAILS */}
              <div className="lg:col-span-8 space-y-8">
                
                {/* Cover & Header Card */}
                <div className="glass-panel rounded-[2.5rem] overflow-hidden shadow-[0_20px_50px_-20px_rgba(0,0,0,0.1)] relative">
                  {/* Cover Image */}
                  <div className="h-48 md:h-60 w-full relative overflow-hidden group">
                    <img 
                      src={selectedFreelancer.coverImage} 
                      alt="Cover" 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/30 to-transparent"></div>
                    <div className="absolute top-4 right-4 bg-black/40 backdrop-blur text-white text-xs font-bold px-3 py-1.5 rounded-lg">
                      {selectedFreelancer.onlineStatus?.isOnline ? 'Onlayn' : 'Offline'}
                    </div>
                  </div>

                  {/* Profile Info Overlayed */}
                  <div className="relative px-6 md:px-8 pb-7 pt-4 sm:pt-0">
                    <div className="flex flex-col sm:flex-row items-center sm:items-end gap-5 sm:-mt-16 relative z-10 mb-5">
                      {/* Avatar */}
                      <div className="relative group">
                        <div className="w-24 h-24 md:w-28 md:h-28 rounded-[1.5rem] bg-gradient-to-tr from-blue-400 to-cyan-400 p-1.5 shadow-2xl shadow-blue-500/30 group-hover:scale-105 transition-transform duration-300 bg-white">
                           <div className="w-full h-full bg-white rounded-[1.2rem] overflow-hidden flex items-center justify-center text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-blue-600 to-cyan-600">
                             {selectedFreelancer.avatarUrl ? (
                               <img src={selectedFreelancer.avatarUrl} alt={selectedFreelancer.name} className="w-full h-full object-cover" />
                             ) : selectedFreelancer.avatar}
                           </div>
                        </div>
                        {selectedFreelancer.isVerified && (
                          <div className="absolute -top-3 -right-3 bg-blue-500 text-white p-2 rounded-full border-4 border-white shadow-lg" title="Verified">
                            <ShieldCheck className="w-6 h-6" />
                          </div>
                        )}
                      </div>

                      {/* Name & Title */}
                      <div className="text-center sm:text-left flex-1 pb-2">
                        <h1 className="text-2xl md:text-3xl font-black text-slate-900 mb-1 sm:text-white sm:drop-shadow-lg flex items-center justify-center sm:justify-start gap-3">
                          {selectedFreelancer.name}
                        </h1>
                        <p className="text-sm font-bold text-blue-500 sm:text-blue-300 mt-1">{selectedFreelancer.username}</p>
                      </div>

                      {/* Message Button */}
                      <div className="pb-2">
                         <button onClick={() => navigate(`/mesajlar?to=${selectedFreelancer.id}`)} className="bg-white text-blue-600 hover:bg-blue-50 px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg transition-all hover:-translate-y-1 group border border-slate-100 sm:border-transparent">
                            <MessageCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
                            Mesaj yaz
                         </button>
                      </div>
                    </div>
                  </div>
                </div>

                <section className="glass-panel rounded-[2rem] p-8 md:p-10 shadow-sm">
                  <div className="mb-5 flex items-center justify-between border-b border-slate-200/80 pb-4">
                    <h2 className="text-2xl font-black text-slate-900">Haqqında</h2>
                    {user?.id === selectedFreelancer.id && <button type="button" onClick={() => navigate('/kabinet?tab=personal_info')} className="text-sm font-bold text-blue-700 hover:underline">Bio-nu redaktə et</button>}
                  </div>
                  <p className="whitespace-pre-wrap text-base leading-7 text-slate-700">{selectedFreelancer.description || 'Bio məlumatı əlavə edilməyib.'}</p>
                  <div className="mt-6 border-t border-slate-100 pt-5">
                    <h3 className="mb-3 text-sm font-bold text-slate-800">Fəaliyyət sahələri</h3>
                    <div className="flex flex-wrap gap-2">
                      {[...new Set(selectedFreelancer.skills || [])].map((skill) => <span key={skill} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700">{renderIconForSkill(skill)}{skill}</span>)}
                      {!selectedFreelancer.skills?.length && <span className="text-sm text-slate-500">Fəaliyyət sahəsi əlavə edilməyib.</span>}
                    </div>
                  </div>
                </section>

                <section className="glass-panel rounded-[2rem] p-8 md:p-10 shadow-sm">
                  <div className="mb-5 flex items-center justify-between border-b border-slate-200/80 pb-4">
                    <h2 className="flex items-center gap-2 text-2xl font-black text-slate-900"><Briefcase className="h-5 w-5 text-blue-600" /> İş təcrübəsi</h2>
                    {user?.id === selectedFreelancer.id && <button type="button" onClick={() => navigate('/profil/tecrubeler?tab=experience')} className="text-sm font-bold text-blue-700 hover:underline">Əlavə et</button>}
                  </div>
                  {selectedFreelancer.workExperiences?.length ? <div className="space-y-5">{selectedFreelancer.workExperiences.map((item) => <article key={item.id} className="flex gap-4"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600"><Briefcase className="h-5 w-5" /></span><div><h3 className="font-bold text-slate-900">{item.positionTitle}</h3><p className="mt-0.5 text-sm text-slate-700">{item.companyName}{item.location ? ` · ${item.location}` : ''}</p><p className="mt-1 text-xs text-slate-500">{item.employmentType}{item.employmentType ? ' · ' : ''}{item.startDate || 'Tarix qeyd edilməyib'} – {item.isCurrent ? 'Hazırda' : (item.endDate || 'Tarix qeyd edilməyib')}</p>{item.description && <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">{item.description}</p>}</div></article>)}</div> : <p className="text-sm text-slate-500">İş təcrübəsi əlavə edilməyib.</p>}
                </section>

                <section className="glass-panel rounded-[2rem] p-8 md:p-10 shadow-sm">
                  <div className="mb-5 flex items-center justify-between border-b border-slate-200/80 pb-4">
                    <h2 className="flex items-center gap-2 text-2xl font-black text-slate-900"><Award className="h-5 w-5 text-blue-600" /> Sertifikatlar</h2>
                    {user?.id === selectedFreelancer.id && <button type="button" onClick={() => navigate('/profil/tecrubeler?tab=certificates')} className="text-sm font-bold text-blue-700 hover:underline">Əlavə et</button>}
                  </div>
                  {selectedFreelancer.certificates?.length ? <div className="space-y-4">{selectedFreelancer.certificates.map((item) => <article key={item.id} className="flex gap-4"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700"><Award className="h-5 w-5" /></span><div className="min-w-0 flex-1"><h3 className="font-bold text-slate-900">{item.name}</h3><p className="mt-0.5 text-sm text-slate-600">{item.issuer}{item.issueDate ? ` · ${item.issueDate}` : ''}</p>{item.credentialId && <p className="mt-1 text-xs text-slate-500">ID: {item.credentialId}</p>}{item.description && <p className="mt-2 text-sm text-slate-600">{item.description}</p>}</div>{item.credentialUrl && <a href={item.credentialUrl} target="_blank" rel="noreferrer" className="shrink-0 self-start text-sm font-bold text-blue-700 hover:underline">Bax</a>}</article>)}</div> : <p className="text-sm text-slate-500">Sertifikat əlavə edilməyib.</p>}
                </section>

                <section className="glass-panel rounded-[2rem] p-8 md:p-10 shadow-sm">
                  <div className="mb-5 flex items-center justify-between border-b border-slate-200/80 pb-4">
                    <h2 className="text-2xl font-black text-slate-900">İşlər və xidmətlər</h2>
                    {user?.id === selectedFreelancer.id && <button type="button" onClick={() => navigate('/kabinet?tab=freelancer_info')} className="text-sm font-bold text-blue-700 hover:underline">Redaktə et</button>}
                  </div>
                  {selectedFreelancer.specialties?.length ? <div className="grid gap-3 sm:grid-cols-2">{selectedFreelancer.specialties.map((item) => <article key={item.id} className="rounded-xl border border-slate-200 bg-white p-4"><div className="flex items-start gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">{renderIconForSkill(item.category)}</span><div className="min-w-0"><p className="text-xs font-semibold text-slate-500">{item.category}</p><h3 className="mt-1 font-bold text-slate-900">{item.title}</h3>{item.about && <p className="mt-2 text-sm leading-5 text-slate-600">{item.about}</p>}<p className="mt-3 text-xs font-semibold text-slate-600">Təcrübə: {item.experience || 'Göstərilməyib'}</p></div></div></article>)}</div> : <p className="text-sm text-slate-500">İş və xidmətlər əlavə edilməyib.</p>}
                </section>

                {/* Portfolio Section */}
                {selectedFreelancer.portfolio.length > 0 && (
                  <div className="glass-panel rounded-[2rem] p-8 md:p-10 shadow-sm relative overflow-hidden">
                    <div className="flex justify-between items-center mb-8">
                      <h2 className="text-2xl font-black text-slate-900">Portfolio</h2>
                      <button className="text-sm font-bold text-blue-600 bg-blue-50 px-4 py-2 rounded-xl hover:bg-blue-100 transition-colors">
                        Hamısına bax
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                      {selectedFreelancer.portfolio.map((item) => (
                        <div key={item.id} className="group cursor-pointer">
                          <div className="aspect-square rounded-2xl p-6 relative overflow-hidden flex flex-col justify-end shadow-sm group-hover:shadow-md transition-shadow bg-slate-100">
                            {item.image ? <img src={item.image} alt={item.title} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" /> : <div className="absolute inset-0 flex items-center justify-center opacity-80 group-hover:scale-110 transition-transform duration-500"><ImageIcon className="w-24 h-24 text-blue-300" /></div>}
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent"></div>
                            <div className="absolute top-4 left-4 bg-black/40 backdrop-blur text-white text-xs font-bold px-2 py-1 rounded-lg flex items-center gap-1 z-10">
                              <Eye className="w-3 h-3" /> {item.views || 0}
                            </div>
                            <h3 className="relative z-10 text-white font-black text-xl drop-shadow-md">{item.title}</h3>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Reviews Section */}
                <section className="glass-panel rounded-[2rem] p-6 shadow-sm sm:p-8">
                  <div className="mb-5 flex items-center justify-between border-b border-slate-200/80 pb-4"><h2 className="text-2xl font-black text-slate-900">Rəylər</h2><span className="text-sm text-slate-500">{selectedFreelancer.reviews?.length || 0}</span></div>
                  {selectedFreelancer.reviews?.length ? <div className="space-y-5">{selectedFreelancer.reviews.map((review) => <article key={review.id} className="border-b border-slate-100 pb-5 last:border-0 last:pb-0"><div className="flex flex-wrap items-center justify-between gap-2"><div><UserProfileLink userId={review.authorId} name={review.authorName} avatarUrl={review.authorAvatarUrl} compact /><p className="ml-9 text-xs text-slate-500">{review.taskTitle}{review.createdAt ? ` · ${new Date(review.createdAt).toLocaleDateString('az-AZ')}` : ''}</p></div><span className="inline-flex items-center gap-1 text-sm font-bold text-amber-600">{Array.from({ length: 5 }, (_, index) => <Star key={index} className={`h-4 w-4 ${index < review.rating ? 'fill-current' : 'text-slate-200'}`} />)}</span></div><p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">{review.text}</p></article>)}</div> : <p className="text-sm text-slate-500">Hələ rəy yazılmayıb.</p>}
                </section>

              </div>

              {/* RIGHT COLUMN - STATS WIDGETS */}
              <div className="lg:col-span-4 space-y-6 sticky top-28 self-start">
                
                {/* Stats Box */}
                <div className="glass-panel rounded-[2rem] shadow-sm overflow-hidden">
                  <div className="p-8 space-y-8">
                    
                    {/* General Stat */}
                    <div>
                      <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Statistika</h3>
                      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                        <span className="text-slate-600 font-bold">Baxış sayı</span>
                        <span className="font-black text-slate-900 text-lg">{selectedFreelancer.stats.views}</span>
                      </div>
                    </div>

                    {/* Freelancer Specific Stats */}
                    <div className="pt-6 border-t border-slate-100">
                      <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Frilanserin statistikası</h3>
                      <div className="space-y-2">
                        {[
                          { label: "Tamamlanmış sifarişlər", val: selectedFreelancer.stats.completedOrders },
                          { label: "Arbitraj işləri", val: selectedFreelancer.stats.conflictJobs || 0 }
                        ].map((stat, i) => (
                          <div key={i} className="flex justify-between items-center p-3 bg-slate-50/50 hover:bg-slate-50 rounded-xl transition-colors border border-transparent hover:border-slate-100">
                            <span className="text-slate-600 font-semibold">{stat.label}</span>
                            <span className="font-black text-slate-900 bg-white shadow-sm border border-slate-100 px-3 py-1 rounded-lg">{stat.val}</span>
                          </div>
                        ))}
                        
                        {/* Reviews */}
                        <div className="flex justify-between items-center p-3 bg-slate-50/50 hover:bg-slate-50 rounded-xl transition-colors border border-transparent hover:border-slate-100">
                          <span className="text-slate-600 font-semibold">Müştərilərin rəyi</span>
                          <div className="font-black bg-white shadow-sm border border-slate-100 px-3 py-1 rounded-lg flex items-center gap-1 text-sm">
                            <span className="text-emerald-500">{selectedFreelancer.stats.customerReviews.pos}</span>
                            <span className="text-slate-300 mx-1">/</span>
                            <span className="text-red-500">{selectedFreelancer.stats.customerReviews.neg}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Timeline */}
                    <div className="pt-6 border-t border-slate-100 space-y-3 text-sm">
                        <div className="flex justify-between items-center p-3 bg-white rounded-xl shadow-sm border border-slate-50">
                          <span className="text-slate-500 font-semibold">Status</span>
                          <span className={`font-bold ${selectedFreelancer.onlineStatus?.isOnline ? 'text-emerald-600' : 'text-slate-800'}`}>{selectedFreelancer.onlineStatus?.isOnline ? 'Onlayn' : 'Offline'}</span>
                        </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )
        )}
      </main>

      {/* CREATE TASK MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg p-8 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-2xl font-black text-slate-900 mb-6">Yeni tapşırıq yarat</h2>
            <form onSubmit={handleCreateTask} className="space-y-5">
              <div>
                <label className="text-sm font-bold text-slate-700 mb-1 block">Başlıq</label>
                <input
                  type="text"
                  value={createForm.title}
                  onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Məs: Veb saytın hazırlanması"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-bold text-slate-700 mb-1 block">Təsvir</label>
                <textarea
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none h-32 resize-none"
                  placeholder="Tapşırığın detallarını yazın..."
                  required
                />
              </div>
              <div>
                <label className="text-sm font-bold text-slate-700 mb-1 block">Qiymət formatı</label>
                <select value={createForm.priceType} onChange={(e) => setCreateForm({ ...createForm, priceType: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none">
                  <option value="Sifarişçi büdcəni təyin edib">Sifarişçi büdcəni təyin edib</option>
                  <option value="Razılaşma yolu ilə">Razılaşma yolu ilə</option>
                </select>
              </div>
              {createForm.priceType !== 'Razılaşma yolu ilə' && <div>
                <label className="text-sm font-bold text-slate-700 mb-1 block">Büdcə (AZN)</label>
                <input type="number" min="0" value={createForm.price} onChange={(e) => setCreateForm({ ...createForm, price: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" placeholder="500" />
              </div>}
              <div>
                <label className="text-sm font-bold text-slate-700 mb-2 block">Kateqoriyalar</label>
                <div className="flex flex-wrap gap-2">
                  {taskCategories.map((cat) => (
                    <button
                      type="button"
                      key={cat}
                      onClick={() => toggleCreateCategory(cat)}
                      className={`px-4 py-2 rounded-xl text-sm font-bold border transition-colors ${
                        createForm.categories.includes(cat)
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-blue-300'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                  <div className="flex w-full gap-1.5 mt-3">
                    <input
                      value={newTaskCategory}
                      onChange={(e) => setNewTaskCategory(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTaskCategory(); } }}
                      placeholder="Yeni kateqoriya əlavə et"
                      className="min-w-0 flex-1 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button type="button" onClick={addTaskCategory} className="px-2.5 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-bold whitespace-nowrap">
                      Əlavə et
                    </button>
                  </div>
                </div>
              </div>
              <div>
                <label className="text-sm font-bold text-slate-700 mb-2 block">Şəkil və ya video əlavə et</label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm"
                  multiple
                  onChange={(e) => setCreateMediaFiles(Array.from(e.target.files || []))}
                  className="w-full text-sm text-slate-500 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:font-bold file:text-blue-700 hover:file:bg-blue-100"
                />
                {createMediaFiles.length > 0 && (
                  <p className="mt-2 text-xs font-medium text-slate-500">{createMediaFiles.length} fayl seçildi</p>
                )}
              </div>
              {createError && (
                <div className="p-3 bg-red-50 text-red-700 rounded-xl text-sm font-medium">{createError}</div>
              )}
              <button
                type="submit"
                disabled={createSubmitting}
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition-all disabled:opacity-60"
              >
                {createSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                Tapşırığı dərc et
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
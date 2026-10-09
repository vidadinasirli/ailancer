import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Search,
  Lock,
  CheckCircle2,
  Heart,
  MessageSquare,
  BriefcaseBusiness,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../lib/api.js';

const VALID_TABS = ['dashboard', 'likes', 'personal_info', 'freelancer_info', 'settings', 'change_password'];
const DASHBOARD_SUBTABS = [
  { id: 'cavablarim', label: 'Cavablarım' },
  { id: 'is_gedir', label: 'İş gedir' },
  { id: 'tamamlanmis', label: 'Tamamlanmış' },
  { id: 'arbitraj', label: 'Arbitraj' },
];

export default function Kabinet() {
  const { user, profileData, saveProfile } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const initialTab = VALID_TABS.includes(searchParams.get('tab')) ? searchParams.get('tab') : 'dashboard';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [activeSubTab, setActiveSubTab] = useState('cavablarim');
  const [localProfile, setLocalProfile] = useState(profileData);
  const [saveMessage, setSaveMessage] = useState('');
  const [socialLinks, setSocialLinks] = useState({ github: '', instagram: '', linkedin: '', facebook: '', displayLink1: '', displayLink2: '' });
  const [specialties, setSpecialties] = useState([]);
  const [dashboardData, setDashboardData] = useState({ replies: [], active: [], completed: [], arbitration: [] });
  const [likedItems, setLikedItems] = useState({ projects: [], comments: [], applications: [] });
  const [specialtyForm, setSpecialtyForm] = useState({ category: '', title: '', about: '', hourlyRate: '', experience: '1-3 il', rateType: 'Saatlıq' });
  const [editingSpecialtyId, setEditingSpecialtyId] = useState(null);
  const [specialtyError, setSpecialtyError] = useState('');
  const [mediaUploading, setMediaUploading] = useState('');

  useEffect(() => {
    if (!user) navigate('/giris');
  }, [user, navigate]);

  useEffect(() => {
    const t = searchParams.get('tab');
    if (VALID_TABS.includes(t)) setActiveTab(t);
  }, [searchParams]);

  useEffect(() => {
    setLocalProfile(profileData);
  }, [profileData]);

  useEffect(() => { if (user) api.getSocialLinks().then(setSocialLinks).catch(() => {}); }, [user]);
  useEffect(() => { if (user?.role === 'freelancer') api.getSpecialties().then(setSpecialties).catch(() => {}); }, [user]);
  useEffect(() => { if (user) api.getDashboardTasks().then(setDashboardData).catch(() => {}); }, [user]);
  useEffect(() => {
    if (!user) return;
    Promise.all([api.getLikedProjects(), api.getLikedProjectComments(), api.getLikedApplications()])
      .then(([projects, comments, applications]) => setLikedItems({ projects, comments, applications }))
      .catch(() => setLikedItems({ projects: [], comments: [], applications: [] }));
  }, [user]);

  const goTab = (tab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  const [saveError, setSaveError] = useState('');

  const handleSave = async (e) => {
    e.preventDefault();
    setSaveError('');
    setSaveMessage('');
    try {
      const { id, email, role, createdAt, ...editableProfile } = localProfile;
      await saveProfile(editableProfile);
      setSaveMessage('Məlumatlar uğurla yadda saxlanıldı.');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (err) {
      setSaveError(err.message || 'Xəta baş verdi.');
    }
  };

  const saveSocial = async () => {
    await api.saveSocialLinks(socialLinks);
    setSaveMessage('Sosial linklər yadda saxlanıldı.');
    setTimeout(() => setSaveMessage(''), 3000);
  };

  const addSpecialty = async () => {
    setSpecialtyError('');
    try {
      const payload = {
        ...specialtyForm,
        hourlyRate: Number(specialtyForm.hourlyRate) || 0,
      };
      const item = editingSpecialtyId
        ? await api.updateSpecialty(editingSpecialtyId, payload)
        : await api.addSpecialty(payload);
      setSpecialties((current) => editingSpecialtyId
        ? current.map((entry) => entry.id === item.id ? item : entry)
        : [item, ...current]);
      setEditingSpecialtyId(null);
      setSpecialtyForm({ category: '', title: '', about: '', hourlyRate: '', experience: '1-3 il', rateType: 'Saatlıq' });
    } catch (err) {
      setSpecialtyError(err.message || 'İxtisas sahəsi əlavə edilə bilmədi.');
    }
  };

  const editSpecialty = (item) => {
    setEditingSpecialtyId(item.id);
    setSpecialtyForm({ category: item.category || '', title: item.title || '', about: item.about || '', hourlyRate: item.hourlyRate || '', experience: item.experience || '1-3 il', rateType: item.rateType || 'Saatlıq' });
    setSpecialtyError('');
  };

  const deleteSpecialty = async (id) => {
    try {
      await api.deleteSpecialty(id);
      setSpecialties((current) => current.filter((item) => item.id !== id));
      if (editingSpecialtyId === id) {
        setEditingSpecialtyId(null);
        setSpecialtyForm({ category: '', title: '', about: '', hourlyRate: '', experience: '1-3 il', rateType: 'Saatlıq' });
      }
    } catch (err) { setSpecialtyError(err.message); }
  };

  const uploadProfileMedia = async (field, file) => {
    if (!file) return;
    setMediaUploading(field);
    setSaveError('');
    setSaveMessage('');
    try {
      const uploaded = await api.uploadMedia(file);
      setLocalProfile((current) => ({ ...current, [field]: uploaded.url }));
      setSaveError('');
      setSaveMessage(field === 'avatarUrl'
        ? 'Profil şəkli seçildi. Yadda saxlamaq üçün “Yadda saxla” düyməsinə basın.'
        : 'Banner şəkli seçildi. Yadda saxlamaq üçün “Yadda saxla” düyməsinə basın.');
    } catch (error) {
      setSaveError(error.message);
    } finally {
      setMediaUploading('');
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#F3F4F6] pt-28 pb-20 px-4 md:px-8 font-sans">
      <style>{`
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .fade-tab { animation: fadeInUp 0.35s cubic-bezier(0.16,1,0.3,1); }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      <div className="max-w-[1200px] mx-auto">
        <h1 className="text-3xl md:text-4xl font-black text-slate-900 mb-8 tracking-tight">Kabinet</h1>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* SIDEBAR */}
          <aside className="lg:col-span-4 space-y-4 sticky top-28 self-start">
            <SidebarGroup title="Kabinet">
              {DASHBOARD_SUBTABS.map((sub) => (
                <SidebarButton
                  key={sub.id}
                  active={activeTab === 'dashboard' && activeSubTab === sub.id}
                  onClick={() => { goTab('dashboard'); setActiveSubTab(sub.id); }}
                >
                  {sub.label} ({dashboardData[sub.id === 'cavablarim' ? 'replies' : sub.id === 'is_gedir' ? 'active' : sub.id === 'tamamlanmis' ? 'completed' : 'arbitration'].length})
                </SidebarButton>
              ))}
            </SidebarGroup>

            <SidebarGroup title="Profil">
              <SidebarButton active={activeTab === 'likes'} onClick={() => goTab('likes')}>
                Bəyənilənlər
              </SidebarButton>
              <SidebarButton active={activeTab === 'personal_info'} onClick={() => goTab('personal_info')}>
                Şəxsi məlumat
              </SidebarButton>
              {user.role === 'freelancer' && (
                <SidebarButton active={activeTab === 'freelancer_info'} onClick={() => goTab('freelancer_info')}>
                  Frilanser məlumatları
                </SidebarButton>
              )}
            </SidebarGroup>

            <SidebarGroup title="Ayarlar">
              <SidebarButton active={activeTab === 'settings'} onClick={() => goTab('settings')}>
                Məxfilik
              </SidebarButton>
              <SidebarButton active={activeTab === 'change_password'} onClick={() => goTab('change_password')}>
                Şifrəni dəyiş
              </SidebarButton>
            </SidebarGroup>
          </aside>

          {/* MAIN */}
          <main className="lg:col-span-8">
            {activeTab === 'dashboard' && (
              <div key="dashboard" className="fade-tab bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="flex flex-wrap items-center justify-between p-6 border-b border-slate-200 bg-slate-50/50">
                  <h2 className="text-xl font-bold text-slate-800">
                    {DASHBOARD_SUBTABS.find((s) => s.id === activeSubTab)?.label}
                  </h2>
                </div>
                <div className="flex border-b border-slate-200 overflow-x-auto hide-scrollbar">
                  {DASHBOARD_SUBTABS.map((sub) => (
                    <button
                      key={sub.id}
                      onClick={() => setActiveSubTab(sub.id)}
                      className={`whitespace-nowrap px-8 py-4 font-bold text-sm transition-colors relative ${
                        activeSubTab === sub.id ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      {sub.label} ({dashboardData[sub.id === 'cavablarim' ? 'replies' : sub.id === 'is_gedir' ? 'active' : sub.id === 'tamamlanmis' ? 'completed' : 'arbitration'].length})
                      {activeSubTab === sub.id && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600" />}
                    </button>
                  ))}
                </div>
                <div className="p-6 min-h-[360px]">
                  {(() => {
                    const key = activeSubTab === 'cavablarim' ? 'replies' : activeSubTab === 'is_gedir' ? 'active' : activeSubTab === 'tamamlanmis' ? 'completed' : 'arbitration';
                    const items = dashboardData[key];
                    return items.length ? <div className="space-y-3">{items.map((item) => <div key={`${item.taskId || item.id}-${item.id}`} className="p-4 rounded-xl border border-slate-200 bg-slate-50"><p className="font-bold text-slate-800">{item.taskTitle || item.title}</p><p className="text-sm text-slate-500 mt-1">Status: {item.taskStatus || item.status}</p></div>)}</div> : <div className="p-16 flex flex-col items-center justify-center text-center"><Search className="w-16 h-16 text-slate-300 mb-4" /><h3 className="text-2xl font-bold text-slate-400">Hələ heç nə yoxdur</h3></div>;
                  })()}
                </div>
              </div>
            )}

            {activeTab === 'likes' && (
              <div key="likes" className="fade-tab space-y-5">
                <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-200">
                    <Heart className="w-5 h-5 text-rose-500" />
                    <h2 className="text-lg font-bold text-slate-900">Bəyənilən layihələr ({likedItems.projects.length})</h2>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {likedItems.projects.length ? likedItems.projects.map((project) => (
                      <button key={project.id} type="button" onClick={() => navigate(`/layiheler/${project.id}`)} className="w-full px-6 py-4 text-left hover:bg-slate-50">
                        <span className="font-bold text-slate-900">{project.title}</span>
                        <span className="block mt-1 text-sm text-slate-500">{project.author} · {project.likes} bəyənmə</span>
                      </button>
                    )) : <p className="px-6 py-5 text-sm text-slate-500">Bəyənilən layihə yoxdur.</p>}
                  </div>
                </section>

                <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-200">
                    <MessageSquare className="w-5 h-5 text-blue-600" />
                    <h2 className="text-lg font-bold text-slate-900">Bəyənilən şərhlər ({likedItems.comments.length})</h2>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {likedItems.comments.length ? likedItems.comments.map((comment) => (
                      <button key={comment.id} type="button" onClick={() => navigate(`/layiheler/${comment.projectId}#comment-${comment.id}`)} className="w-full px-6 py-4 text-left hover:bg-slate-50">
                        <span className="block text-slate-700 line-clamp-2">{comment.text}</span>
                        <span className="block mt-1 text-sm text-slate-500">{comment.author} · {comment.projectTitle}</span>
                      </button>
                    )) : <p className="px-6 py-5 text-sm text-slate-500">Bəyənilən şərh yoxdur.</p>}
                  </div>
                </section>

                <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-200">
                    <BriefcaseBusiness className="w-5 h-5 text-emerald-600" />
                    <h2 className="text-lg font-bold text-slate-900">Bəyənilən təkliflər ({likedItems.applications.length})</h2>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {likedItems.applications.length ? likedItems.applications.map((application) => {
                      let proposal = application.message;
                      try { proposal = JSON.parse(application.message)?.text || application.message; } catch { /* Plain text offer. */ }
                      return <button key={application.id} type="button" onClick={() => navigate('/tapsiriqlar', { state: { taskId: application.taskId } })} className="w-full px-6 py-4 text-left hover:bg-slate-50">
                        <span className="font-bold text-slate-900">{application.taskTitle}</span>
                        <span className="block mt-1 text-sm text-slate-600 line-clamp-2">{proposal}</span>
                        <span className="block mt-1 text-xs text-slate-500">{application.freelancerName}</span>
                      </button>;
                    }) : <p className="px-6 py-5 text-sm text-slate-500">Bəyənilən təklif yoxdur.</p>}
                  </div>
                </section>
              </div>
            )}

            {activeTab === 'personal_info' && (
              <div key="personal_info" className="fade-tab space-y-6">
                <form onSubmit={handleSave} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <Field label="Ad" required>
                      <input
                        type="text"
                        value={localProfile.fullName}
                        onChange={(e) => setLocalProfile({ ...localProfile, fullName: e.target.value })}
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                        placeholder="Adınız"
                      />
                    </Field>
                    <Field label="E-poçt">
                      <input
                        type="email"
                        value={user.email || ''}
                        disabled
                        className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl outline-none text-slate-500"
                      />
                    </Field>
                    <Field label="Nickname">
                      <input value={localProfile.nickname || ''} onChange={(e) => setLocalProfile({ ...localProfile, nickname: e.target.value })} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none" placeholder="nickname" />
                    </Field>
                    <Field label="Telefon">
                      <input value={localProfile.phone || ''} onChange={(e) => setLocalProfile({ ...localProfile, phone: e.target.value })} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none" placeholder="+994..." />
                    </Field>
                    {user.role === 'musteri' && <>
                      <Field label="Şirkətin adı">
                        <input value={localProfile.companyName || ''} onChange={(e) => setLocalProfile({ ...localProfile, companyName: e.target.value })} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" placeholder="Şirkətinizin adı" />
                      </Field>
                      <Field label="Fəaliyyət sahəsi">
                        <input value={localProfile.companyIndustry || ''} onChange={(e) => setLocalProfile({ ...localProfile, companyIndustry: e.target.value })} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" placeholder="Məsələn, İT, təhsil, pərakəndə satış" />
                      </Field>
                      <Field label="Şirkətin saytı">
                        <input type="url" value={localProfile.companyWebsite || ''} onChange={(e) => setLocalProfile({ ...localProfile, companyWebsite: e.target.value })} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" placeholder="https://example.com" />
                      </Field>
                      <Field label="Şirkətin ölçüsü">
                        <select value={localProfile.companySize || ''} onChange={(e) => setLocalProfile({ ...localProfile, companySize: e.target.value })} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500">
                          <option value="">Seçin</option><option>Yalnız mən</option><option>2-10 əməkdaş</option><option>11-50 əməkdaş</option><option>51-200 əməkdaş</option><option>200+ əməkdaş</option>
                        </select>
                      </Field>
                    </>}
                    <Field label="Profil şəkli URL">
                      <input value={localProfile.avatarUrl || ''} onChange={(e) => setLocalProfile({ ...localProfile, avatarUrl: e.target.value })} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none" placeholder="https://..." />
                      <input type="file" accept="image/*" onChange={(e) => uploadProfileMedia('avatarUrl', e.target.files?.[0])} className="mt-2 w-full text-sm" disabled={mediaUploading === 'avatarUrl'} />
                    </Field>
                    <Field label="Banner şəkli URL">
                      <input value={localProfile.bannerUrl || ''} onChange={(e) => setLocalProfile({ ...localProfile, bannerUrl: e.target.value })} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none" placeholder="https://..." />
                      <input type="file" accept="image/*" onChange={(e) => uploadProfileMedia('bannerUrl', e.target.files?.[0])} className="mt-2 w-full text-sm" disabled={mediaUploading === 'bannerUrl'} />
                    </Field>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-1">
                      <h3 className="font-bold text-slate-700 text-sm">Haqqımda</h3>
                    </div>

                    <div className="mt-8 pt-6 border-t border-slate-100">
                      <h3 className="font-bold text-slate-700 mb-4">Sosial linklər</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {['github', 'instagram', 'linkedin', 'facebook'].map((key) => <input key={key} value={socialLinks[key]} onChange={(e) => setSocialLinks({ ...socialLinks, [key]: e.target.value })} placeholder={`${key} linki`} className="px-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" />)}
                      </div>
                      <button type="button" onClick={saveSocial} className="mt-4 px-5 py-2.5 bg-slate-900 text-white rounded-xl font-bold">Linkləri yadda saxla</button>
                    </div>
                    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all">
                      <textarea
                        className="w-full min-h-[180px] p-4 outline-none resize-y text-slate-700 bg-transparent"
                        placeholder="Özünüz haqqında məlumat daxil edin.."
                        value={localProfile.about}
                        onChange={(e) => setLocalProfile({ ...localProfile, about: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="mt-8 flex items-center gap-3">
                    <button type="submit" className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg hover:shadow-blue-500/30">
                      Yadda saxla
                    </button>
                    <button type="button" onClick={() => setLocalProfile(profileData)} className="px-6 py-2.5 bg-white border-2 border-blue-600 text-blue-600 font-bold rounded-xl hover:bg-blue-50 transition-colors">
                      Rədd et
                    </button>
                  </div>

                  {saveMessage && (
                    <div className="mt-4 p-3 rounded-lg text-sm font-medium bg-green-50 text-green-700 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" /> {saveMessage}
                    </div>
                  )}
                  {saveError && (
                    <div className="mt-4 p-3 rounded-lg text-sm font-medium bg-red-50 text-red-700">
                      {saveError}
                    </div>
                  )}
                </form>
              </div>
            )}

            {activeTab === 'freelancer_info' && (
              <div key="freelancer_info" className="fade-tab bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8">
                <div className="mb-8 flex flex-wrap items-center justify-between gap-3"><h2 className="text-2xl font-bold text-slate-800">Frilanser məlumatları</h2><button type="button" onClick={() => navigate('/profil/tecrubeler')} className="text-sm font-bold text-blue-700 hover:underline">Təcrübə və sertifikatları idarə et</button></div>

                <div className="space-y-8">
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={localProfile.isProfileVisible}
                      onChange={(e) => setLocalProfile({ ...localProfile, isProfileVisible: e.target.checked })}
                      className="mt-1 w-5 h-5 rounded border-2 border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="text-sm">
                      <p className="font-semibold text-slate-800 group-hover:text-blue-600 transition-colors">
                        Freelancer-lər siyahısında mənim anketim görünsün
                      </p>
                    </div>
                  </label>

                  <div className="pt-6 border-t border-slate-100">
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><h3 className="font-bold text-slate-800">İxtisas və xidmətlər</h3><p className="mt-1 text-sm text-slate-500">Hər sahə üçün ayrıca təcrübə, qiymət və xidmət təsviri əlavə edin.</p></div></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <input value={specialtyForm.category} onChange={(e) => setSpecialtyForm({ ...specialtyForm, category: e.target.value })} placeholder="Fəaliyyət sahəsi" className="px-3 py-2 border border-slate-200 rounded-lg" />
                      <input value={specialtyForm.title} onChange={(e) => setSpecialtyForm({ ...specialtyForm, title: e.target.value })} placeholder="İş və ya xidmət adı" className="px-3 py-2 border border-slate-200 rounded-lg" />
                      <select value={specialtyForm.experience} onChange={(e) => setSpecialtyForm({ ...specialtyForm, experience: e.target.value })} className="px-3 py-2 border border-slate-200 rounded-lg bg-white"><option>1 ildən az</option><option>1-3 il</option><option>3-5 il</option><option>5+ il</option></select>
                      <div className="grid grid-cols-2 gap-2"><input value={specialtyForm.hourlyRate} onChange={(e) => setSpecialtyForm({ ...specialtyForm, hourlyRate: e.target.value })} type="number" min="0" placeholder="Qiymət (AZN)" className="min-w-0 px-3 py-2 border border-slate-200 rounded-lg" /><select value={specialtyForm.rateType} onChange={(e) => setSpecialtyForm({ ...specialtyForm, rateType: e.target.value })} className="min-w-0 px-2 py-2 border border-slate-200 rounded-lg bg-white"><option>Saatlıq</option><option>Layihə başına</option><option>Günlük</option><option>Danışıq</option></select></div>
                    </div>
                    <textarea value={specialtyForm.about} onChange={(e) => setSpecialtyForm({ ...specialtyForm, about: e.target.value })} placeholder="Bu sahədə gördüyünüz işlər, alətlər və bacarıqlar" className="w-full mt-3 px-3 py-2 border border-slate-200 rounded-lg min-h-24" />
                    {specialtyError && <p className="mt-3 text-sm text-red-600">{specialtyError}</p>}
                    <div className="mt-3 flex flex-wrap gap-2"><button type="button" onClick={addSpecialty} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-bold text-white">{editingSpecialtyId ? 'İxtisası yadda saxla' : 'İxtisas əlavə et'}</button>{editingSpecialtyId && <button type="button" onClick={() => { setEditingSpecialtyId(null); setSpecialtyForm({ category: '', title: '', about: '', hourlyRate: '', experience: '1-3 il', rateType: 'Saatlıq' }); setSpecialtyError(''); }} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600">Ləğv et</button>}</div>
                    <div className="mt-4 space-y-2">{specialties.map((item) => <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3"><div className="min-w-0"><b className="text-slate-800">{item.title}</b><p className="mt-1 text-xs text-slate-500">{item.category} · {item.experience || 'Təcrübə göstərilməyib'} · {item.hourlyRate ? `${item.hourlyRate} AZN / ${item.rateType || 'saatlıq'}` : 'Qiymət danışıqla'}</p>{item.about && <p className="mt-1 text-sm text-slate-600">{item.about}</p>}</div><div className="flex gap-2"><button type="button" onClick={() => editSpecialty(item)} className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-blue-700">Redaktə et</button><button type="button" onClick={() => deleteSpecialty(item.id)} className="rounded-md border border-red-100 bg-white px-3 py-1.5 text-xs font-bold text-red-600">Sil</button></div></div>)}</div>
                  </div>

                  <div className="pt-6 border-t border-slate-100 flex gap-3">
                    <button onClick={handleSave} className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg hover:shadow-blue-500/30">
                      Yadda saxla
                    </button>
                    <button onClick={() => setLocalProfile(profileData)} className="px-6 py-2.5 bg-white border border-slate-300 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-colors">
                      Rədd et
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'settings' && (
              <div key="settings" className="fade-tab space-y-5">
                <div><h2 className="text-2xl font-bold text-slate-900">Ayarlar</h2><p className="mt-1 text-sm text-slate-500">Hesabınızın görünüş və məxfilik seçimlərini idarə edin.</p></div>
                <form onSubmit={handleSave} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h3 className="mb-5 font-bold text-slate-900">Məxfilik</h3>
                  <label className="flex items-start gap-3 border-b border-slate-100 py-4 text-sm text-slate-700"><input type="checkbox" checked={localProfile.privacySettings?.acceptMessages !== false} onChange={(event) => setLocalProfile({ ...localProfile, privacySettings: { ...localProfile.privacySettings, acceptMessages: event.target.checked } })} className="mt-0.5 h-4 w-4 accent-blue-600" /><span><b className="block">Mesajları qəbul et</b><span className="mt-1 block text-slate-500">Digər istifadəçilər sizə yeni söhbət başlada bilsin.</span></span></label>
                  <label className="flex items-start gap-3 py-4 text-sm text-slate-700"><input type="checkbox" checked={localProfile.privacySettings?.showPortfolio !== false} onChange={(event) => setLocalProfile({ ...localProfile, privacySettings: { ...localProfile.privacySettings, showPortfolio: event.target.checked } })} className="mt-0.5 h-4 w-4 accent-blue-600" /><span><b className="block">Portfolio layihələrimi profildə göstər</b><span className="mt-1 block text-slate-500">Portfolio işləriniz profilinizə baxanlara görünsün.</span></span></label>
                  <div className="mt-3 flex items-center gap-3 border-t border-slate-100 pt-5"><button type="submit" className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-700">Yadda saxla</button>{saveMessage && <span role="status" className="text-sm font-medium text-emerald-700">{saveMessage}</span>}{saveError && <span role="alert" className="text-sm font-medium text-red-600">{saveError}</span>}</div>
                </form>
              </div>
            )}

            {activeTab === 'change_password' && (
              <div key="change_password" className="fade-tab space-y-6">
                <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-4 rounded-xl flex items-center justify-center gap-2 text-sm font-bold">
                  <Lock className="w-5 h-5 shrink-0" />
                  Şifrə yeniləndikdən sonra hesabdan avtomatik olaraq çıxış olunacaq
                </div>
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <Field label="Mövcud şifrə" required>
                      <input type="password" placeholder="******" className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all outline-none" />
                    </Field>
                    <Field label="Yeni şifrə" required>
                      <input type="password" placeholder="******" className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all outline-none" />
                    </Field>
                    <Field label="Təkrar yeni şifrə" required>
                      <input type="password" placeholder="******" className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all outline-none" />
                    </Field>
                  </div>
                  <div className="flex gap-3">
                    <button className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg hover:shadow-blue-500/30">
                      Şifrəni yenilə
                    </button>
                    <button className="px-6 py-2.5 bg-white border border-slate-300 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-colors">
                      Rədd et
                    </button>
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

function SidebarGroup({ title, children }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-4 border-b border-slate-100 bg-slate-50/50">
        <h3 className="font-bold text-slate-800 text-lg">{title}</h3>
      </div>
      <div className="divide-y divide-slate-100 text-sm font-medium">{children}</div>
    </div>
  );
}

function SidebarButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-4 hover:bg-slate-50 transition-colors border-l-4 ${
        active ? 'border-blue-500 bg-blue-50/30 text-blue-700 font-bold' : 'border-transparent text-slate-500'
      }`}
    >
      {children}
    </button>
  );
}

function Field({ label, required, children }) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-bold text-slate-700 flex items-center gap-1">
        {label}
        {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}

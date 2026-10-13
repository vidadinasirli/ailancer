import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Award, BriefcaseBusiness, Pencil, Plus, Trash2, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../lib/api.js';

const EMPTY_EXPERIENCE = {
  positionTitle: '', companyName: '', location: '', employmentType: 'Tam ştat',
  startDate: '', endDate: '', isCurrent: false, description: '',
};
const EMPTY_CERTIFICATE = { name: '', issuer: '', issueDate: '', credentialId: '', credentialUrl: '', description: '' };

function formatMonth(value) {
  if (!value) return '';
  const date = new Date(`${value.slice(0, 7)}-01T00:00:00`);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('az-AZ', { month: 'short', year: 'numeric' }).format(date);
}

function Field({ label, children }) {
  return <label className="block space-y-1.5"><span className="text-sm font-semibold text-slate-700">{label}</span>{children}</label>;
}

const inputClass = 'w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10';

export default function TecrubeSertifikatlar() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [tab, setTab] = useState(searchParams.get('tab') === 'certificates' ? 'certificates' : 'experience');
  const [experiences, setExperiences] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [experienceForm, setExperienceForm] = useState(EMPTY_EXPERIENCE);
  const [certificateForm, setCertificateForm] = useState(EMPTY_CERTIFICATE);
  const [formOpen, setFormOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/giris');
      return;
    }
    Promise.all([api.getWorkExperiences(), api.getCertificates()])
      .then(([workItems, certificateItems]) => {
        setExperiences(workItems);
        setCertificates(certificateItems);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [user, navigate]);

  useEffect(() => {
    const value = searchParams.get('tab');
    if (value === 'experience' || value === 'certificates') setTab(value);
  }, [searchParams]);

  const changeTab = (value) => {
    setTab(value);
    setSearchParams({ tab: value });
    setError('');
    setFormOpen(false);
    setEditingId(null);
  };

  const openNewForm = () => {
    setEditingId(null);
    if (tab === 'experience') setExperienceForm(EMPTY_EXPERIENCE);
    else setCertificateForm(EMPTY_CERTIFICATE);
    setFormOpen(true);
    setError('');
  };

  const openEditForm = (item) => {
    setEditingId(item.id);
    if (tab === 'experience') setExperienceForm({ ...EMPTY_EXPERIENCE, ...item, isCurrent: Boolean(item.isCurrent) });
    else setCertificateForm({ ...EMPTY_CERTIFICATE, ...item });
    setFormOpen(true);
    setError('');
  };

  const saveExperience = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const saved = editingId
        ? await api.updateWorkExperience(editingId, experienceForm)
        : await api.addWorkExperience(experienceForm);
      setExperiences((items) => editingId ? items.map((item) => item.id === saved.id ? saved : item) : [saved, ...items]);
      setFormOpen(false);
      setEditingId(null);
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  const saveCertificate = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const saved = editingId
        ? await api.updateCertificate(editingId, certificateForm)
        : await api.addCertificate(certificateForm);
      setCertificates((items) => editingId ? items.map((item) => item.id === saved.id ? saved : item) : [saved, ...items]);
      setFormOpen(false);
      setEditingId(null);
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  const deleteItem = async (item) => {
    const noun = tab === 'experience' ? 'iş təcrübəsini' : 'sertifikatı';
    if (!window.confirm(`Bu ${noun} silmək istədiyinizə əminsiniz?`)) return;
    try {
      if (tab === 'experience') {
        await api.deleteWorkExperience(item.id);
        setExperiences((items) => items.filter((entry) => entry.id !== item.id));
      } else {
        await api.deleteCertificate(item.id);
        setCertificates((items) => items.filter((entry) => entry.id !== item.id));
      }
    } catch (err) { setError(err.message); }
  };

  if (!user) return null;
  const items = tab === 'experience' ? experiences : certificates;

  return (
    <div className="ai-credentials-page min-h-screen bg-[#F8FAFC] px-4 pb-16 pt-28">
      <main className="mx-auto max-w-4xl">
        <button type="button" onClick={() => navigate('/profil')} className="mb-5 flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-blue-600"><ArrowLeft className="h-4 w-4" /> Profilə qayıt</button>
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div><p className="text-sm font-bold text-blue-600">PROFİLİNİZ</p><h1 className="mt-1 text-3xl font-black text-slate-900">Təcrübə və sertifikatlar</h1><p className="mt-2 text-sm text-slate-500">Peşəkar tarixçənizi və əldə etdiyiniz sertifikatları idarə edin.</p></div>
          <button type="button" onClick={openNewForm} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700"><Plus className="h-4 w-4" /> {tab === 'experience' ? 'İş təcrübəsi əlavə et' : 'Sertifikat əlavə et'}</button>
        </div>

        <div className="mb-4 flex border-b border-slate-200">
          <button type="button" onClick={() => changeTab('experience')} className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-bold ${tab === 'experience' ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-800'}`}><BriefcaseBusiness className="h-4 w-4" /> İş təcrübəsi</button>
          <button type="button" onClick={() => changeTab('certificates')} className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-bold ${tab === 'certificates' ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-800'}`}><Award className="h-4 w-4" /> Sertifikatlar</button>
        </div>

        {error && <p role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

        {formOpen && <form onSubmit={tab === 'experience' ? saveExperience : saveCertificate} className="mb-5 space-y-4 rounded-xl border border-blue-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center justify-between"><h2 className="font-bold text-slate-900">{editingId ? 'Məlumatı redaktə et' : tab === 'experience' ? 'Yeni iş təcrübəsi' : 'Yeni sertifikat'}</h2><button type="button" onClick={() => setFormOpen(false)} aria-label="Formu bağla" className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100"><X className="h-4 w-4" /></button></div>
          {tab === 'experience' ? <>
            <div className="grid gap-4 sm:grid-cols-2"><Field label="Vəzifə"><input required value={experienceForm.positionTitle} onChange={(event) => setExperienceForm({ ...experienceForm, positionTitle: event.target.value })} className={inputClass} placeholder="Məsələn, Frontend developer" /></Field><Field label="Şirkət"><input required value={experienceForm.companyName} onChange={(event) => setExperienceForm({ ...experienceForm, companyName: event.target.value })} className={inputClass} placeholder="Şirkət və ya təşkilat" /></Field><Field label="İş forması"><select value={experienceForm.employmentType} onChange={(event) => setExperienceForm({ ...experienceForm, employmentType: event.target.value })} className={inputClass}><option>Tam ştat</option><option>Yarım ştat</option><option>Müqaviləli</option><option>Freelance</option><option>Təcrübə proqramı</option></select></Field><Field label="Şəhər / yer"><input value={experienceForm.location} onChange={(event) => setExperienceForm({ ...experienceForm, location: event.target.value })} className={inputClass} placeholder="Bakı, Azərbaycan" /></Field><Field label="Başlama tarixi"><input type="month" value={experienceForm.startDate} onChange={(event) => setExperienceForm({ ...experienceForm, startDate: event.target.value })} className={inputClass} /></Field>{!experienceForm.isCurrent && <Field label="Bitmə tarixi"><input type="month" value={experienceForm.endDate} onChange={(event) => setExperienceForm({ ...experienceForm, endDate: event.target.value })} className={inputClass} /></Field>}</div>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700"><input type="checkbox" checked={experienceForm.isCurrent} onChange={(event) => setExperienceForm({ ...experienceForm, isCurrent: event.target.checked })} className="h-4 w-4 accent-blue-600" /> Hazırda bu vəzifədə çalışıram</label>
            <Field label="Təsvir"><textarea value={experienceForm.description} onChange={(event) => setExperienceForm({ ...experienceForm, description: event.target.value })} className={`${inputClass} min-h-24 resize-y`} placeholder="Vəzifə və əldə etdiyiniz təcrübə haqqında" /></Field>
          </> : <>
            <div className="grid gap-4 sm:grid-cols-2"><Field label="Sertifikatın adı"><input required value={certificateForm.name} onChange={(event) => setCertificateForm({ ...certificateForm, name: event.target.value })} className={inputClass} placeholder="Məsələn, AWS Certified Developer" /></Field><Field label="Təşkilat"><input value={certificateForm.issuer} onChange={(event) => setCertificateForm({ ...certificateForm, issuer: event.target.value })} className={inputClass} placeholder="Sertifikatı verən təşkilat" /></Field><Field label="Verilmə tarixi"><input type="month" value={certificateForm.issueDate} onChange={(event) => setCertificateForm({ ...certificateForm, issueDate: event.target.value })} className={inputClass} /></Field><Field label="Sertifikat ID-si"><input value={certificateForm.credentialId} onChange={(event) => setCertificateForm({ ...certificateForm, credentialId: event.target.value })} className={inputClass} /></Field></div>
            <Field label="Təsdiq linki"><input type="url" value={certificateForm.credentialUrl} onChange={(event) => setCertificateForm({ ...certificateForm, credentialUrl: event.target.value })} className={inputClass} placeholder="https://..." /></Field>
            <Field label="Qeyd"><textarea value={certificateForm.description} onChange={(event) => setCertificateForm({ ...certificateForm, description: event.target.value })} className={`${inputClass} min-h-20 resize-y`} /></Field>
          </>}
          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4"><button type="button" onClick={() => setFormOpen(false)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50">Ləğv et</button><button type="submit" disabled={saving} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-60">{saving ? 'Yadda saxlanılır...' : 'Yadda saxla'}</button></div>
        </form>}

        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          {loading ? <p className="p-8 text-center text-sm text-slate-500">Yüklənir...</p> : items.length ? <div className="divide-y divide-slate-100">
            {items.map((item) => <article key={item.id} className="flex gap-4 p-5 sm:p-6">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">{tab === 'experience' ? <BriefcaseBusiness className="h-5 w-5" /> : <Award className="h-5 w-5" />}</div>
              <div className="min-w-0 flex-1"><h3 className="font-bold text-slate-900">{tab === 'experience' ? item.positionTitle : item.name}</h3><p className="mt-1 text-sm text-slate-700">{tab === 'experience' ? item.companyName : item.issuer}</p><p className="mt-1 text-xs text-slate-500">{tab === 'experience' ? `${formatMonth(item.startDate)} – ${item.isCurrent ? 'Hazırda' : formatMonth(item.endDate)}` : formatMonth(item.issueDate)}{tab === 'experience' && item.location ? ` · ${item.location}` : ''}</p>{item.description && <p className="mt-3 whitespace-pre-wrap text-sm text-slate-600">{item.description}</p>}{tab === 'certificates' && item.credentialUrl && <a href={item.credentialUrl} target="_blank" rel="noreferrer" className="mt-2 inline-block text-sm font-semibold text-blue-700 hover:underline">Sertifikata bax</a>}</div>
              <div className="flex shrink-0 items-start gap-1"><button type="button" onClick={() => openEditForm(item)} title="Redaktə et" aria-label="Redaktə et" className="rounded-md p-2 text-slate-500 hover:bg-blue-50 hover:text-blue-600"><Pencil className="h-4 w-4" /></button><button type="button" onClick={() => deleteItem(item)} title="Sil" aria-label="Sil" className="rounded-md p-2 text-slate-500 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-4 w-4" /></button></div>
            </article>)}
          </div> : <div className="px-6 py-14 text-center"><div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500">{tab === 'experience' ? <BriefcaseBusiness className="h-5 w-5" /> : <Award className="h-5 w-5" />}</div><p className="font-bold text-slate-800">{tab === 'experience' ? 'İş təcrübəsi əlavə edilməyib' : 'Sertifikat əlavə edilməyib'}</p><p className="mt-1 text-sm text-slate-500">Əlavə etdiyiniz məlumatlar profilinizdə görünəcək.</p></div>}
        </section>
      </main>
    </div>
  );
}
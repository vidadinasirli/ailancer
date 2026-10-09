import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ShieldCheck, User, Mail, Lock, ArrowRight, Briefcase, Building2, Loader2, AtSign } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

export default function Giris() {
  const [searchParams] = useSearchParams();
  const [authMode, setAuthMode] = useState(searchParams.get('mode') === 'register' ? 'register' : 'login');
  const [fullName, setFullName] = useState('');
  const [nickname, setNickname] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [customerType, setCustomerType] = useState('employer');
  const [acceptedPolicies, setAcceptedPolicies] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('freelancer');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const isLogin = authMode === 'login';

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      if (isLogin) {
        await login({ email, password });
      } else {
        const accountName = role === 'freelancer'
          ? fullName.trim()
          : customerType === 'company' ? companyName.trim() : fullName.trim();
        await register({
          fullName: accountName,
          nickname: role === 'freelancer' ? nickname.trim() : '',
          companyName: role === 'musteri' && customerType === 'company' ? companyName.trim() : '',
          customerType: role === 'musteri' ? customerType : 'employer',
          email,
          password,
          role,
          acceptedPolicies,
        });
      }
      navigate('/kabinet');
    } catch (err) {
      setError(err.message || 'Xəta baş verdi. Yenidən cəhd edin.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-12 px-4 flex items-center justify-center relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-400/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-500/20 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/4 pointer-events-none"></div>

      <div className="w-full max-w-5xl bg-white/70 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl border border-white overflow-hidden grid grid-cols-1 md:grid-cols-2 relative z-10">

        <div className="bg-slate-900 p-12 text-white relative overflow-hidden hidden md:flex flex-col justify-between">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/30 to-transparent z-0"></div>
          <div className="absolute -top-20 -left-20 w-64 h-64 border border-white/10 rounded-full"></div>
          <div className="absolute top-40 -right-20 w-40 h-40 border border-white/10 rounded-full"></div>

          <div className="relative z-10">
            <h2 className="text-4xl font-black mb-4 leading-tight">
              Gələcəyin <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">İş Dünyasına</span><br/>
              Addım Atın.
            </h2>
            <p className="text-slate-400">Minlərlə peşəkar freelancer və bizneslər sizi gözləyir.</p>
          </div>

          <div className="relative z-10 w-full aspect-square flex items-center justify-center perspective-[1000px]">
             <div className="w-64 h-64 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-3xl shadow-[0_20px_50px_rgba(37,99,235,0.4)] border border-blue-400/30 flex items-center justify-center transform-gpu animate-[spin_15s_linear_infinite] hover:[animation-play-state:paused]">
               <div className="w-[98%] h-[98%] bg-slate-900 rounded-[22px] flex items-center justify-center">
                  <ShieldCheck className="w-24 h-24 text-blue-400 opacity-80" />
               </div>
             </div>
          </div>

          <div className="relative z-10 text-sm text-slate-500">
            © 2026 Freelancer.az
          </div>
        </div>

        <div className="p-10 md:p-16 flex flex-col justify-center">
          <div className="mb-8 text-center md:text-left">
            <h2 className="text-3xl font-extrabold text-slate-900 mb-2">
              {isLogin ? 'Xoş Gəlmisiniz!' : 'Hesab Yarat'}
            </h2>
            <p className="text-slate-500 font-medium">
              {isLogin ? 'Davam etmək üçün hesabınıza daxil olun.' : 'Platformaya qoşulmaq üçün məlumatlarınızı daxil edin.'}
            </p>
          </div>

          <div className="flex bg-slate-100 p-1 rounded-xl mb-6 relative">
            <div
              className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white rounded-lg shadow transition-all duration-300 ease-out ${isLogin ? 'left-1' : 'left-[calc(50%+3px)]'}`}
            ></div>
            <button
              type="button"
              onClick={() => setAuthMode('login')}
              className={`flex-1 py-2.5 text-sm font-bold relative z-10 transition-colors ${isLogin ? 'text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Daxil ol
            </button>
            <button
              type="button"
              onClick={() => setAuthMode('register')}
              className={`flex-1 py-2.5 text-sm font-bold relative z-10 transition-colors ${!isLogin ? 'text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Qeydiyyat
            </button>
          </div>

          {!isLogin && (
            <div className="mb-6">
              <label className="text-sm font-bold text-slate-700 ml-1 mb-2 block">Hesab növü</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole('freelancer')}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all font-bold text-sm ${
                    role === 'freelancer' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-500 hover:border-slate-300'
                  }`}
                >
                  <Briefcase className="w-6 h-6" />
                  Frilanser
                  <span className="font-normal text-xs text-slate-400 text-center">İş axtarıram</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRole('musteri')}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all font-bold text-sm ${
                    role === 'musteri' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-500 hover:border-slate-300'
                  }`}
                >
                  <Building2 className="w-6 h-6" />
                  Sifarişçi
                  <span className="font-normal text-xs text-slate-400 text-center">Sifariş verirəm</span>
                </button>
              </div>
            </div>
          )}

          <form onSubmit={handleAuthSubmit} className="space-y-5">
            {!isLogin && (
              <div className="space-y-1">
                {role === 'musteri' && <div className="space-y-1">
                  <label className="text-sm font-bold text-slate-700 ml-1" htmlFor="customer-type">Hesab növü</label>
                  <select id="customer-type" value={customerType} onChange={(event) => setCustomerType(event.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10">
                    <option value="employer">Fərdi işəgötürən</option>
                    <option value="company">Şirkət</option>
                  </select>
                </div>}
                <label className="text-sm font-bold text-slate-700 ml-1">{role === 'freelancer' ? 'Ad və soyad' : customerType === 'company' ? 'Şirkətin adı' : 'İşəgötürənin adı'}</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    {role === 'freelancer' ? <User className="h-5 w-5 text-slate-400" /> : customerType === 'company' ? <Building2 className="h-5 w-5 text-slate-400" /> : <User className="h-5 w-5 text-slate-400" />}
                  </div>
                  <input
                    type="text"
                    value={role === 'freelancer' ? nickname : customerType === 'company' ? companyName : fullName}
                    onChange={(event) => {
                      if (role === 'freelancer') setNickname(event.target.value);
                      else if (customerType === 'company') setCompanyName(event.target.value);
                      else setFullName(event.target.value);
                    }}
                    className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                    placeholder={role === 'freelancer' ? 'Ad Soyad' : customerType === 'company' ? 'Şirkətin adı' : 'Ad Soyad'}
                    required
                  />
                </div>
                {role === 'freelancer' && <div className="mt-4 space-y-1"><label htmlFor="freelancer-nickname" className="ml-1 text-sm font-bold text-slate-700">Nickname</label><div className="relative"><AtSign className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" /><input id="freelancer-nickname" type="text" value={nickname} onChange={(event) => setNickname(event.target.value)} className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500" placeholder="nickname" required /></div></div>}
              </div>
            )}

            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-700 ml-1">E-poçt ünvanı</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                  placeholder="ali@numune.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-700 ml-1">Şifrə</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                  placeholder="••••••••"
                  minLength={6}
                  required
                />
              </div>
            </div>

            {isLogin && (
              <div className="flex justify-end">
                <button type="button" className="text-sm text-blue-600 font-bold hover:underline">Şifrəni unutmusunuz?</button>
              </div>
            )}

            {!isLogin && <label className="flex items-start gap-3 text-sm text-slate-600">
              <input type="checkbox" checked={acceptedPolicies} onChange={(event) => setAcceptedPolicies(event.target.checked)} required className="mt-0.5 h-4 w-4 shrink-0 accent-blue-600" />
              <span>Məxfilik siyasətini oxudum və <a href="/privacy-policy" target="_blank" rel="noreferrer" className="font-bold text-blue-700 hover:underline">Məxfilik siyasəti</a> və <a href="/terms-of-service" target="_blank" rel="noreferrer" className="font-bold text-blue-700 hover:underline">İstifadə şərtləri</a> ilə razıyam.</span>
            </label>}

            {error && (
              <div className="p-3 rounded-lg text-sm font-medium bg-red-50 text-red-700 border border-red-100">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-blue-600 transition-all shadow-lg hover:shadow-blue-600/30 flex justify-center items-center gap-2 group mt-4 disabled:opacity-60"
            >
              {submitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  {isLogin ? 'Sistemə daxil ol' : 'Hesab yarat'}
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

        </div>
      </div>
    </div>
  );
}

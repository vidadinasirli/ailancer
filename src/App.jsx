import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout.jsx';

import AnaSayfa from './pages/AnaSayfa.jsx';
import Giris from './pages/Giris.jsx';
import Layiheler from './pages/Layiheler.jsx';
import Klub from './pages/Klub.jsx';
import Mesajlar from './pages/Mesajlar.jsx';
import Profil from './pages/Profil.jsx';
import Kabinet from './pages/Kabinet.jsx';
import Destek from './pages/Destek.jsx';
import Tapsiriqlar from './pages/Tapsiriqlar.jsx';
import Haqqimizda from './pages/Haqqimizda.jsx';
import NeceIsleyir from './pages/NeceIsleyir.jsx';
import FAQ from './pages/FAQ.jsx';
import Elaqe from './pages/Elaqe.jsx';
import Sikayet from './pages/Sikayet.jsx';
import PrivacyPolicy from './pages/PrivacyPolicy.jsx';
import TermsOfService from './pages/TermsOfService.jsx';
import CookiePolicy from './pages/CookiePolicy.jsx';
import Bildirimler from './pages/Bildirimler.jsx';
import LayiheDetay from './pages/LayiheDetay.jsx';
import TecrubeSertifikatlar from './pages/TecrubeSertifikatlar.jsx';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<AnaSayfa />} />
        <Route path="/giris" element={<Giris />} />
        <Route path="/layiheler" element={<Layiheler />} />
        <Route path="/layiheler/:id" element={<LayiheDetay />} />
        <Route path="/klub" element={<Klub />} />
        <Route path="/klub/:id" element={<Klub />} />
        <Route path="/mesajlar" element={<Mesajlar />} />
        <Route path="/profil" element={<Profil />} />
        <Route path="/profil/tecrubeler" element={<TecrubeSertifikatlar />} />
        <Route path="/kabinet" element={<Kabinet />} />
        <Route path="/destek" element={<Destek />} />
        <Route path="/tapsiriqlar" element={<Tapsiriqlar />} />
        <Route path="/frilanserler" element={<Tapsiriqlar />} />
        <Route path="/haqqimizda" element={<Haqqimizda />} />
        <Route path="/nece-isleyir" element={<NeceIsleyir />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/elaqe" element={<Elaqe />} />
        <Route path="/sikayet" element={<Sikayet />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/terms-of-service" element={<TermsOfService />} />
        <Route path="/cookie-policy" element={<CookiePolicy />} />
        <Route path="/bildirimler" element={<Bildirimler />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}

function NotFound() {
  return (
    <div className="min-h-screen pt-40 pb-20 px-6 flex flex-col items-center justify-center text-center bg-slate-50">
      <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">404</h1>
      <p className="text-slate-600 max-w-lg mb-8 text-lg">Axtardığınız səhifə tapılmadı.</p>
      <a href="/" className="px-8 py-3 bg-blue-600 text-white rounded-full font-medium hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/30">
        Ana Səhifəyə Qayıt
      </a>
    </div>
  );
}

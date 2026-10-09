import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Instagram, Linkedin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-white text-slate-700 pt-16 pb-10 px-6 mt-auto border-t border-slate-200">
      <div className="max-w-7xl mx-auto">

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-16">

          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-6 cursor-pointer w-fit">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-xl">
                F
              </div>
              <span className="text-2xl font-black tracking-tight text-slate-900">
                Freelancer<span className="text-blue-600">.az</span>
              </span>
            </Link>
            <p className="text-slate-600 mb-6 max-w-sm leading-relaxed">
              Azərbaycanın ən böyük və təhlükəsiz freelancer platforması. İstedadları və biznesləri bir araya gətiririk.
            </p>
            <div className="flex gap-4">
              {[
                { name: 'Instagram', icon: Instagram },
                { name: 'Facebook', icon: Facebook },
                { name: 'LinkedIn', icon: Linkedin }
              ].map((social) => (
                <a key={social.name} href="#" onClick={(event) => event.preventDefault()} className="w-10 h-10 rounded-full border border-slate-300 bg-white flex items-center justify-center hover:bg-blue-50 hover:border-blue-400 hover:text-blue-600 transition-all" title={social.name} aria-label={social.name}>
                  <social.icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-slate-900 font-bold mb-6 tracking-wide">Platform</h4>
            <ul className="space-y-4 font-medium">
              <li><Link to="/frilanserler" className="text-slate-600 hover:text-blue-600 transition-colors">Freelancer tap</Link></li>
              <li><Link to="/tapsiriqlar" className="text-slate-600 hover:text-blue-600 transition-colors">İş elanları</Link></li>
              <li><Link to="/layiheler" className="text-slate-600 hover:text-blue-600 transition-colors">Layihələr</Link></li>
              <li><Link to="/klub" className="text-slate-600 hover:text-blue-600 transition-colors">Klub</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-slate-900 font-bold mb-6 tracking-wide">Məlumat</h4>
            <ul className="space-y-4 font-medium">
              <li><Link to="/haqqimizda" className="text-slate-600 hover:text-blue-600 transition-colors">Haqqımızda</Link></li>
              <li><Link to="/nece-isleyir" className="text-slate-600 hover:text-blue-600 transition-colors">Necə işləyir?</Link></li>
              <li><Link to="/faq" className="text-slate-600 hover:text-blue-600 transition-colors">FAQ</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-slate-900 font-bold mb-6 tracking-wide">Dəstək</h4>
            <ul className="space-y-4 font-medium">
              <li><Link to="/elaqe" className="text-slate-600 hover:text-blue-600 transition-colors">Əlaqə</Link></li>
              <li><Link to="/sikayet" className="text-slate-600 hover:text-blue-600 transition-colors">Şikayət bildir</Link></li>
              <li><Link to="/destek" className="text-slate-600 hover:text-blue-600 transition-colors">Dəstək</Link></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4 text-sm font-medium text-slate-500">
          <p>© 2026 Freelancer.az. Bütün hüquqlar qorunur.</p>
          <div className="flex flex-wrap gap-6 justify-center">
            <Link to="/privacy-policy" className="hover:text-blue-600 transition-colors">Məxfilik Siyasəti</Link>
            <Link to="/terms-of-service" className="hover:text-blue-600 transition-colors">İstifadə Şərtləri</Link>
            <Link to="/cookie-policy" className="hover:text-blue-600 transition-colors">Kuki Siyasəti</Link>
          </div>
        </div>

      </div>
    </footer>
  );
}

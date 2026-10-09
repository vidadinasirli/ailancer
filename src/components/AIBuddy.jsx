import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Bot, Sparkles, X } from 'lucide-react';
import './AIBuddy.css';

export default function AIBuddy() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { pathname } = useLocation();

  function openAssistant() {
    setOpen(false);
    if (pathname !== '/') navigate('/');
    window.setTimeout(() => {
      const chat = document.getElementById('ai-chat');
      chat?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      chat?.querySelector('textarea')?.focus({ preventScroll: true });
    }, pathname === '/' ? 0 : 250);
  }

  return (
    <aside className="ai-buddy" aria-label="Baman AI köməkçisi">
      {open && (
        <section className="ai-buddy-card" aria-labelledby="ai-buddy-title">
          <button type="button" className="ai-buddy-close" onClick={() => setOpen(false)} aria-label="Pəncərəni bağla">
            <X size={17} />
          </button>
          <span className="ai-buddy-card-icon"><Sparkles size={18} /></span>
          <h2 id="ai-buddy-title">Salam! Mən Baman</h2>
          <p>Freelancer tapmaq, portfolio hazırlamaq və layihəni dəqiqləşdirmək üçün Gemini köməkçisini aç.</p>
          <button type="button" className="ai-buddy-open" onClick={openAssistant}>
            <Bot size={16} /> Gemini ilə danış
          </button>
        </section>
      )}
      <button
        type="button"
        className="ai-buddy-button ai-buddy-wander"
        onClick={() => setOpen((value) => !value)}
        aria-label={open ? 'Baman AI köməkçisini bağla' : 'Baman AI köməkçisini aç'}
        aria-expanded={open}
      >
        <span className="ai-buddy-halo" />
        <span className="ai-buddy-body">
          <span className="ai-buddy-antenna" />
          <span className="ai-buddy-eye ai-buddy-eye-left" />
          <span className="ai-buddy-eye ai-buddy-eye-right" />
          <span className="ai-buddy-mouth" />
          <span className="ai-buddy-cheek ai-buddy-cheek-left" />
          <span className="ai-buddy-cheek ai-buddy-cheek-right" />
        </span>
        <span className="ai-buddy-spark ai-buddy-spark-one">✦</span>
        <span className="ai-buddy-spark ai-buddy-spark-two">✧</span>
      </button>
    </aside>
  );
}

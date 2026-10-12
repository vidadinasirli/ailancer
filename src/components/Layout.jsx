import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar.jsx';
import Footer from './Footer.jsx';
import ScrollToTop from './ScrollToTop.jsx';
import AIBuddy from './AIBuddy.jsx';

export default function Layout() {
  const { pathname } = useLocation();
  return (
    <div className="ailancer-shell min-h-screen bg-slate-50 text-slate-900 selection:bg-blue-200 selection:text-blue-900 flex flex-col">
      <ScrollToTop />
      <Navbar />
      <main className="flex-grow">
        <Outlet />
      </main>
      {pathname !== '/mesajlar' && <Footer />}
      {pathname !== '/' && pathname !== '/mesajlar' && <AIBuddy />}
    </div>
  );
}

import React from 'react';
import { Link } from 'react-router-dom';

export default function UserProfileLink({ userId, name, avatarUrl, compact = false }) {
  const initials = String(name || '?').trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
  const content = (
    <>
      <span className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-blue-100 font-bold text-blue-700 ${compact ? 'h-7 w-7 text-[10px]' : 'h-9 w-9 text-xs'}`}>
        {avatarUrl ? <img src={avatarUrl} alt="" className="h-full w-full object-cover" /> : initials}
      </span>
      <span className="min-w-0 truncate font-semibold text-slate-800">{name || 'İstifadəçi'}</span>
    </>
  );

  if (!userId) return <span className="inline-flex min-w-0 items-center gap-2">{content}</span>;
  return <Link to={`/profil?userId=${userId}`} className="inline-flex min-w-0 items-center gap-2 hover:text-blue-700">{content}</Link>;
}
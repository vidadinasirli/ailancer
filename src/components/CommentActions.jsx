import React from 'react';
import { Link } from 'react-router-dom';
import { Flag, Pencil, Trash2 } from 'lucide-react';

export default function CommentActions({ isAuthor, reportUrl, onEdit, onDelete }) {
  return (
    <div className="flex items-center gap-2">
      {isAuthor && (
        <>
          <button type="button" onClick={onEdit} title="Rəyi redaktə et" aria-label="Rəyi redaktə et" className="rounded-md p-1.5 text-slate-400 hover:bg-blue-50 hover:text-blue-600">
            <Pencil className="h-4 w-4" />
          </button>
          <button type="button" onClick={onDelete} title="Rəyi sil" aria-label="Rəyi sil" className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600">
            <Trash2 className="h-4 w-4" />
          </button>
        </>
      )}
      <Link to={reportUrl} title="Rəyi şikayət et" aria-label="Rəyi şikayət et" className="rounded-md p-1.5 text-slate-400 hover:bg-orange-50 hover:text-orange-600">
        <Flag className="h-4 w-4" />
      </Link>
    </div>
  );
}
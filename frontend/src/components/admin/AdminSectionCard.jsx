import React from 'react';
import { Link } from 'react-router-dom';

export default function AdminSectionCard({
  to,
  title,
  description,
  Icon,
  themeStyle,
}) {
  const cardClass = themeStyle?.card || 'border-slate-200/80 bg-slate-50 hover:bg-slate-100';
  const iconWrapClass = themeStyle?.iconWrap || 'bg-slate-100';
  const iconClass = themeStyle?.icon || 'text-slate-600';
  const titleClass = themeStyle?.title || 'text-slate-800';
  const descriptionClass = themeStyle?.description || 'text-slate-600';
  const actionClass = themeStyle?.action || 'text-slate-700 group-hover:text-slate-800';

  return (
    <Link
      to={to}
      className={`group block overflow-hidden rounded-2xl border p-5 shadow-sm transition-all duration-300 hover:scale-105 hover:shadow-xl ${cardClass}`}
    >
      <div className="relative">
        <div className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl ${iconWrapClass} ${iconClass} shadow-sm`}>
          <Icon className="h-5 w-5" strokeWidth={1.8} />
        </div>

        <h3 className={`text-base font-semibold ${titleClass}`}>{title}</h3>
        {description && <p className={`mt-1.5 text-sm leading-relaxed ${descriptionClass}`}>{description}</p>}

        <div className={`mt-4 inline-flex items-center gap-1.5 text-sm font-medium transition-colors duration-300 ${actionClass}`}>
          Open section
          <svg className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </Link>
  );
}
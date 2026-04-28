import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PublicLayout from '../components/public/PublicLayout';

export default function NotFoundPage() {
  const { t } = useTranslation();

  return (
    <PublicLayout>
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="text-center">
          {/* Big 404 */}
          <h1 className="text-9xl font-bold text-brand select-none">404</h1>

          <h2 className="text-3xl font-semibold text-ink mt-4 mb-6">{t('notFound.title')}</h2>

          <p className="text-ink-secondary mb-8 max-w-md mx-auto">
            {t('notFound.description')}
          </p>

          <Link
            to="/home"
            className="inline-flex items-center px-4 py-2.5 bg-brand text-white rounded-md font-medium text-sm hover:bg-brand-hover transition-all duration-150 shadow-soft hover:shadow-card focus:ring-2 focus:ring-brand/30 focus:ring-offset-2"
          >
            <svg className="w-5 h-5 mr-2 rtl:mr-0 rtl:ml-2" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
            </svg>
            {t('common.goHome')}
          </Link>
        </div>
      </div>
    </PublicLayout>
  );
}

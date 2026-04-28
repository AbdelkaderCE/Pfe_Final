import React from 'react';
import { useTranslation } from 'react-i18next';

export default function DataTables({ data }) {
  const { t } = useTranslation();

  return (
    <div className="mt-8 space-y-8">
      
      {/* 1. Enseignements Table */}
      <div className="bg-surface rounded-lg shadow-card border border-edge overflow-hidden">
        <div className="p-6 border-b border-edge">
          <h2 className="text-xl font-bold text-ink">
            {t('tables.enseignements')}
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left rtl:text-right text-ink-secondary">
            <thead className="text-xs text-ink-muted uppercase bg-surface-200/40 dark:bg-surface-300/30">
              <tr>
                <th className="px-6 py-4">{t('tables.columns.module')}</th>
                <th className="px-6 py-4">{t('tables.columns.promo')}</th>
                <th className="px-6 py-4">{t('tables.columns.type')}</th>
                <th className="px-6 py-4">{t('tables.columns.year')}</th>
              </tr>
            </thead>
            <tbody>
              {data?.enseignements?.length > 0 ? (
                data.enseignements.map((enseign, idx) => (
                  <tr key={idx} className="bg-surface border-b border-edge hover:bg-surface-100/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-ink whitespace-nowrap">
                      {enseign.module?.nom || `Module #${enseign.id}`} <span className="text-slate-400">({enseign.module?.code || 'N/A'})</span>
                    </td>
                    <td className="px-6 py-4">{enseign.promo?.nom || 'Promo non assignee'}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 text-xs font-semibold rounded-md bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300 uppercase">
                        {enseign.type || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4">{enseign.annee_universitaire}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="px-6 py-8 text-center text-slate-500">
                    No assignments found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 2. PFE Sujets Table */}
      <div className="bg-surface rounded-lg shadow-card border border-edge overflow-hidden">
        <div className="p-6 border-b border-edge">
          <h2 className="text-xl font-bold text-ink">
            {t('tables.pfe')}
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left rtl:text-right text-ink-secondary">
            <thead className="text-xs text-ink-muted uppercase bg-surface-200/40 dark:bg-surface-300/30">
              <tr>
                <th className="px-6 py-4">{t('tables.columns.title')}</th>
                <th className="px-6 py-4">{t('tables.columns.promo')}</th>
                <th className="px-6 py-4">{t('tables.columns.status')}</th>
                <th className="px-6 py-4">{t('tables.columns.year')}</th>
              </tr>
            </thead>
            <tbody>
              {data?.pfeSujets?.length > 0 ? (
                data.pfeSujets.map((pfe, idx) => {
                  const statusInfo = {
                    propose: 'bg-warning/10 text-warning',
                    valide: 'bg-success/10 text-success',
                    affecte: 'bg-brand/10 text-brand',
                    termine: 'bg-surface-200/40 text-ink'
                  };
                  const sColor = statusInfo[pfe.status] || 'bg-surface-200/40 text-ink-secondary';

                  return (
                    <tr key={idx} className="bg-surface border-b border-edge hover:bg-surface-100/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-ink max-w-xs truncate">
                        {pfe.titre}
                      </td>
                      <td className="px-6 py-4 text-ink-secondary">{pfe.promo?.nom}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${sColor}`}>
                          {t(`tables.status.${pfe.status || 'propose'}`)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-ink-tertiary">{pfe.annee_universitaire}</td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan="4" className="px-6 py-8 text-center text-ink-muted">
                    No PFE Subjects found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}


/*
  TeamSection — PFE project teams for the About page.
  All 11 groups, group leaders, and supervisor.
  Uses design-system tokens, inline SVG icons (no lucide-react per rules.md).
*/

import React from 'react';

/* Inline SVG icons (1.5px stroke, consistent with rules.md) */
const IconUser = ({ className = 'w-4 h-4' }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0" />
  </svg>
);

const IconCrown = ({ className = 'w-5 h-5' }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 17.25V21h18v-3.75M12 3l4.5 6L21 6l-1.5 11.25H4.5L3 6l4.5 3L12 3z" />
  </svg>
);

const groups = [
  { number: 1, name: 'Groupe 1', module: 'Authentification', members: ['Ghoulam Mohamed Saïd', 'Chelig Mohamed Amine', 'Reddas Belkacem Chabani'] },
  { number: 2, name: 'Groupe 2', module: 'Conseil Disciplinaire', members: ['Ounes Abdelfattah Tahar', 'Belgacem Abdelkader Youcef', 'Ouadah Abdelkader'] },
  { number: 3, name: 'Groupe 3', module: 'Gestion des PFEs', members: ['DERRADJI Safaa', 'CHERRATI Noura'] },
  { number: 4, name: 'Groupe 4', module: 'Spécialités et affectation des étudiants', members: ['Sadki Zineb', 'Nait Youcef Melina', 'Ya Asma'] },
  { number: 5, name: 'Groupe 5', module: 'Réclamation et justifications', members: ['Hafsa Hayat', 'Hamani Ikram', 'Harbane Batoul'] },
  { number: 6, name: 'Groupe 6', module: 'Documents', members: ['Fatmi Douâa Nour El Yakin', 'Hella Meriem', 'Djebbour Razika'] },
  { number: 7, name: 'Groupe 7', module: 'Actualités', members: ['Tlidji Saad', 'Yahia Mohamed Dhiaa Eddine'] },
  { number: 8, name: 'Groupe 8', module: 'Template Frontend/Backend', members: ['Djellil Abdelkader Charef Eddine', 'Gaid Oussama', 'Derakaoui Mohamed'] },
  { number: 9, name: 'Groupe 9', module: 'Tableau de bord enseignant', members: ['Lhacen Noudjoud Ferial', 'Hssain Khouloud'] },
  { number: 10, name: 'Groupe 10', module: 'Tableau de bord étudiant', members: ['Timezghine Narimene', 'Ouadah Nourhane', 'Benali Ammar Sonia'] },
  { number: 11, name: 'Groupe 11', module: 'Intelligence artificielle', members: ['Hachemi Ahmed Zine Eddine', 'Lezar Abdelkader Yacine', 'Djaboure Mohamed'] },
];

const groupLeaders = ['Ghoulam Mohamed Said', 'Gaid Oussama'];

const TeamSection = () => {
  return (
    <section className="py-20 bg-surface-200">
      <div className="container-custom">
        {/* Header */}
        <div className="text-center mb-14">
          <p className="text-xs font-medium uppercase tracking-widest text-ink-tertiary mb-4">
            Ibn Khaldoun University — Tiaret
          </p>
          <h2 className="text-xl font-bold text-ink tracking-tight mb-3 md:text-2xl">
            Project Teams
          </h2>
          <p className="text-sm text-ink-secondary max-w-3xl mx-auto">
            Meet the students building the University Platform modules
          </p>
        </div>

        {/* Group Leaders */}
        <div className="max-w-3xl mx-auto mb-12">
          <div className="bg-surface border border-edge rounded-lg p-6 shadow-card text-center">
            <div className="flex items-center justify-center gap-2 mb-3 text-ink-secondary">
              <IconCrown />
              <span className="text-xs font-semibold uppercase tracking-widest">Group Leaders</span>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              {groupLeaders.map((leader, i) => (
                <div
                  key={i}
                  className="px-4 py-2 rounded-full bg-brand-light text-brand font-medium text-sm"
                >
                  {leader}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Groups grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {groups.map((group) => (
            <div
              key={group.number}
              className="bg-surface rounded-lg shadow-card overflow-hidden border border-edge hover:shadow-soft transition-all duration-200"
            >
              <div className="p-6 border-b border-edge bg-surface-200">
                <div className="flex items-center justify-between mb-2 text-ink-secondary">
                  <span className="text-base font-bold text-ink">#{group.number}</span>
                </div>
                <h3 className="text-base font-semibold text-ink">{group.name}</h3>
                <p className="text-xs text-ink-tertiary mt-1">{group.module}</p>
              </div>

              <div className="p-6">
                <h4 className="text-xs font-medium text-ink-tertiary uppercase tracking-wider mb-4">
                  Members ({group.members.length})
                </h4>
                <ul className="space-y-3">
                  {group.members.map((member, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <IconUser className="w-4 h-4 text-ink-muted mt-0.5 shrink-0" />
                      <span className="text-sm text-ink">{member}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="px-6 pb-6">
                <div className="pt-4 border-t border-edge">
                  <span className="text-xs text-ink-muted">
                    Module: {group.module}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Supervisor */}
        <div className="mt-16 text-center">
          <div className="inline-block bg-surface shadow-card border border-edge rounded-lg p-8 max-w-2xl">
            <h3 className="text-base font-bold text-ink mb-2">Project Supervisor</h3>
            <p className="text-sm text-ink-secondary font-medium">Dr. Abdelkader BOUGUESSA – MCB</p>
            <p className="text-xs text-ink-tertiary mt-2">
              Université Ibn Khaldoun – Tiaret / Faculté MI / Département Informatique
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TeamSection;

import React from 'react';

export default function SettingsTabs({ tabs, activeTab, onChange, className = '' }) {
  return (
    <nav
      role="tablist"
      aria-label="Site settings sections"
      className={`flex flex-col gap-1 ${className}`}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            role="tab"
            type="button"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={`group flex items-start gap-3 rounded-xl border px-3 py-2.5 text-left transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-brand/30 ${
              isActive
                ? 'border-brand/30 bg-brand/10 text-brand shadow-sm'
                : 'border-transparent text-ink-secondary hover:border-edge hover:bg-surface-200 hover:text-ink'
            }`}
          >
            {Icon ? (
              <span
                className={`mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors ${
                  isActive
                    ? 'bg-brand text-white'
                    : 'bg-surface-200 text-ink-tertiary group-hover:bg-surface-300 group-hover:text-ink-secondary'
                }`}
              >
                <Icon className="h-4 w-4" strokeWidth={2} />
              </span>
            ) : null}
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold">{tab.label}</span>
              {tab.description ? (
                <span
                  className={`mt-0.5 block text-xs ${
                    isActive ? 'text-brand/80' : 'text-ink-tertiary'
                  }`}
                >
                  {tab.description}
                </span>
              ) : null}
            </span>
          </button>
        );
      })}
    </nav>
  );
}

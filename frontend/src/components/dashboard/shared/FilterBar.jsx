import React from 'react';

const SelectField = ({ label, value, onChange, options, placeholder }) => (
  <div className="flex flex-col gap-1 min-w-[160px]">
    <label className="text-xs font-medium text-ink-secondary">{label}</label>
    <select
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value || '')}
      className="px-3 py-2 text-sm bg-control-bg border border-control-border rounded-md text-ink focus:ring-2 focus:ring-brand/30 focus:border-brand"
    >
      <option value="">{placeholder}</option>
      {options.map((option) => (
        <option key={option.id} value={String(option.id)}>
          {option.label}
        </option>
      ))}
    </select>
  </div>
);

export default function FilterBar({
  groupes = [],
  promos = [],
  modules = [],
  searchValue = '',
  selected = {},
  onChange,
  onReset,
  onSearchChange,
  showSearch = true,
}) {
  const update = (key, value) => onChange?.({ ...selected, [key]: value });
  const hasActiveFilter =
    Boolean(searchValue) ||
    Boolean(selected.groupeId) ||
    Boolean(selected.promoId) ||
    Boolean(selected.moduleId);

  return (
    <div className="bg-surface rounded-lg border border-edge p-4 flex flex-wrap items-end gap-3">
      {showSearch && (
        <div className="flex flex-col gap-1 flex-1 min-w-[200px]">
          <label className="text-xs font-medium text-ink-secondary">Search</label>
          <input
            type="search"
            value={searchValue}
            onChange={(e) => onSearchChange?.(e.target.value)}
            placeholder="Name, matricule or email…"
            className="px-3 py-2 text-sm bg-control-bg border border-control-border rounded-md text-ink placeholder:text-ink-muted focus:ring-2 focus:ring-brand/30 focus:border-brand"
          />
        </div>
      )}

      {groupes.length > 0 && (
        <SelectField
          label="Groupe"
          value={selected.groupeId}
          onChange={(value) => update('groupeId', value)}
          options={groupes}
          placeholder="All groupes"
        />
      )}

      {promos.length > 0 && (
        <SelectField
          label="Promo"
          value={selected.promoId}
          onChange={(value) => update('promoId', value)}
          options={promos}
          placeholder="All promos"
        />
      )}

      {modules.length > 0 && (
        <SelectField
          label="Course"
          value={selected.moduleId}
          onChange={(value) => update('moduleId', value)}
          options={modules}
          placeholder="All courses"
        />
      )}

      <button
        type="button"
        onClick={onReset}
        disabled={!hasActiveFilter}
        className="px-3 py-2 text-sm font-medium text-ink-secondary border border-edge rounded-md hover:bg-canvas disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        Reset
      </button>
    </div>
  );
}

import React from "react";

export default function DataTable({
  columns,
  rows,
  loading = false,
  keyField = "id",
  emptyMessage = "No records found.",
  className = "",
}) {
  return (
    <div className={`rounded-2xl border border-edge bg-surface shadow-card ${className}`}>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="border-b border-edge-subtle bg-surface-200/60">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-tertiary ${column.headerClassName || ""}`}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-edge-subtle">
            {loading && (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center">
                  <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-edge-strong border-t-brand" />
                  <p className="mt-3 text-sm text-ink-tertiary">Loading...</p>
                </td>
              </tr>
            )}

            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="px-4 py-10 text-center text-sm text-ink-tertiary">
                  {emptyMessage}
                </td>
              </tr>
            )}

            {!loading && rows.map((row) => (
              <tr key={row[keyField]} className="align-top hover:bg-surface-200/40">
                {columns.map((column) => (
                  <td key={`${row[keyField]}-${column.key}`} className={`px-4 py-3 text-ink-secondary ${column.cellClassName || ""}`}>
                    {typeof column.render === "function"
                      ? column.render(row)
                      : row[column.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

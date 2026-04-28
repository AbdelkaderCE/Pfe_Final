import React from "react";

function getPageNumbers(currentPage, totalPages) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages = new Set([1, totalPages, currentPage]);
  if (currentPage - 1 > 1) pages.add(currentPage - 1);
  if (currentPage + 1 < totalPages) pages.add(currentPage + 1);

  return Array.from(pages).sort((a, b) => a - b);
}

export default function Pagination({ page, totalPages, onPageChange }) {
  if (!totalPages || totalPages <= 1) {
    return null;
  }

  const pages = getPageNumbers(page, totalPages);

  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-edge bg-surface px-4 py-3">
      <p className="text-xs text-ink-tertiary">
        Page {page} of {totalPages}
      </p>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page <= 1}
          className="rounded-md border border-edge px-3 py-1.5 text-sm text-ink-secondary hover:bg-surface-200 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Previous
        </button>

        {pages.map((pageNumber, index) => {
          const prev = pages[index - 1];
          const showEllipsis = prev && pageNumber - prev > 1;

          return (
            <React.Fragment key={pageNumber}>
              {showEllipsis ? <span className="px-1 text-ink-tertiary">...</span> : null}
              <button
                type="button"
                onClick={() => onPageChange(pageNumber)}
                className={`rounded-md px-3 py-1.5 text-sm ${
                  pageNumber === page
                    ? "bg-brand text-white"
                    : "border border-edge text-ink-secondary hover:bg-surface-200"
                }`}
              >
                {pageNumber}
              </button>
            </React.Fragment>
          );
        })}

        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages}
          className="rounded-md border border-edge px-3 py-1.5 text-sm text-ink-secondary hover:bg-surface-200 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}

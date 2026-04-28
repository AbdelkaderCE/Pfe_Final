import React, { useRef, useState } from 'react';
import { ImagePlus, Trash2, UploadCloud, RefreshCw } from 'lucide-react';

const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

function formatBytes(bytes) {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB'];
  const i = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  return `${(bytes / 1024 ** i).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

export default function MediaUploader({
  title,
  description,
  currentImageUrl,
  selectedFile,
  onSelectFile,
  onUpload,
  onClear,
  uploading = false,
  disabled = false,
}) {
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const [validationError, setValidationError] = useState('');

  const validate = (file) => {
    if (!file) return null;
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return 'Unsupported file type. Use JPG, PNG, WEBP, or GIF.';
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return `File is too large (${formatBytes(file.size)}). Max ${formatBytes(MAX_FILE_SIZE_BYTES)}.`;
    }
    return null;
  };

  const handleFile = (file) => {
    setValidationError('');
    if (!file) {
      onSelectFile(null);
      return;
    }
    const error = validate(file);
    if (error) {
      setValidationError(error);
      onSelectFile(null);
      return;
    }
    onSelectFile(file);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setDragOver(false);
    if (disabled || uploading) return;
    const file = event.dataTransfer.files?.[0];
    handleFile(file);
  };

  const previewUrl = selectedFile
    ? URL.createObjectURL(selectedFile)
    : currentImageUrl || '';

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-edge bg-canvas/40 p-4 transition-colors hover:border-brand/30">
      <div>
        <p className="text-sm font-semibold text-ink">{title}</p>
        {description ? (
          <p className="mt-0.5 text-xs text-ink-tertiary">{description}</p>
        ) : null}
      </div>

      <div
        onDragOver={(event) => {
          event.preventDefault();
          if (!disabled && !uploading) setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`relative flex h-40 items-center justify-center overflow-hidden rounded-xl border-2 border-dashed transition-colors ${
          dragOver
            ? 'border-brand bg-brand/5'
            : 'border-edge-strong bg-surface-200/60'
        }`}
      >
        {previewUrl ? (
          <>
            <img
              src={previewUrl}
              alt={title}
              className="h-full w-full object-cover"
            />
            {selectedFile ? (
              <span className="absolute right-2 top-2 rounded-md bg-warning/90 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white shadow-sm">
                Pending
              </span>
            ) : null}
          </>
        ) : (
          <div className="flex flex-col items-center gap-1.5 text-ink-tertiary">
            <ImagePlus className="h-8 w-8" strokeWidth={1.5} />
            <span className="text-xs">Drag an image here, or browse below</span>
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(',')}
        className="hidden"
        onChange={(event) => handleFile(event.target.files?.[0] || null)}
        disabled={disabled || uploading}
      />

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={disabled || uploading}
          className="inline-flex items-center gap-1.5 rounded-md border border-edge bg-surface px-3 py-1.5 text-xs font-medium text-ink-secondary transition-colors hover:border-brand/40 hover:bg-brand/5 hover:text-brand disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw className="h-3.5 w-3.5" strokeWidth={2} />
          {currentImageUrl || selectedFile ? 'Replace' : 'Browse'}
        </button>

        {currentImageUrl && !selectedFile && onClear ? (
          <button
            type="button"
            onClick={onClear}
            disabled={disabled || uploading}
            className="inline-flex items-center gap-1.5 rounded-md border border-edge bg-surface px-3 py-1.5 text-xs font-medium text-ink-secondary transition-colors hover:border-danger/40 hover:bg-danger/5 hover:text-danger disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
            Remove
          </button>
        ) : null}

        <div className="ml-auto flex items-center gap-2">
          {selectedFile ? (
            <span className="text-[11px] text-ink-tertiary">
              {formatBytes(selectedFile.size)}
            </span>
          ) : null}
          <button
            type="button"
            onClick={onUpload}
            disabled={!selectedFile || uploading || disabled}
            className="inline-flex items-center gap-1.5 rounded-md bg-brand px-3 py-1.5 text-xs font-semibold text-white transition-all hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            <UploadCloud className="h-3.5 w-3.5" strokeWidth={2} />
            {uploading ? 'Uploading…' : 'Upload'}
          </button>
        </div>
      </div>

      {validationError ? (
        <p className="text-xs text-danger">{validationError}</p>
      ) : (
        <p className="text-[11px] text-ink-tertiary">
          PNG, JPG, WEBP, GIF · up to {formatBytes(MAX_FILE_SIZE_BYTES)}
        </p>
      )}
    </div>
  );
}

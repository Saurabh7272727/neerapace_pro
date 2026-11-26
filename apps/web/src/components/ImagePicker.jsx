import { useEffect, useState } from "react";
import { IMAGE_ACCEPT, imageFileError } from "../lib/imageUpload.js";

export function ImagePicker({ label = "Choose image", file, onFileChange, currentUrl = "", name = "file", compact = false, disabled = false, previewOnly = false }) {
  const [previewUrl, setPreviewUrl] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!file) {
      setPreviewUrl("");
      return undefined;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  function selectFile(event) {
    const selected = event.target.files?.[0] || null;
    const validationError = selected ? imageFileError(selected) : "";
    setError(validationError);
    onFileChange(validationError ? null : selected);
    event.target.value = "";
  }

  const visibleImage = previewUrl || (!file && currentUrl) || "";

  return (
    <div className={`rounded-2xl border border-dashed border-line bg-cream/50 ${compact ? "p-2" : "p-4"}`}>
      <div className="flex items-center gap-3">
        {visibleImage ? (
          <img src={visibleImage} alt={file ? "Selected image preview" : "Current image"} className={`${compact ? "h-14 w-14" : "h-20 w-20"} shrink-0 rounded-xl bg-white object-cover`} />
        ) : (
          <div className={`${compact ? "h-14 w-14" : "h-20 w-20"} grid shrink-0 place-items-center rounded-xl bg-white text-[10px] font-semibold tracking-wide text-ink/30`} aria-hidden="true">PHOTO</div>
        )}
        <div className="min-w-0 flex-1">
          {!previewOnly ? <label className="inline-flex cursor-pointer items-center rounded-full border border-line bg-white px-3 py-2 text-sm font-medium text-pitch hover:bg-cream">
            {label}
            <input className="sr-only" type="file" name={name} accept={IMAGE_ACCEPT} disabled={disabled} onChange={selectFile} />
          </label> : null}
          {!previewOnly ? <p className="mt-1 text-xs text-ink/55">JPG, PNG, WebP or GIF | up to 10 MB</p> : null}
          {file ? <p className="mt-1 truncate text-xs text-ink/70">{file.name}</p> : null}
        </div>
        {file ? <button type="button" disabled={disabled} className="shrink-0 text-xs font-medium text-clay disabled:opacity-50" onClick={() => { onFileChange(null); setError(""); }}>Remove</button> : null}
      </div>
      {error ? <p className="mt-2 text-sm text-clay" role="alert">{error}</p> : null}
    </div>
  );
}

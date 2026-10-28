import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';

interface ImageUploaderProps { onSelect: (file: File) => void; error?: string | null; hidden?: boolean; }
export interface ImageUploaderHandle { open: () => void; }

export const ImageUploader = forwardRef<ImageUploaderHandle, ImageUploaderProps>(function ImageUploader({ onSelect, error, hidden = false }, ref) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const inputId = 'style-image-input';
  const errorId = 'image-upload-error';
  const selectFirstFile = (files: FileList | null) => { const file = files?.[0]; if (file) onSelect(file); };
  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => { selectFirstFile(event.target.files); event.target.value = ''; };
  useImperativeHandle(ref, () => ({ open: () => inputRef.current?.click() }));
  if (hidden) return <input ref={inputRef} className="sr-only" id={inputId} aria-label="Reemplazar fotografía" type="file" accept="image/jpeg,image/png,image/webp" onChange={handleInputChange} />;
  return (
    <div aria-describedby={error ? errorId : undefined}
      onDragOver={(event) => { event.preventDefault(); setIsDragging(true); }}
      onDragLeave={(event) => { event.preventDefault(); setIsDragging(false); }}
      onDrop={(event) => { event.preventDefault(); setIsDragging(false); selectFirstFile(event.dataTransfer.files); }}
      className={`group flex min-h-52 w-full cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed px-6 text-center transition-all duration-300 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-terracotta ${isDragging ? 'border-terracotta bg-peach/60 shadow-[0_0_0_4px_rgba(166,93,66,0.14)]' : 'border-terracotta/50 bg-peach/20 hover:border-terracotta hover:bg-peach/40'}`}>
      <span className="mb-3 grid size-12 place-items-center rounded-2xl bg-white text-2xl text-terracotta shadow-sm transition-transform duration-300 group-hover:-translate-y-1">↑</span>
      <span className="font-semibold text-ink">Selecciona o arrastra una fotografía</span>
      <span className="mt-1 text-sm text-stone-500">JPG, PNG o WEBP · máximo 5 MB</span>
      <button type="button" aria-controls={inputId} className="mt-4 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-terracotta shadow-sm transition-colors hover:bg-cream focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta" onClick={(event) => { event.stopPropagation(); inputRef.current?.click(); }}>Explorar archivos</button>
      <input ref={inputRef} className="sr-only" id={inputId} aria-label="Seleccionar fotografía" type="file" accept="image/jpeg,image/png,image/webp" onChange={handleInputChange} />
      {error && <p id={errorId} role="alert" className="mt-3 text-sm font-medium text-red-700">{error}</p>}
    </div>
  );
});

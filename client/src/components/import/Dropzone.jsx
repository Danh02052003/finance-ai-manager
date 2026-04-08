import { ArrowUpTrayIcon } from '@heroicons/react/24/outline';
import { useRef } from 'react';

const Dropzone = ({ file, isUploading, onFileSelected }) => {
  const inputRef = useRef(null);

  const handleDrop = (event) => {
    event.preventDefault();
    const droppedFile = event.dataTransfer.files?.[0];
    if (droppedFile) onFileSelected(droppedFile);
  };

  const handleDragOver = (event) => { event.preventDefault(); };

  const handleInputChange = (event) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) onFileSelected(selectedFile);
  };

  return (
    <section className="rounded-2xl border border-white/[0.06] bg-(--surface-strong) p-5">
      <h3 className="text-base font-semibold text-white">Chọn file Excel</h3>
      <div
        className="mt-4 flex flex-col items-center gap-3 rounded-xl border border-dashed border-indigo-400/25 bg-white/[0.02] px-6 py-10 text-center transition hover:border-indigo-400/40 hover:bg-white/[0.04]"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') inputRef.current?.click(); }}
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/10">
          <ArrowUpTrayIcon className="h-6 w-6 text-indigo-400" />
        </div>
        <div>
          <p className="text-sm font-medium text-white">
            {file ? file.name : 'Kéo thả hoặc bấm để chọn'}
          </p>
          <p className="mt-1 text-xs text-slate-500">Hỗ trợ .xlsx và .xls</p>
        </div>
        <button
          type="button"
          className="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:bg-indigo-400 disabled:opacity-50"
          disabled={isUploading}
        >
          {isUploading ? 'Đang xử lý...' : 'Chọn file'}
        </button>
      </div>
      <input ref={inputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleInputChange} aria-label="Chọn file Excel" />
    </section>
  );
};

export default Dropzone;

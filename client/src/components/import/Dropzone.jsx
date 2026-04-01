import { useRef } from 'react';

const Dropzone = ({ file, isUploading, onFileSelected }) => {
  const inputRef = useRef(null);

  const handleDrop = (event) => {
    event.preventDefault();
    const droppedFile = event.dataTransfer.files?.[0];

    if (droppedFile) {
      onFileSelected(droppedFile);
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  const handleInputChange = (event) => {
    const selectedFile = event.target.files?.[0];

    if (selectedFile) {
      onFileSelected(selectedFile);
    }
  };

  return (
    <section className="rounded-[28px] border border-white/10 bg-(--surface-strong) p-5 shadow-lg shadow-slate-950/20">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Tải file Excel</p>
      <h3 className="mt-2 text-2xl font-semibold text-white">Kéo thả hoặc chọn file</h3>
      <div
        className="mt-5 grid gap-3 rounded-[28px] border border-dashed border-indigo-300/30 bg-slate-950/35 px-6 py-10 text-center transition hover:border-indigo-300/50 hover:bg-white/5"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            inputRef.current?.click();
          }
        }}
      >
        <p className="text-sm font-semibold text-white">Hỗ trợ file `.xlsx` và `.xls`</p>
        <p className="text-sm leading-6 text-slate-400">
          {file ? `Đã chọn: ${file.name}` : 'Kéo file vào đây hoặc bấm để chọn từ máy.'}
        </p>
        <button
          type="button"
          className="mx-auto inline-flex items-center justify-center rounded-2xl bg-(--hero-gradient) px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-950/30 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50"
          disabled={isUploading}
        >
          {isUploading ? 'Đang import...' : 'Chọn file Excel'}
        </button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls"
        className="hidden-input"
        onChange={handleInputChange}
      />
    </section>
  );
};

export default Dropzone;

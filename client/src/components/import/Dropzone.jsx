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
    <section className="card import-dropzone-card">
      <p className="card-label">Tải file Excel</p>
      <h3>Kéo thả hoặc chọn file</h3>
      <div
        className="import-dropzone"
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
        <p>Hỗ trợ file `.xlsx` và `.xls`</p>
        <p className="section-copy">
          {file ? `Đã chọn: ${file.name}` : 'Kéo file vào đây hoặc bấm để chọn từ máy.'}
        </p>
        <button type="button" className="primary-button" disabled={isUploading}>
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

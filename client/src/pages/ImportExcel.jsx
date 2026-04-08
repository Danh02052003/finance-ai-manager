import { useState } from 'react';

import {
  clearImportedWorkbookData,
  reclassifyTransactionsByAi,
  uploadExcelWorkbook
} from '../api/importApi.js';
import Dropzone from '../components/import/Dropzone.jsx';
import ImportSummary from '../components/import/ImportSummary.jsx';

const ImportExcel = () => {
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [isReclassifying, setIsReclassifying] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleFileSelected = (selectedFile) => {
    if (!selectedFile.name.match(/\.(xlsx|xls)$/i)) {
      setError('Chỉ hỗ trợ file .xlsx hoặc .xls.');
      setFile(null);
      return;
    }

    setFile(selectedFile);
    setResult(null);
    setError('');
  };

  const handleSubmit = async () => {
    if (!file) {
      setError('Chọn file Excel trước.');
      return;
    }

    try {
      setIsUploading(true);
      setError('');
      const response = await uploadExcelWorkbook(file);
      setResult(response);
    } catch (requestError) {
      setError(requestError.message || 'Import thất bại.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleClearData = async () => {
    if (!window.confirm('Thao tác này sẽ xóa toàn bộ dữ liệu đã import. Tiếp tục?')) return;

    try {
      setIsClearing(true);
      setError('');
      const response = await clearImportedWorkbookData();
      setResult(null);
      setFile(null);
      alert(`Đã xóa: ${response.deleted.transactions} giao dịch, ${response.deleted.monthly_incomes} thu nhập.`);
    } catch (requestError) {
      setError(requestError.message || 'Xóa thất bại.');
    } finally {
      setIsClearing(false);
    }
  };

  const handleReclassify = async () => {
    try {
      setIsReclassifying(true);
      setError('');
      const response = await reclassifyTransactionsByAi();
      alert(`Đã phân loại lại ${response.updated} giao dịch bằng AI (${response.provider || 'unknown'}).`);
    } catch (requestError) {
      setError(requestError.message || 'Phân loại thất bại.');
    } finally {
      setIsReclassifying(false);
    }
  };

  const isProcessing = isUploading || isClearing || isReclassifying;

  return (
    <div className="space-y-5">
      <section
        id="import-overview"
        data-assistant-target="import-overview"
        className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[linear-gradient(135deg,rgba(99,102,241,0.12)_0%,rgba(139,92,246,0.08)_45%,rgba(10,10,26,0.97)_100%)] p-5 sm:p-6"
      >
        <h1 className="text-2xl font-bold tracking-tight text-white">Nhập dữ liệu từ Excel</h1>
        <p className="mt-2 max-w-lg text-sm text-slate-400">
          Upload workbook Excel để import thu nhập, phân bổ hũ, giao dịch và nợ nội bộ. File được phân tích tự động ở backend.
        </p>
        {error ? (
          <div className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">{error}</div>
        ) : null}
      </section>

      <div id="import-dropzone" data-assistant-target="import-dropzone">
        <Dropzone file={file} isUploading={isUploading} onFileSelected={handleFileSelected} />
      </div>

      <section
        id="import-actions"
        data-assistant-target="import-actions"
        className="rounded-2xl border border-white/[0.06] bg-(--surface-strong) p-5"
      >
        <h2 className="text-base font-semibold text-white">Thao tác</h2>
        <p className="mt-1 text-sm text-slate-500">
          {isUploading ? 'Đang xử lý file...' : 'Sẵn sàng import'}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isProcessing}
            className="rounded-xl bg-(--hero-gradient) px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-900/20 transition hover:shadow-indigo-900/30 disabled:opacity-50"
          >
            {isUploading ? 'Đang xử lý...' : 'Bắt đầu import'}
          </button>
          <button
            type="button"
            onClick={handleReclassify}
            disabled={isProcessing}
            className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-2.5 text-sm font-medium text-emerald-200 transition hover:bg-emerald-500/15 disabled:opacity-50"
          >
            {isReclassifying ? 'Đang phân loại...' : 'AI phân loại lại'}
          </button>
          <button
            type="button"
            onClick={handleClearData}
            disabled={isProcessing}
            className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-2.5 text-sm font-medium text-rose-200 transition hover:bg-rose-500/15 disabled:opacity-50"
          >
            {isClearing ? 'Đang xóa...' : 'Xóa dữ liệu cũ'}
          </button>
        </div>
      </section>

      <div id="import-summary" data-assistant-target="import-summary">
        <ImportSummary result={result} />
      </div>
    </div>
  );
};

export default ImportExcel;

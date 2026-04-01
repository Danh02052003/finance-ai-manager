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
      setError('Chỉ hỗ trợ file Excel .xlsx hoặc .xls.');
      setFile(null);
      return;
    }

    setFile(selectedFile);
    setResult(null);
    setError('');
  };

  const handleSubmit = async () => {
    if (!file) {
      setError('Hãy chọn một file Excel trước khi import.');
      return;
    }

    try {
      setIsUploading(true);
      setError('');
      const response = await uploadExcelWorkbook(file);
      setResult(response);
    } catch (requestError) {
      setError(requestError.message || 'Import file thất bại.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleClearData = async () => {
    const isConfirmed = window.confirm(
      'Thao tác này sẽ xóa toàn bộ monthly incomes, jar allocations, transactions, jar debts và AI advice logs của dữ liệu demo hiện tại. Bạn có chắc không?'
    );

    if (!isConfirmed) {
      return;
    }

    try {
      setIsClearing(true);
      setError('');
      const response = await clearImportedWorkbookData();
      setResult(null);
      setFile(null);
      alert(
        `Đã xóa dữ liệu cũ. Transactions: ${response.deleted.transactions}, Monthly incomes: ${response.deleted.monthly_incomes}.`
      );
    } catch (requestError) {
      setError(requestError.message || 'Xóa dữ liệu cũ thất bại.');
    } finally {
      setIsClearing(false);
    }
  };

  const handleReclassify = async () => {
    try {
      setIsReclassifying(true);
      setError('');
      const response = await reclassifyTransactionsByAi();
      alert(
        `Đã phân loại lại ${response.updated} giao dịch bằng AI. Provider đang dùng: ${response.provider || 'unknown'}.`
      );
    } catch (requestError) {
      setError(requestError.message || 'Phân loại lại bằng AI thất bại.');
    } finally {
      setIsReclassifying(false);
    }
  };

  return (
    <div className="space-y-6">
      <section
        id="import-overview"
        data-assistant-target="import-overview"
        className="overflow-hidden rounded-[32px] border border-white/10 bg-[linear-gradient(135deg,rgba(102,126,234,0.2)_0%,rgba(118,75,162,0.15)_45%,rgba(15,15,35,0.96)_100%)] p-6 shadow-2xl shadow-slate-950/20"
      >
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-indigo-100/80">
          Import Excel
        </div>
        <h1 className="mt-5 text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Đưa dữ liệu từ file cũ vào app với trải nghiệm import rõ ràng hơn.
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
          MVP import hỗ trợ sheet 6 hũ, sheet tháng chi tiêu và sheet Nợ quỹ. File được phân tích
          ở backend rồi lưu trực tiếp vào MongoDB.
        </p>
        {error ? (
          <div className="mt-5 rounded-3xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
            {error}
          </div>
        ) : null}
      </section>

      <div id="import-dropzone" data-assistant-target="import-dropzone">
        <Dropzone file={file} isUploading={isUploading} onFileSelected={handleFileSelected} />
      </div>

      <section
        id="import-actions"
        data-assistant-target="import-actions"
        className="rounded-[28px] border border-white/10 bg-(--surface-strong) p-5 shadow-lg shadow-slate-950/20"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Thao tác</p>
        <h3 className="mt-2 text-2xl font-semibold text-white">Import workbook</h3>
        <p className="mt-3 text-sm leading-7 text-slate-400">
          Trạng thái:
          {' '}
          {isUploading ? 'Đang upload và phân tích workbook...' : 'Sẵn sàng import'}
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            className="rounded-2xl bg-(--hero-gradient) px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-950/30 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50"
            onClick={handleSubmit}
            disabled={isUploading || isClearing || isReclassifying}
          >
            {isUploading ? 'Đang xử lý...' : 'Bắt đầu import'}
          </button>
          <button
            type="button"
            className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-5 py-3 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-400/15 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={handleReclassify}
            disabled={isUploading || isClearing || isReclassifying}
          >
            {isReclassifying ? 'AI đang phân loại lại...' : 'Phân loại lại giao dịch bằng AI'}
          </button>
          <button
            type="button"
            className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-5 py-3 text-sm font-semibold text-rose-100 transition hover:bg-rose-400/15 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={handleClearData}
            disabled={isUploading || isClearing || isReclassifying}
          >
            {isClearing ? 'Đang xóa dữ liệu...' : 'Xóa dữ liệu cũ'}
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

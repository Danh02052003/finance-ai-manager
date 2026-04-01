import { useState } from 'react';

import {
  clearImportedWorkbookData,
  uploadExcelWorkbook
} from '../api/importApi.js';
import Dropzone from '../components/import/Dropzone.jsx';
import ImportSummary from '../components/import/ImportSummary.jsx';

const ImportExcel = () => {
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
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

  return (
    <div className="page-stack">
      <section className="card section-card">
        <p className="card-label">Import Excel</p>
        <h3>Đưa dữ liệu từ file vào MongoDB</h3>
        <p className="section-copy">
          MVP import hỗ trợ sheet 6 hũ, sheet tháng chi tiêu và sheet Nợ quỹ. File
          được phân tích ở backend rồi lưu trực tiếp vào MongoDB.
        </p>
        {error ? <p className="callout callout-warning">{error}</p> : null}
      </section>

      <Dropzone file={file} isUploading={isUploading} onFileSelected={handleFileSelected} />

      <section className="card section-card">
        <p className="card-label">Thao tác</p>
        <h3>Import workbook</h3>
        <p className="section-copy">
          Trạng thái:
          {' '}
          {isUploading ? 'Đang upload và phân tích workbook...' : 'Sẵn sàng import'}
        </p>
        <div className="form-actions">
          <button
            type="button"
            className="primary-button"
            onClick={handleSubmit}
            disabled={isUploading || isClearing}
          >
            {isUploading ? 'Đang xử lý...' : 'Bắt đầu import'}
          </button>
          <button
            type="button"
            className="secondary-button action-button-danger"
            onClick={handleClearData}
            disabled={isUploading || isClearing}
          >
            {isClearing ? 'Đang xóa dữ liệu...' : 'Xóa dữ liệu cũ'}
          </button>
        </div>
      </section>

      <ImportSummary result={result} />
    </div>
  );
};

export default ImportExcel;

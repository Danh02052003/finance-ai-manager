const ImportSummary = ({ result }) => {
  if (!result) {
    return null;
  }

  return (
    <section className="card import-summary-card">
      <p className="card-label">Kết quả import</p>
      <h3>{result.fileName}</h3>

      <div className="stats-grid">
        <section className="card stat-card compact-card">
          <p className="card-label">Monthly incomes</p>
          <h3 className="stat-value">{result.inserted.monthly_incomes}</h3>
        </section>
        <section className="card stat-card compact-card">
          <p className="card-label">Jar allocations</p>
          <h3 className="stat-value">{result.inserted.jar_allocations}</h3>
        </section>
        <section className="card stat-card compact-card">
          <p className="card-label">Transactions</p>
          <h3 className="stat-value">{result.inserted.transactions}</h3>
        </section>
        <section className="card stat-card compact-card">
          <p className="card-label">Jar debts</p>
          <h3 className="stat-value">{result.inserted.jar_debts}</h3>
        </section>
      </div>

      <section className="import-summary-section">
        <p className="card-label">Tổng quan</p>
        <ul className="simple-list">
          <li>Skipped rows: {result.skipped}</li>
          <li>Detected sheets: {result.detectedSheets.join(', ') || 'Không có'}</li>
        </ul>
      </section>

      <section className="import-summary-section">
        <p className="card-label">Warnings</p>
        {result.warnings.length > 0 ? (
          <ul className="simple-list">
            {result.warnings.map((warning, index) => (
              <li key={`${warning}-${index}`}>{warning}</li>
            ))}
          </ul>
        ) : (
          <p className="section-copy">Không có warning.</p>
        )}
      </section>

      <section className="import-summary-section">
        <p className="card-label">Errors</p>
        {result.errors.length > 0 ? (
          <ul className="simple-list">
            {result.errors.map((error, index) => (
              <li key={`${error}-${index}`}>{error}</li>
            ))}
          </ul>
        ) : (
          <p className="section-copy">Không có lỗi.</p>
        )}
      </section>
    </section>
  );
};

export default ImportSummary;

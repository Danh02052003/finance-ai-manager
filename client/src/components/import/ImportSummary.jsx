const ImportSummary = ({ result }) => {
  if (!result) {
    return null;
  }

  return (
    <section className="rounded-[28px] border border-white/10 bg-(--surface-strong) p-5 shadow-lg shadow-slate-950/20">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Kết quả import</p>
      <h3 className="mt-2 text-2xl font-semibold text-white">{result.fileName}</h3>

      <div className="mt-5 grid gap-4 md:grid-cols-4">
        {[
          ['Monthly incomes', result.inserted.monthly_incomes],
          ['Jar allocations', result.inserted.jar_allocations],
          ['Transactions', result.inserted.transactions],
          ['Jar debts', result.inserted.jar_debts]
        ].map(([label, value]) => (
          <section
            key={label}
            className="rounded-[24px] border border-white/10 bg-slate-950/35 p-4"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{label}</p>
            <h4 className="mt-3 text-3xl font-bold text-white">{value}</h4>
          </section>
        ))}
      </div>

      <section className="mt-6 rounded-[24px] border border-white/10 bg-slate-950/35 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Tổng quan</p>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-300">
          <li>Skipped rows: {result.skipped}</li>
          <li>Detected sheets: {result.detectedSheets.join(', ') || 'Không có'}</li>
        </ul>
      </section>

      <section className="mt-4 rounded-[24px] border border-white/10 bg-slate-950/35 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Warnings</p>
        {result.warnings.length > 0 ? (
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-300">
            {result.warnings.map((warning, index) => (
              <li key={`${warning}-${index}`}>{warning}</li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-slate-400">Không có warning.</p>
        )}
      </section>

      <section className="mt-4 rounded-[24px] border border-white/10 bg-slate-950/35 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Errors</p>
        {result.errors.length > 0 ? (
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-300">
            {result.errors.map((error, index) => (
              <li key={`${error}-${index}`}>{error}</li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-slate-400">Không có lỗi.</p>
        )}
      </section>
    </section>
  );
};

export default ImportSummary;

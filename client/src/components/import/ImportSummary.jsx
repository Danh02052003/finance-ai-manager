const ImportSummary = ({ result }) => {
  if (!result) return null;

  return (
    <section className="rounded-2xl border border-white/[0.06] bg-(--surface-strong) p-5">
      <h3 className="text-base font-semibold text-white">Kết quả: {result.fileName}</h3>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ['Thu nhập', result.inserted.monthly_incomes],
          ['Phân bổ', result.inserted.jar_allocations],
          ['Giao dịch', result.inserted.transactions],
          ['Nợ nội bộ', result.inserted.jar_debts]
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-4">
            <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">{label}</p>
            <p className="mt-1.5 text-2xl font-bold tabular-nums text-white">{value}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-xl border border-white/[0.06] bg-white/[0.03] p-4">
        <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">Tổng quan</p>
        <ul className="mt-2 space-y-1 text-sm text-slate-400">
          <li>Bỏ qua: {result.skipped} dòng</li>
          <li>Sheet nhận diện: {result.detectedSheets.join(', ') || 'Không có'}</li>
        </ul>
      </div>

      {result.warnings.length > 0 ? (
        <div className="mt-3 rounded-xl border border-amber-500/15 bg-amber-500/[0.06] p-4">
          <p className="text-[11px] font-medium uppercase tracking-wider text-amber-400/70">Cảnh báo</p>
          <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-amber-200/80">
            {result.warnings.map((warning, index) => <li key={`${warning}-${index}`}>{warning}</li>)}
          </ul>
        </div>
      ) : null}

      {result.errors.length > 0 ? (
        <div className="mt-3 rounded-xl border border-rose-500/15 bg-rose-500/[0.06] p-4">
          <p className="text-[11px] font-medium uppercase tracking-wider text-rose-400/70">Lỗi</p>
          <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-rose-200/80">
            {result.errors.map((err, index) => <li key={`${err}-${index}`}>{err}</li>)}
          </ul>
        </div>
      ) : null}
    </section>
  );
};

export default ImportSummary;

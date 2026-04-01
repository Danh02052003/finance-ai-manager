const settingsBlocks = [
  {
    title: 'Giao diện',
    description: 'Dark mode là mặc định. Các tinh chỉnh thêm sẽ được mở rộng ở giai đoạn sau.'
  },
  {
    title: 'Dữ liệu',
    description: 'Xuất CSV, reset data và các hành động an toàn dữ liệu sẽ nằm tại khu vực này.'
  },
  {
    title: 'Cá nhân hoá',
    description: 'Chu kỳ tháng, language và cấu hình dashboard sẽ được gom tại đây.'
  }
];

const SettingsPage = () => (
  <div className="space-y-6">
    <section className="overflow-hidden rounded-[32px] border border-white/10 bg-[linear-gradient(135deg,rgba(102,126,234,0.2)_0%,rgba(118,75,162,0.15)_45%,rgba(15,15,35,0.96)_100%)] p-6 shadow-2xl shadow-slate-950/20">
      <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-indigo-100/80">
        Settings
      </div>
      <h1 className="mt-5 text-3xl font-bold tracking-tight text-white sm:text-4xl">
        Khu vực cấu hình sẽ được mở rộng dần nhưng đã theo cùng visual language mới.
      </h1>
      <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
        Màn này hiện đóng vai trò giữ chỗ cho các lựa chọn cá nhân hoá, dữ liệu và hành vi sản
        phẩm trong tương lai.
      </p>
    </section>

    <section className="grid gap-4 lg:grid-cols-3">
      {settingsBlocks.map((block) => (
        <article
          key={block.title}
          className="rounded-[28px] border border-white/10 bg-(--surface-strong) p-5 shadow-lg shadow-slate-950/20"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
            Module
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-white">{block.title}</h2>
          <p className="mt-4 text-sm leading-7 text-slate-400">{block.description}</p>
        </article>
      ))}
    </section>
  </div>
);

export default SettingsPage;

import { Link } from 'react-router-dom';

const AuthShell = ({
  title,
  subtitle,
  submitLabel,
  footerLabel,
  footerLinkLabel,
  footerTo,
  error,
  isSubmitting,
  onSubmit,
  children
}) => (
  <div className="min-h-screen bg-(--bg-primary) text-white">
    <div className="mx-auto flex min-h-screen max-w-6xl items-center px-4 py-10 sm:px-6 lg:px-8">
      <div className="grid w-full gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="rounded-3xl border border-white/[0.08] bg-[linear-gradient(135deg,rgba(99,102,241,0.18)_0%,rgba(139,92,246,0.08)_45%,rgba(10,10,26,0.97)_100%)] p-6 sm:p-8">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-(--hero-gradient) shadow-lg shadow-indigo-500/20">
            <span className="text-base font-bold text-white">F</span>
          </div>
          <h1 className="mt-6 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Finance AI
          </h1>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-slate-300">
            Quản lý tài chính cá nhân theo mô hình 6 hũ, nay đã tách riêng dữ liệu cho từng tài khoản để nhiều người dùng chung an toàn hơn.
          </p>
          <div className="mt-8 space-y-3 text-sm text-slate-300">
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.05] p-4">
              Đăng nhập để xem dashboard, giao dịch, số dư thực, import Excel và trợ lý AI của riêng bạn.
            </div>
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.05] p-4">
              Nếu đây là lần đầu, tài khoản đầu tiên sẽ nhận luôn dữ liệu hiện có của hệ thống.
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-white/[0.08] bg-(--surface-strong) p-6 shadow-2xl shadow-black/20 sm:p-8">
          <div>
            <h2 className="text-2xl font-bold text-white">{title}</h2>
            <p className="mt-2 text-sm text-slate-400">{subtitle}</p>
          </div>

          {error ? (
            <div className="mt-5 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
              {error}
            </div>
          ) : null}

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            {children}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-2xl bg-(--hero-gradient) px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-900/20 transition hover:shadow-indigo-900/30 disabled:opacity-60"
            >
              {isSubmitting ? 'Đang xử lý...' : submitLabel}
            </button>
          </form>

          <p className="mt-5 text-sm text-slate-400">
            {footerLabel}{' '}
            <Link to={footerTo} className="font-semibold text-indigo-300 transition hover:text-indigo-200">
              {footerLinkLabel}
            </Link>
          </p>
        </section>
      </div>
    </div>
  </div>
);

export default AuthShell;

import { NavLink } from 'react-router-dom';

import { navigationItems } from '../config/navigation.js';

const Sidebar = ({ isOpen, onClose }) => (
  <>
    <button
      type="button"
      onClick={onClose}
      aria-label="Đóng điều hướng"
      className={[
        'fixed inset-0 z-30 bg-slate-950/60 backdrop-blur-sm transition lg:hidden',
        isOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
      ].join(' ')}
    />

    <aside
      className={[
        'fixed inset-y-0 left-0 z-40 flex w-[250px] flex-col border-r border-white/10 bg-[rgba(15,15,35,0.95)] px-5 py-6 shadow-2xl shadow-black/30 backdrop-blur transition-transform duration-200',
        isOpen ? 'translate-x-0' : '-translate-x-full',
        'lg:translate-x-0'
      ].join(' ')}
    >
      <div className="mb-8">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-400/20 bg-indigo-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-indigo-200">
          6 Hũ Tài Chính
        </div>
        <h1 className="text-xl font-semibold text-white">Quản lý tiền theo nhịp sống mỗi ngày</h1>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          Dark fintech dashboard lấy trọng tâm là nhập nhanh, nhìn rõ và dễ ra quyết định.
        </p>
      </div>

      <nav className="flex flex-1 flex-col gap-2">
        {navigationItems.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                [
                  'group flex items-center gap-3 rounded-2xl border px-4 py-3 transition',
                  isActive
                    ? 'border-indigo-300/35 bg-white/95 text-slate-950 shadow-lg shadow-indigo-900/20'
                    : 'border-transparent bg-transparent text-slate-300 hover:border-white/10 hover:bg-white/5 hover:text-white'
                ].join(' ')
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={[
                      'inline-flex h-10 w-10 items-center justify-center rounded-2xl transition',
                      isActive ? 'bg-slate-950 text-white' : 'bg-white/5 text-slate-300'
                    ].join(' ')}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold">{item.label}</span>
                    <span
                      className={[
                        'block truncate text-xs',
                        isActive ? 'text-slate-700' : 'text-slate-500 group-hover:text-slate-400'
                      ].join(' ')}
                    >
                      {item.title}
                    </span>
                  </span>
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="mt-6 rounded-3xl border border-white/10 bg-(--hero-gradient) p-4 text-white shadow-lg shadow-indigo-950/30">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/80">
          Quick reminder
        </p>
        <p className="mt-2 text-sm leading-6 text-white/90">
          Ưu tiên ghi giao dịch ngay khi phát sinh để dashboard luôn đúng nhịp.
        </p>
      </div>
    </aside>
  </>
);

export default Sidebar;

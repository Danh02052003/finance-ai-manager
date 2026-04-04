import { NavLink } from 'react-router-dom';

import { navigationItems } from '../config/navigation.js';

const navGroups = [
  { key: 'core', label: 'Core' },
  { key: 'manage', label: 'Quản lý' },
  { key: 'tools', label: 'Công cụ' }
];

const Sidebar = ({ isOpen, onClose }) => (
  <>
    <button
      type="button"
      onClick={onClose}
      aria-label="Đóng menu điều hướng"
      className={[
        'fixed inset-0 z-30 bg-slate-950/60 backdrop-blur-sm transition lg:hidden',
        isOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
      ].join(' ')}
    />

    <aside
      className={[
        'fixed inset-y-0 left-0 z-40 flex w-[250px] flex-col border-r border-white/8 bg-[rgba(15,15,35,0.98)] px-4 py-5 shadow-xl shadow-black/20 backdrop-blur transition-transform duration-200',
        isOpen ? 'translate-x-0' : '-translate-x-full',
        'lg:translate-x-0'
      ].join(' ')}
    >
      <div className="border-b border-white/8 pb-4">
        <div className="inline-flex items-center rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-200">
          Finance AI
        </div>
        <h1 className="mt-3 text-lg font-semibold text-white">Quản lý 6 hũ gọn và rõ</h1>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          Tập trung vào số dư tháng, nhập tiêu nhanh và lịch sử theo ngày.
        </p>
      </div>

      <nav className="mt-4 flex-1 overflow-y-auto">
        <div className="space-y-5">
          {navGroups.map((group) => {
            const items = navigationItems.filter((item) => item.group === group.key);

            if (!items.length) {
              return null;
            }

            return (
              <section key={group.key}>
                <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  {group.label}
                </p>
                <div className="space-y-1.5">
                  {items.map((item) => {
                    const Icon = item.icon;

                    return (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        className={({ isActive }) =>
                          [
                            'group flex items-center gap-3 rounded-xl border px-3 py-2.5 transition',
                            isActive
                              ? 'border-emerald-500/20 bg-emerald-500/10 text-white'
                              : 'border-transparent text-slate-300 hover:border-white/10 hover:bg-white/5 hover:text-white'
                          ].join(' ')
                        }
                      >
                        {({ isActive }) => (
                          <>
                            <span
                              className={[
                                'inline-flex h-9 w-9 items-center justify-center rounded-xl transition',
                                isActive ? 'bg-emerald-500/15 text-emerald-200' : 'bg-white/5 text-slate-400'
                              ].join(' ')}
                            >
                              <Icon className="h-4.5 w-4.5" />
                            </span>
                            <span className="min-w-0">
                              <span className="block truncate text-sm font-medium">{item.label}</span>
                              <span className="block truncate text-xs text-slate-500">
                                {item.title}
                              </span>
                            </span>
                          </>
                        )}
                      </NavLink>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      </nav>
    </aside>
  </>
);

export default Sidebar;

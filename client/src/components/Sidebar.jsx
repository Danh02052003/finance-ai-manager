import { NavLink } from 'react-router-dom';

import { navigationItems } from '../config/navigation.js';

const navGroups = [
  { key: 'core', label: 'Chính' },
  { key: 'manage', label: 'Quản lý' },
  { key: 'tools', label: 'Tiện ích' }
];

const Sidebar = ({ isOpen, onClose }) => (
  <>
    <button
      type="button"
      onClick={onClose}
      aria-label="Đóng menu"
      className={[
        'fixed inset-0 z-30 bg-black/50 backdrop-blur-sm transition-opacity duration-200 lg:hidden',
        isOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
      ].join(' ')}
    />

    <aside
      className={[
        'fixed inset-y-0 left-0 z-40 flex w-[260px] flex-col border-r border-white/[0.06] bg-[rgba(10,10,26,0.97)] px-4 pb-4 pt-6 shadow-2xl shadow-black/30 backdrop-blur-xl transition-transform duration-200',
        isOpen ? 'translate-x-0' : '-translate-x-full',
        'lg:translate-x-0'
      ].join(' ')}
    >
      <div className="mb-6 px-2">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-(--hero-gradient) shadow-lg shadow-indigo-500/20">
            <span className="text-sm font-bold text-white">F</span>
          </div>
          <div>
            <h1 className="text-[15px] font-bold tracking-tight text-white">Finance AI</h1>
            <p className="text-[11px] text-slate-500">Quản lý 6 hũ thông minh</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto">
        <div className="space-y-6">
          {navGroups.map((group) => {
            const items = navigationItems.filter((item) => item.group === group.key);

            if (!items.length) {
              return null;
            }

            return (
              <section key={group.key}>
                <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-widest text-slate-600">
                  {group.label}
                </p>
                <div className="space-y-0.5">
                  {items.map((item) => {
                    const Icon = item.icon;

                    return (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        className={({ isActive }) =>
                          [
                            'group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-150',
                            isActive
                              ? 'bg-white/[0.08] text-white shadow-sm'
                              : 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-200'
                          ].join(' ')
                        }
                      >
                        {({ isActive }) => (
                          <>
                            <span
                              className={[
                                'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors',
                                isActive
                                  ? 'bg-indigo-500/20 text-indigo-300'
                                  : 'text-slate-500 group-hover:text-slate-400'
                              ].join(' ')}
                            >
                              <Icon className="h-[18px] w-[18px]" />
                            </span>
                            <span className="truncate text-[13px] font-medium">{item.label}</span>
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

      <div className="mt-auto border-t border-white/[0.06] pt-4">
        <p className="px-3 text-[11px] text-slate-600">v1.0 · Mô hình 6 hũ</p>
      </div>
    </aside>
  </>
);

export default Sidebar;

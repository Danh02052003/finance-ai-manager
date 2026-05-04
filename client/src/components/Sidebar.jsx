import { ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';
import { NavLink } from 'react-router-dom';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { navigationItems } from '../config/navigation.js';
import { useAuth } from '../context/AuthContext.jsx';

const navGroups = [
  { key: 'core', label: 'Chính' },
  { key: 'manage', label: 'Quản lý' },
  { key: 'tools', label: 'Tiện ích' }
];

const Sidebar = ({ isOpen, onClose }) => {
  const { logout, user } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { t } = useTranslation();

  const handleLogout = async () => {
    setIsLoggingOut(true);

    try {
      await logout();
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
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
            <p className="text-[11px] text-slate-500">{t('sidebar.subtitle')}</p>
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
                  {t(`nav_group.${group.key}`)}
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
                            <span className="truncate text-[13px] font-medium">{t(item.labelKey)}</span>
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

      <div className="mt-auto space-y-3 border-t border-white/[0.06] pt-4">
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-3">
          <p className="truncate text-xs font-semibold text-white">{user?.display_name || t('sidebar.account')}</p>
          <p className="mt-1 truncate text-[11px] text-slate-500">{user?.email || ''}</p>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-white/[0.08] hover:text-white disabled:opacity-50"
        >
          <ArrowRightOnRectangleIcon className="h-4 w-4" />
          {isLoggingOut ? t('sidebar.loggingOut') : t('sidebar.logout')}
        </button>

        <p className="px-3 text-[11px] text-slate-600">v1.0 · Mô hình 6 hũ</p>
      </div>
    </aside>
  </>
  );
};

export default Sidebar;

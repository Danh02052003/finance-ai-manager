import { ArrowRightOnRectangleIcon, Bars3Icon, PlusIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

import { getPageMeta } from '../config/navigation.js';
import { useAuth } from '../context/AuthContext.jsx';

const Header = ({ onOpenSidebar }) => {
  const location = useLocation();
  const pageMeta = getPageMeta(location.pathname);
  const { logout, user } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);

    try {
      await logout();
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <header className="fixed inset-x-0 top-0 z-30 border-b border-white/[0.06] bg-[rgba(10,10,26,0.85)] backdrop-blur-xl">
      <div className="lg:pl-[260px]">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={onOpenSidebar}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.08] text-slate-400 transition hover:bg-white/[0.06] hover:text-white lg:hidden"
              aria-label="Mở menu"
            >
              <Bars3Icon className="h-5 w-5" />
            </button>

            <div className="min-w-0">
              <h2 className="truncate text-[15px] font-semibold text-white">
                {pageMeta.title}
              </h2>
              <p className="hidden truncate text-xs text-slate-500 sm:block">
                {pageMeta.description}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-right lg:block">
              <p className="max-w-[180px] truncate text-xs font-semibold text-white">
                {user?.display_name || 'Tài khoản'}
              </p>
              <p className="max-w-[180px] truncate text-[11px] text-slate-500">{user?.email || ''}</p>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="hidden h-10 w-10 items-center justify-center rounded-xl border border-white/[0.08] text-slate-400 transition hover:bg-white/[0.06] hover:text-white disabled:opacity-50 lg:inline-flex"
              aria-label="Đăng xuất"
            >
              <ArrowRightOnRectangleIcon className="h-4 w-4" />
            </button>

            <Link
              to="/transactions?quickAdd=1"
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:bg-indigo-400 active:scale-[0.97]"
            >
              <PlusIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Ghi chi tiêu</span>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;

import {
  ArrowDownTrayIcon,
  Bars3Icon,
  CalendarDaysIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import { Link, useLocation } from 'react-router-dom';

import { getPageMeta } from '../config/navigation.js';

const Header = ({ onOpenSidebar }) => {
  const location = useLocation();
  const pageMeta = getPageMeta(location.pathname);

  return (
    <header className="fixed inset-x-0 top-0 z-30 border-b border-white/8 bg-[rgba(15,15,35,0.88)] backdrop-blur">
      <div className="lg:pl-[250px]">
        <div className="mx-auto flex h-[68px] max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={onOpenSidebar}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white transition hover:bg-white/10 lg:hidden"
              aria-label="Mở menu điều hướng"
            >
              <Bars3Icon className="h-5 w-5" />
            </button>

            <div className="min-w-0">
              <p className="truncate text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                {pageMeta.label}
              </p>
              <h2 className="truncate text-base font-semibold text-white sm:text-lg">
                {pageMeta.title}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/monthly-plan"
              className="hidden items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/10 md:inline-flex"
            >
              <CalendarDaysIcon className="h-4 w-4" />
              <span>Plan tháng</span>
            </Link>

            <Link
              to="/import"
              className="hidden items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/10 md:inline-flex"
            >
              <ArrowDownTrayIcon className="h-4 w-4" />
              <span>Import</span>
            </Link>

            <Link
              to="/transactions?quickAdd=1"
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-emerald-400"
            >
              <PlusIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Nhập hôm nay</span>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;

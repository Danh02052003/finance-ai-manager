import { Bars3Icon, PlusIcon } from '@heroicons/react/24/outline';
import { Link, useLocation } from 'react-router-dom';

import { getPageMeta } from '../config/navigation.js';

const Header = ({ onOpenSidebar }) => {
  const location = useLocation();
  const pageMeta = getPageMeta(location.pathname);

  return (
    <header className="fixed inset-x-0 top-0 z-30 border-b border-white/10 bg-[rgba(15,15,35,0.82)] backdrop-blur">
      <div className="lg:pl-[250px]">
        <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={onOpenSidebar}
              className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white transition hover:bg-white/10 lg:hidden"
              aria-label="Mở điều hướng"
            >
              <Bars3Icon className="h-6 w-6" />
            </button>

            <div className="min-w-0">
              <p className="truncate text-xs font-semibold uppercase tracking-[0.24em] text-indigo-200/80">
                {pageMeta.label}
              </p>
              <div className="flex items-center gap-3">
                <h2 className="truncate text-lg font-semibold text-white sm:text-2xl">
                  {pageMeta.title}
                </h2>
              </div>
              <p className="hidden truncate text-sm text-slate-400 md:block">
                {pageMeta.description}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              to="/transactions?quickAdd=1"
              className="inline-flex items-center gap-2 rounded-2xl bg-(--hero-gradient) px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-900/40 transition hover:scale-[1.01] hover:shadow-xl"
            >
              <PlusIcon className="h-5 w-5" />
              <span className="hidden sm:inline">Thêm giao dịch</span>
            </Link>

            <button
              type="button"
              className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-sm font-semibold text-white transition hover:bg-white/10"
              aria-label="Mở hồ sơ người dùng"
            >
              DH
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;

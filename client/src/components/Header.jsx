import { ArrowRightOnRectangleIcon, Bars3Icon, PlusIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { getPageMeta } from '../config/navigation.js';
import { useAuth } from '../context/AuthContext.jsx';

const Header = ({ onOpenSidebar }) => {
  const location = useLocation();
  const pageMeta = getPageMeta(location.pathname);
  const { logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { t, i18n } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'vi' ? 'en' : 'vi';
    i18n.changeLanguage(newLang);
  };

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
                {t(pageMeta.titleKey)}
              </h2>
              <p className="hidden truncate text-xs text-slate-500 sm:block">
                {t(pageMeta.descKey, pageMeta.description)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleLanguage}
              className="inline-flex h-9 items-center justify-center rounded-lg border border-white/[0.08] px-3 text-xs font-medium text-slate-300 transition hover:bg-white/[0.06] hover:text-white"
            >
              {i18n.language === 'vi' ? 'EN' : 'VI'}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;

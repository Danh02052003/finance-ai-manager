import { AnimatePresence, motion } from 'framer-motion';
import { Outlet, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';

import AssistantWidget from './AssistantWidget.jsx';
import Header from './Header.jsx';
import MobileBottomNav from './MobileBottomNav.jsx';
import Sidebar from './Sidebar.jsx';

const Layout = () => {
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-(--bg-primary) text-(--text-primary)">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className="lg:pl-[250px]">
        <Header onOpenSidebar={() => setIsSidebarOpen(true)} />

        <main className="px-4 pb-28 pt-24 sm:px-6 lg:px-8 lg:pb-10 lg:pt-28">
          <div className="mx-auto max-w-7xl">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.22, ease: 'easeOut' }}
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </div>
        </main>

        <MobileBottomNav />
        <AssistantWidget />
      </div>
    </div>
  );
};

export default Layout;

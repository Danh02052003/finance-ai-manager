import { NavLink } from 'react-router-dom';

import { navigationItems } from '../config/navigation.js';

const coreItems = navigationItems.filter((item) => item.showInBottomNav);

const MobileBottomNav = () => (
  <nav className="fixed inset-x-4 bottom-4 z-40 rounded-3xl border border-white/10 bg-slate-950/90 p-2 shadow-2xl shadow-black/30 backdrop-blur lg:hidden">
    <div className="grid grid-cols-4 gap-1">
      {coreItems.map((item) => {
        const Icon = item.icon;

        return (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              [
                'flex flex-col items-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-medium transition',
                isActive
                  ? 'bg-[linear-gradient(135deg,rgba(99,102,241,0.92)_0%,rgba(79,70,229,0.92)_100%)] text-white shadow-lg shadow-indigo-900/40'
                  : 'text-slate-400 hover:bg-white/5 hover:text-white'
              ].join(' ')
            }
          >
            <Icon className="h-5 w-5" />
            <span>{item.label}</span>
          </NavLink>
        );
      })}
    </div>
  </nav>
);

export default MobileBottomNav;

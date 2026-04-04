import { NavLink } from 'react-router-dom';

import { navigationItems } from '../config/navigation.js';

const coreItems = navigationItems.filter((item) => item.showInBottomNav);

const MobileBottomNav = () => (
  <nav className="fixed inset-x-4 bottom-4 z-40 rounded-2xl border border-white/10 bg-slate-950/95 p-2 shadow-lg shadow-black/20 backdrop-blur lg:hidden">
    <div className="grid grid-cols-3 gap-1.5">
      {coreItems.map((item) => {
        const Icon = item.icon;

        return (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              [
                'flex flex-col items-center gap-1 rounded-xl px-2 py-2 text-[11px] font-medium transition',
                isActive
                  ? 'bg-emerald-500/15 text-white'
                  : 'text-slate-400 hover:bg-white/5 hover:text-white'
              ].join(' ')
            }
          >
            <Icon className="h-5 w-5" />
            <span>{item.shortLabel || item.label}</span>
          </NavLink>
        );
      })}
    </div>
  </nav>
);

export default MobileBottomNav;

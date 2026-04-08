import { NavLink } from 'react-router-dom';

import { navigationItems } from '../config/navigation.js';

const bottomItems = navigationItems.filter((item) => item.showInBottomNav);

const MobileBottomNav = () => (
  <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/[0.06] bg-[rgba(10,10,26,0.95)] pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden">
    <div className="mx-auto grid max-w-lg grid-cols-4 px-2 py-1.5">
      {bottomItems.map((item) => {
        const Icon = item.icon;

        return (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              [
                'flex flex-col items-center gap-0.5 rounded-xl px-1 py-2 text-[10px] font-medium transition-colors',
                isActive
                  ? 'text-indigo-400'
                  : 'text-slate-500 active:text-slate-300'
              ].join(' ')
            }
          >
            {({ isActive }) => (
              <>
                <span className={isActive ? 'relative' : ''}>
                  <Icon className="h-5 w-5" />
                  {isActive ? (
                    <span className="absolute -bottom-1 left-1/2 h-0.5 w-3 -translate-x-1/2 rounded-full bg-indigo-400" />
                  ) : null}
                </span>
                <span className="mt-0.5">{item.shortLabel}</span>
              </>
            )}
          </NavLink>
        );
      })}
    </div>
  </nav>
);

export default MobileBottomNav;

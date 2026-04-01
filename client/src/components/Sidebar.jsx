import { NavLink } from 'react-router-dom';

const navigationItems = [
  { to: '/dashboard', label: 'Tổng quan' },
  { to: '/import', label: 'Import Excel' },
  { to: '/monthly-plan', label: 'Kế hoạch tháng' },
  { to: '/transactions', label: 'Giao dịch' },
  { to: '/debts', label: 'Nợ giữa các hũ' },
  { to: '/jars', label: '6 hũ tài chính' },
  { to: '/settings', label: 'Cài đặt' }
];

const Sidebar = () => (
  <aside className="sidebar">
    <div className="brand-block">
      <p className="brand-kicker">Finance AI Manager</p>
      <h1 className="brand-title">Quản lý tài chính cá nhân</h1>
    </div>

    <nav className="sidebar-nav">
      {navigationItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            isActive ? 'nav-link nav-link-active' : 'nav-link'
          }
        >
          {item.label}
        </NavLink>
      ))}
    </nav>
  </aside>
);

export default Sidebar;

import { Outlet } from 'react-router-dom';

import Header from './Header.jsx';
import Sidebar from './Sidebar.jsx';

const Layout = () => (
  <div className="app-shell">
    <Sidebar />
    <div className="app-main">
      <Header />
      <main className="page-content">
        <Outlet />
      </main>
    </div>
  </div>
);

export default Layout;

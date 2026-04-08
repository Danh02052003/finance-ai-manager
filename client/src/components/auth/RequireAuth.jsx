import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { useAuth } from '../../context/AuthContext.jsx';

const AuthLoadingScreen = () => (
  <div className="flex min-h-screen items-center justify-center bg-(--bg-primary) px-4 text-sm text-slate-400">
    Đang kiểm tra phiên đăng nhập...
  </div>
);

const RequireAuth = () => {
  const location = useLocation();
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <AuthLoadingScreen />;
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: `${location.pathname}${location.search}` }}
      />
    );
  }

  return <Outlet />;
};

export default RequireAuth;

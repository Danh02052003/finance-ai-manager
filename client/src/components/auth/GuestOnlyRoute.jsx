import { Navigate, Outlet } from 'react-router-dom';

import { useAuth } from '../../context/AuthContext.jsx';

const GuestOnlyRoute = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-(--bg-primary) px-4 text-sm text-slate-400">
        Đang tải...
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

export default GuestOnlyRoute;

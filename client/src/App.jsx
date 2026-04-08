import { Navigate, Route, Routes } from 'react-router-dom';

import GuestOnlyRoute from './components/auth/GuestOnlyRoute.jsx';
import RequireAuth from './components/auth/RequireAuth.jsx';
import Layout from './components/Layout.jsx';
import ActualBalancesPage from './pages/ActualBalancesPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import DebtsPage from './pages/DebtsPage.jsx';
import ImportExcel from './pages/ImportExcel.jsx';
import JarsPage from './pages/JarsPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import MonthlyPlanPage from './pages/MonthlyPlanPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import TransactionsPage from './pages/TransactionsPage.jsx';

const App = () => (
  <Routes>
    <Route element={<GuestOnlyRoute />}>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
    </Route>

    <Route element={<RequireAuth />}>
      <Route element={<Layout />}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/actual-balances" element={<ActualBalancesPage />} />
        <Route path="/import" element={<ImportExcel />} />
        <Route path="/monthly-plan" element={<MonthlyPlanPage />} />
        <Route path="/transactions" element={<TransactionsPage />} />
        <Route path="/debts" element={<DebtsPage />} />
        <Route path="/jars" element={<JarsPage />} />
        <Route path="/settings" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Route>
  </Routes>
);

export default App;

import { Navigate, Route, Routes } from 'react-router-dom';

import Layout from './components/Layout.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import DebtsPage from './pages/DebtsPage.jsx';
import ImportExcel from './pages/ImportExcel.jsx';
import JarsPage from './pages/JarsPage.jsx';
import MonthlyPlanPage from './pages/MonthlyPlanPage.jsx';
import SettingsPage from './pages/SettingsPage.jsx';
import TransactionsPage from './pages/TransactionsPage.jsx';

const App = () => (
  <Routes>
    <Route element={<Layout />}>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/import" element={<ImportExcel />} />
      <Route path="/monthly-plan" element={<MonthlyPlanPage />} />
      <Route path="/transactions" element={<TransactionsPage />} />
      <Route path="/debts" element={<DebtsPage />} />
      <Route path="/jars" element={<JarsPage />} />
      <Route path="/settings" element={<SettingsPage />} />
    </Route>
  </Routes>
);

export default App;

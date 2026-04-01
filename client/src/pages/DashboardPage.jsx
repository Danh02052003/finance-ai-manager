import { useEffect, useState } from 'react';

import { getDashboard, getHealth } from '../api/dashboardApi.js';
import AdvicePanel from '../components/AdvicePanel.jsx';
import StatCard from '../components/StatCard.jsx';
import { formatCurrency } from '../components/formatters.js';

const DashboardPage = () => {
  const [health, setHealth] = useState('Đang kiểm tra');
  const [dashboardMessage, setDashboardMessage] = useState('Đang tải dữ liệu');
  const [dashboardData, setDashboardData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const [healthResponse, dashboardResponse] = await Promise.all([
          getHealth(),
          getDashboard()
        ]);

        setHealth(healthResponse.status || 'ok');
        setDashboardMessage(dashboardResponse.message || 'Sẵn sàng');
        setDashboardData(dashboardResponse.data || null);
      } catch (requestError) {
        setError('Chưa kết nối được backend. Hãy kiểm tra server Express.');
      }
    };

    loadDashboard();
  }, []);

  const stats = dashboardData?.stats || {
    total_jars: 0,
    active_jars: 0,
    latest_income_total: 0,
    latest_allocation_total: 0,
    recent_transaction_total: 0,
    open_debt_total: 0
  };

  return (
    <div className="page-stack">
      <section className="stats-grid">
        <StatCard label="Trạng thái API" value={health} hint="Từ GET /api/health" />
        <StatCard
          label="Tổng thu nhập gần nhất"
          value={formatCurrency(stats.latest_income_total)}
          hint={dashboardMessage}
        />
        <StatCard
          label="Tổng phân bổ gần nhất"
          value={formatCurrency(stats.latest_allocation_total)}
          hint={`Số hũ đang hoạt động: ${stats.active_jars}`}
        />
        <StatCard
          label="Tổng chi tiêu gần đây"
          value={formatCurrency(stats.recent_transaction_total)}
          hint={`Số giao dịch gần đây: ${dashboardData?.recent_transactions?.length || 0}`}
        />
        <StatCard
          label="Tổng nợ đang mở"
          value={formatCurrency(stats.open_debt_total)}
          hint={`Số khoản nợ đang mở: ${stats.open_debt_count || 0}`}
        />
      </section>

      <AdvicePanel status="Placeholder" />

      <section className="card section-card">
        <p className="card-label">Tình trạng kết nối</p>
        <h3>Màn hình tổng quan</h3>
        <p className="section-copy">
          Giao diện này đã sẵn sàng cho widget dashboard, thẻ thống kê, biểu đồ trong
          tương lai và khu vực insight AI.
        </p>
        {error ? <p className="callout callout-warning">{error}</p> : null}
      </section>

      <section className="stats-grid">
        <section className="card list-card">
          <p className="card-label">Thông tin người dùng</p>
          <h3>Tài khoản demo</h3>
          <ul className="simple-list">
            <li>Tên: {dashboardData?.user?.display_name || '-'}</li>
            <li>Email: {dashboardData?.user?.email || '-'}</li>
            <li>Tiền tệ: {dashboardData?.user?.base_currency || 'VND'}</li>
          </ul>
        </section>

        <section className="card list-card">
          <p className="card-label">Dữ liệu tháng gần nhất</p>
          <h3>Kế hoạch hiện tại</h3>
          <ul className="simple-list">
            <li>Tháng: {dashboardData?.latest_monthly_income?.month || '-'}</li>
            <li>
              Thu nhập:
              {' '}
              {formatCurrency(dashboardData?.latest_monthly_income?.total_amount || 0)}
            </li>
            <li>Phân bổ: {dashboardData?.latest_jar_allocations?.length || 0} hũ</li>
          </ul>
        </section>
      </section>
    </div>
  );
};

export default DashboardPage;

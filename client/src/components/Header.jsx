import { useLocation } from 'react-router-dom';

const pageTitles = {
  '/dashboard': 'Bảng điều khiển',
  '/import': 'Import Excel',
  '/monthly-plan': 'Kế hoạch tháng',
  '/transactions': 'Giao dịch',
  '/debts': 'Nợ giữa các hũ',
  '/jars': 'Danh sách 6 hũ',
  '/settings': 'Cài đặt'
};

const Header = () => {
  const location = useLocation();
  const title = pageTitles[location.pathname] || 'Finance AI Manager';

  return (
    <header className="page-header">
      <div>
        <p className="page-eyebrow">MVP giao diện React</p>
        <h2>{title}</h2>
      </div>
      <div className="page-header-badge">Sẵn sàng kết nối API</div>
    </header>
  );
};

export default Header;

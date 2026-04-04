import {
  ArrowDownTrayIcon,
  BanknotesIcon,
  CalendarDaysIcon,
  CircleStackIcon,
  CreditCardIcon,
  ExclamationTriangleIcon,
  HomeIcon
} from '@heroicons/react/24/outline';

export const navigationItems = [
  {
    to: '/dashboard',
    label: 'Dashboard',
    shortLabel: 'Dash',
    title: 'Tổng quan tháng hiện tại',
    description: 'Xem 6 hũ, số dư tháng, giao dịch gần đây và các tín hiệu cần chú ý.',
    icon: HomeIcon,
    group: 'core',
    showInBottomNav: true
  },
  {
    to: '/transactions',
    label: 'Giao dịch',
    shortLabel: 'Tx',
    title: 'Nhập tiêu và xem lịch sử',
    description: 'Nhập nhanh chi tiêu hôm nay, lọc theo hũ, theo tháng và xem theo ngày.',
    icon: CreditCardIcon,
    group: 'core',
    showInBottomNav: true
  },
  {
    to: '/jars',
    label: '6 hũ',
    shortLabel: 'Hũ',
    title: 'Chi tiết từng hũ',
    description: 'Xem phân bổ, đã chi, còn lại và mức dùng gợi ý của từng hũ.',
    icon: BanknotesIcon,
    group: 'core',
    showInBottomNav: true
  },
  {
    to: '/monthly-plan',
    label: 'Kế hoạch',
    shortLabel: 'Plan',
    title: 'Lập kế hoạch tháng',
    description: 'Tạo thu nhập tháng và để app tự chia 6 hũ theo cấu hình chính.',
    icon: CalendarDaysIcon,
    group: 'manage',
    showInBottomNav: false
  },
  {
    to: '/debts',
    label: 'Nợ giữa hũ',
    shortLabel: 'Nợ',
    title: 'Theo dõi nợ nội bộ',
    description: 'Quản lý các khoản chi hộ hoặc tạm ứng giữa các hũ.',
    icon: ExclamationTriangleIcon,
    group: 'manage',
    showInBottomNav: false
  },
  {
    to: '/actual-balances',
    label: 'Số dư thực',
    shortLabel: 'Dư thực',
    title: 'Snapshot số dư thực',
    description: 'Lưu phần tiền còn giữ riêng theo tháng và quản lý phát sinh lãi.',
    icon: CircleStackIcon,
    group: 'manage',
    showInBottomNav: false
  },
  {
    to: '/import',
    label: 'Import',
    shortLabel: 'Import',
    title: 'Nhập dữ liệu từ Excel',
    description: 'Upload workbook cũ, xem kết quả import và chạy AI phân loại lại giao dịch.',
    icon: ArrowDownTrayIcon,
    group: 'tools',
    showInBottomNav: false
  }
];

export const getPageMeta = (pathname) =>
  navigationItems.find((item) => pathname.startsWith(item.to)) || {
    label: 'Finance AI Manager',
    shortLabel: 'App',
    title: 'Finance AI Manager',
    description: 'Ứng dụng quản lý tài chính cá nhân theo mô hình 6 hũ.'
  };

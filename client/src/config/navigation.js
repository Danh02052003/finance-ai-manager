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
    to: '/transactions',
    label: 'Giao dịch',
    shortLabel: 'Giao dịch',
    title: 'Sổ giao dịch',
    description: 'Ghi chi tiêu, tìm lại lịch sử và theo dõi dòng tiền từng ngày.',
    icon: CreditCardIcon,
    group: 'core',
    showInBottomNav: true
  },
  {
    to: '/jars',
    label: '6 Hũ',
    shortLabel: '6 Hũ',
    title: 'Chi tiết 6 hũ',
    description: 'Phân bổ, đã chi, còn lại và mức chi gợi ý cho từng hũ.',
    icon: BanknotesIcon,
    group: 'core',
    showInBottomNav: true
  },
  {
    to: '/monthly-plan',
    label: 'Kế hoạch',
    shortLabel: 'Kế hoạch',
    title: 'Kế hoạch tháng',
    description: 'Nhập thu nhập và để hệ thống tự phân bổ 6 hũ.',
    icon: CalendarDaysIcon,
    group: 'manage',
    showInBottomNav: true
  },
  {
    to: '/debts',
    label: 'Nợ nội bộ',
    shortLabel: 'Nợ',
    title: 'Nợ giữa các hũ',
    description: 'Theo dõi các khoản tạm ứng và hoàn trả giữa các hũ.',
    icon: ExclamationTriangleIcon,
    group: 'manage',
    showInBottomNav: false
  },
  {
    to: '/actual-balances',
    label: 'Số dư thực',
    shortLabel: 'Số dư',
    title: 'Số dư thực tế',
    description: 'Lưu số tiền thực đang giữ, tách riêng khỏi ngân sách vận hành.',
    icon: CircleStackIcon,
    group: 'manage',
    showInBottomNav: false
  }
];

export const getPageMeta = (pathname) =>
  navigationItems.find((item) => pathname.startsWith(item.to)) || {
    label: 'Quản lý tài chính',
    shortLabel: 'App',
    title: 'Finance AI Manager',
    description: 'Ứng dụng quản lý tài chính cá nhân theo mô hình 6 hũ.'
  };

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
    labelKey: 'nav.transactions',
    titleKey: 'nav.transactions',
    descKey: 'navDesc.transactions',
    description: 'Ghi chi tiêu, tìm lại lịch sử và theo dõi dòng tiền từng ngày.',
    icon: CreditCardIcon,
    group: 'core',
    showInBottomNav: true
  },
  {
    to: '/jars',
    labelKey: 'nav.jars',
    titleKey: 'nav.jars',
    descKey: 'navDesc.jars',
    description: 'Phân bổ, đã chi, còn lại và mức chi gợi ý cho từng hũ.',
    icon: BanknotesIcon,
    group: 'core',
    showInBottomNav: true
  },
  {
    to: '/monthly-plan',
    labelKey: 'nav.plan',
    titleKey: 'nav.plan',
    descKey: 'navDesc.plan',
    description: 'Nhập thu nhập và để hệ thống tự phân bổ 6 hũ.',
    icon: CalendarDaysIcon,
    group: 'manage',
    showInBottomNav: true
  },
  {
    to: '/debts',
    labelKey: 'nav.debts',
    titleKey: 'nav.debts',
    descKey: 'navDesc.debts',
    description: 'Theo dõi các khoản tạm ứng và hoàn trả giữa các hũ.',
    icon: ExclamationTriangleIcon,
    group: 'manage',
    showInBottomNav: false
  },
  {
    to: '/actual-balances',
    labelKey: 'nav.actualBalances',
    titleKey: 'nav.actualBalances',
    descKey: 'navDesc.actual_balances',
    description: 'Lưu số tiền thực đang giữ, tách riêng khỏi ngân sách vận hành.',
    icon: CircleStackIcon,
    group: 'manage',
    showInBottomNav: false
  }
];

export const getPageMeta = (pathname) =>
  navigationItems.find((item) => pathname.startsWith(item.to)) || {
    labelKey: 'nav.app',
    titleKey: 'nav.app',
    descKey: 'navDesc.settings',
    description: 'Ứng dụng quản lý tài chính cá nhân theo mô hình 6 hũ.'
  };

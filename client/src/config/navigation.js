import {
  ArrowDownTrayIcon,
  BanknotesIcon,
  CalendarDaysIcon,
  CircleStackIcon,
  Cog6ToothIcon,
  CreditCardIcon,
  ExclamationTriangleIcon,
  HomeIcon
} from '@heroicons/react/24/outline';

export const navigationItems = [
  {
    to: '/dashboard',
    label: 'Dashboard',
    title: 'Sức khỏe tài chính hôm nay',
    description: 'Theo dõi dòng tiền, hũ và tín hiệu cần hành động.',
    icon: HomeIcon,
    showInBottomNav: true
  },
  {
    to: '/jars',
    label: '6 Hũ',
    title: '6 hũ của bạn',
    description: 'Nhìn từng hũ như một bucket sống động với tiến độ rõ ràng.',
    icon: BanknotesIcon,
    showInBottomNav: true
  },
  {
    to: '/transactions',
    label: 'Giao dịch',
    title: 'Nhập nhanh và dọn giao dịch',
    description: 'Ghi nhận chi tiêu hằng ngày, tìm nhanh và thao tác hàng loạt.',
    icon: CreditCardIcon,
    showInBottomNav: true
  },
  {
    to: '/monthly-plan',
    label: 'Kế hoạch tháng',
    title: 'Lập kế hoạch tháng',
    description: 'Biến thu nhập thành một bản phân bổ 6 hũ dễ theo dõi.',
    icon: CalendarDaysIcon,
    showInBottomNav: true
  },
  {
    to: '/actual-balances',
    label: 'Số dư thực',
    title: 'Ví thực tế theo tháng',
    description: 'Lưu phần tiền thật còn giữ theo từng hũ mà không trộn vào ngân sách tháng mới.',
    icon: CircleStackIcon,
    showInBottomNav: false
  },
  {
    to: '/debts',
    label: 'Nợ / quỹ',
    title: 'Theo dõi nợ và quỹ',
    description: 'Ưu tiên các khoản cần xử lý trước khi quên.',
    icon: ExclamationTriangleIcon,
    showInBottomNav: false
  },
  {
    to: '/import',
    label: 'Import',
    title: 'Nhập dữ liệu từ Excel',
    description: 'Đưa dữ liệu cũ vào app với tóm tắt rõ ràng sau import.',
    icon: ArrowDownTrayIcon,
    showInBottomNav: false
  },
  {
    to: '/settings',
    label: 'Cài đặt',
    title: 'Thiết lập cá nhân',
    description: 'Quản lý các tuỳ chọn nền tảng và dữ liệu của bạn.',
    icon: Cog6ToothIcon,
    showInBottomNav: false
  }
];

export const getPageMeta = (pathname) =>
  navigationItems.find((item) => pathname.startsWith(item.to)) || {
    label: '6 Hũ Tài Chính',
    title: '6 Hũ Tài Chính',
    description: 'Không gian quản lý tài chính cá nhân theo mô hình 6 hũ.'
  };

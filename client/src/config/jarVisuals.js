import {
  AcademicCapIcon,
  GiftIcon,
  HeartIcon,
  HomeModernIcon,
  SparklesIcon,
  SunIcon
} from '@heroicons/react/24/outline';

export const jarVisuals = {
  essentials: {
    icon: HomeModernIcon,
    gradient: 'from-emerald-500/20 via-cyan-500/10 to-transparent',
    ring: 'text-emerald-400',
    accent: '#34d399',
    subtitle: 'Chi phí thiết yếu hàng ngày'
  },
  long_term_saving: {
    icon: SparklesIcon,
    gradient: 'from-sky-500/20 via-indigo-500/10 to-transparent',
    ring: 'text-sky-400',
    accent: '#38bdf8',
    subtitle: 'Tích luỹ cho mục tiêu dài hạn'
  },
  education: {
    icon: AcademicCapIcon,
    gradient: 'from-amber-400/20 via-orange-400/10 to-transparent',
    ring: 'text-amber-400',
    accent: '#fbbf24',
    subtitle: 'Đầu tư cho kiến thức & sức khoẻ'
  },
  enjoyment: {
    icon: SunIcon,
    gradient: 'from-fuchsia-500/20 via-rose-500/10 to-transparent',
    ring: 'text-fuchsia-400',
    accent: '#e879f9',
    subtitle: 'Niềm vui & trải nghiệm cá nhân'
  },
  financial_freedom: {
    icon: GiftIcon,
    gradient: 'from-violet-500/20 via-blue-500/10 to-transparent',
    ring: 'text-violet-400',
    accent: '#a78bfa',
    subtitle: 'Xây dựng tự do tài chính'
  },
  charity: {
    icon: HeartIcon,
    gradient: 'from-rose-500/20 via-pink-500/10 to-transparent',
    ring: 'text-rose-400',
    accent: '#fb7185',
    subtitle: 'Chia sẻ & đóng góp cộng đồng'
  }
};

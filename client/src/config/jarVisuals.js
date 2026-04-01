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
    gradient: 'from-emerald-400/30 via-cyan-400/15 to-slate-900',
    ring: 'text-emerald-400',
    accent: '#34d399',
    subtitle: 'Nhu cầu sống hằng ngày'
  },
  long_term_saving: {
    icon: SparklesIcon,
    gradient: 'from-sky-400/30 via-indigo-400/15 to-slate-900',
    ring: 'text-sky-400',
    accent: '#38bdf8',
    subtitle: 'An toàn cho các mục tiêu lớn'
  },
  education: {
    icon: AcademicCapIcon,
    gradient: 'from-amber-300/30 via-orange-400/15 to-slate-900',
    ring: 'text-amber-300',
    accent: '#fbbf24',
    subtitle: 'Đầu tư cho kiến thức và sức khoẻ'
  },
  enjoyment: {
    icon: SunIcon,
    gradient: 'from-fuchsia-400/30 via-rose-400/15 to-slate-900',
    ring: 'text-fuchsia-400',
    accent: '#e879f9',
    subtitle: 'Cho niềm vui và trải nghiệm'
  },
  financial_freedom: {
    icon: GiftIcon,
    gradient: 'from-violet-400/30 via-blue-400/15 to-slate-900',
    ring: 'text-violet-400',
    accent: '#a78bfa',
    subtitle: 'Tích luỹ cho tự do tài chính'
  },
  charity: {
    icon: HeartIcon,
    gradient: 'from-rose-400/30 via-pink-400/15 to-slate-900',
    ring: 'text-rose-400',
    accent: '#fb7185',
    subtitle: 'Sẻ chia với những điều có ý nghĩa'
  }
};

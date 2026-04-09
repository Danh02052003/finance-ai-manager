import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import AuthShell from '../components/auth/AuthShell.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [form, setForm] = useState({
    display_name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = ({ target: { name, value } }) => {
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (form.password !== form.confirmPassword) {
      setError('Mật khẩu nhập lại chưa khớp.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await register({
        display_name: form.display_name,
        email: form.email,
        password: form.password
      });
      navigate('/dashboard', { replace: true });
    } catch (requestError) {
      setError(requestError.message || 'Không thể đăng ký.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthShell
      title="Tạo tài khoản"
      subtitle="Mỗi người dùng sẽ có bộ dữ liệu riêng. Tài khoản đầu tiên sẽ nhận dữ liệu hiện có và trở thành quản trị cao nhất của ứng dụng."
      submitLabel="Tạo tài khoản"
      footerLabel="Đã có tài khoản?"
      footerLinkLabel="Đăng nhập"
      footerTo="/login"
      error={error}
      isSubmitting={isSubmitting}
      onSubmit={handleSubmit}
    >
      <label className="block rounded-2xl border border-white/[0.06] bg-white/[0.03] px-4 py-3">
        <span className="mb-2 block text-[11px] font-medium uppercase tracking-wider text-slate-500">
          Tên hiển thị
        </span>
        <input
          name="display_name"
          type="text"
          autoComplete="name"
          value={form.display_name}
          onChange={handleChange}
          placeholder="Ví dụ: Lê Tuấn Anh"
          className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-600"
          required
        />
      </label>

      <label className="block rounded-2xl border border-white/[0.06] bg-white/[0.03] px-4 py-3">
        <span className="mb-2 block text-[11px] font-medium uppercase tracking-wider text-slate-500">
          Email
        </span>
        <input
          name="email"
          type="email"
          autoComplete="email"
          value={form.email}
          onChange={handleChange}
          placeholder="you@example.com"
          className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-600"
          required
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block rounded-2xl border border-white/[0.06] bg-white/[0.03] px-4 py-3">
          <span className="mb-2 block text-[11px] font-medium uppercase tracking-wider text-slate-500">
            Mật khẩu
          </span>
          <div className="flex items-center gap-2">
            <input
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              value={form.password}
              onChange={handleChange}
              placeholder="Tối thiểu 8 ký tự"
              className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-600"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((current) => !current)}
              aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiển thị mật khẩu'}
              className="shrink-0 text-slate-500 transition hover:text-white"
            >
              {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
            </button>
          </div>
        </label>

        <label className="block rounded-2xl border border-white/[0.06] bg-white/[0.03] px-4 py-3">
          <span className="mb-2 block text-[11px] font-medium uppercase tracking-wider text-slate-500">
            Nhập lại mật khẩu
          </span>
          <div className="flex items-center gap-2">
            <input
              name="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              autoComplete="new-password"
              value={form.confirmPassword}
              onChange={handleChange}
              placeholder="Nhập lại mật khẩu"
              className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-600"
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((current) => !current)}
              aria-label={showConfirmPassword ? 'Ẩn mật khẩu' : 'Hiển thị mật khẩu'}
              className="shrink-0 text-slate-500 transition hover:text-white"
            >
              {showConfirmPassword ? (
                <EyeSlashIcon className="h-5 w-5" />
              ) : (
                <EyeIcon className="h-5 w-5" />
              )}
            </button>
          </div>
        </label>
      </div>
    </AuthShell>
  );
};

export default RegisterPage;

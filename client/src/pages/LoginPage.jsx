import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import AuthShell from '../components/auth/AuthShell.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [form, setForm] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const redirectTo = location.state?.from || '/dashboard';

  const handleChange = ({ target: { name, value } }) => {
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      await login(form);
      navigate(redirectTo, { replace: true });
    } catch (requestError) {
      setError(requestError.message || 'Không thể đăng nhập.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthShell
      title="Đăng nhập"
      subtitle="Vào lại tài khoản của bạn để tiếp tục quản lý dữ liệu tài chính riêng."
      submitLabel="Đăng nhập"
      footerLabel="Chưa có tài khoản?"
      footerLinkLabel="Đăng ký ngay"
      footerTo="/register"
      error={error}
      isSubmitting={isSubmitting}
      onSubmit={handleSubmit}
    >
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

      <label className="block rounded-2xl border border-white/[0.06] bg-white/[0.03] px-4 py-3">
        <span className="mb-2 block text-[11px] font-medium uppercase tracking-wider text-slate-500">
          Mật khẩu
        </span>
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          value={form.password}
          onChange={handleChange}
          placeholder="Tối thiểu 8 ký tự"
          className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-600"
          required
        />
      </label>
    </AuthShell>
  );
};

export default LoginPage;

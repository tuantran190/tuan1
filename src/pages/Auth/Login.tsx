import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { Flower2 } from 'lucide-react';

export function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem('user', JSON.stringify(data.user));
        if (data.user.role_id === 1) navigate('/admin');
        else if (data.user.role_id === 2 || data.user.role_id === 3) navigate('/staff');
        else if (data.user.role_id === 4) navigate('/shipper');
        else navigate('/');
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Lỗi kết nối server');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-2xl shadow-sm border border-stone-100">
        <div className="flex flex-col items-center">
          <Flower2 className="h-12 w-12 text-rose-600" />
          <h2 className="mt-6 text-center text-3xl font-serif font-bold text-stone-900">
            Đăng nhập Hoa 18
          </h2>
          <p className="mt-2 text-center text-sm text-stone-500">
            Hệ thống quản lý cửa hàng
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center">
              {error}
            </div>
          )}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Tên đăng nhập</label>
              <input
                type="text"
                required
                className="appearance-none relative block w-full px-3 py-2 border border-stone-300 rounded-lg placeholder-stone-400 text-stone-900 focus:outline-none focus:ring-rose-500 focus:border-rose-500 focus:z-10 sm:text-sm"
                placeholder="admin / nghenhan1 / shipper1"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Mật khẩu</label>
              <input
                type="password"
                required
                className="appearance-none relative block w-full px-3 py-2 border border-stone-300 rounded-lg placeholder-stone-400 text-stone-900 focus:outline-none focus:ring-rose-500 focus:border-rose-500 focus:z-10 sm:text-sm"
                placeholder="123"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2.5 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-rose-600 hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500 transition-colors"
            >
              Đăng nhập
            </button>
          </div>

          <div className="text-center text-sm text-stone-500">
            Chưa có tài khoản?{' '}
            <Link to="/register" className="font-medium text-rose-600 hover:text-rose-500">
              Đăng ký ngay
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

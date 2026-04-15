import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { Flower2 } from 'lucide-react';

export function Register() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, full_name: fullName, phone })
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem('user', JSON.stringify(data.user));
        navigate('/');
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
            Đăng ký tài khoản
          </h2>
          <p className="mt-2 text-center text-sm text-stone-500">
            Trở thành khách hàng của Hoa 18
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleRegister}>
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center">
              {error}
            </div>
          )}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Họ và tên</label>
              <input
                type="text"
                required
                className="appearance-none relative block w-full px-3 py-2 border border-stone-300 rounded-lg placeholder-stone-400 text-stone-900 focus:outline-none focus:ring-rose-500 focus:border-rose-500 focus:z-10 sm:text-sm"
                placeholder="Nguyễn Văn A"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Số điện thoại</label>
              <input
                type="tel"
                required
                className="appearance-none relative block w-full px-3 py-2 border border-stone-300 rounded-lg placeholder-stone-400 text-stone-900 focus:outline-none focus:ring-rose-500 focus:border-rose-500 focus:z-10 sm:text-sm"
                placeholder="0901234567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Tên đăng nhập</label>
              <input
                type="text"
                required
                className="appearance-none relative block w-full px-3 py-2 border border-stone-300 rounded-lg placeholder-stone-400 text-stone-900 focus:outline-none focus:ring-rose-500 focus:border-rose-500 focus:z-10 sm:text-sm"
                placeholder="Tên đăng nhập viết liền không dấu"
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
                placeholder="Mật khẩu"
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
              Đăng ký
            </button>
          </div>
          
          <div className="text-center text-sm text-stone-500">
            Đã có tài khoản?{' '}
            <Link to="/login" className="font-medium text-rose-600 hover:text-rose-500">
              Đăng nhập ngay
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

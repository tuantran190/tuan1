import { Outlet, Link, useNavigate } from 'react-router';
import { Flower2, LogOut, LayoutDashboard, ShoppingBag, Truck } from 'lucide-react';

export function Layout() {
  const navigate = useNavigate();
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 font-sans">
      <header className="bg-white border-b border-stone-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <Link to="/" className="flex items-center gap-2 text-rose-600 hover:text-rose-700 transition-colors">
              <Flower2 className="h-8 w-8" />
              <span className="font-serif text-2xl font-bold tracking-tight">Hoa 18</span>
            </Link>
            
            <nav className="flex items-center gap-6">
              {user ? (
                <>
                  {user.role_id === 1 && (
                    <Link to="/admin" className="flex items-center gap-2 text-stone-600 hover:text-rose-600 font-medium">
                      <LayoutDashboard className="h-5 w-5" />
                      <span>Dashboard</span>
                    </Link>
                  )}
                  {(user.role_id === 2 || user.role_id === 3) && (
                    <Link to="/staff" className="flex items-center gap-2 text-stone-600 hover:text-rose-600 font-medium">
                      <ShoppingBag className="h-5 w-5" />
                      <span>Đơn hàng</span>
                    </Link>
                  )}
                  {user.role_id === 4 && (
                    <Link to="/shipper" className="flex items-center gap-2 text-stone-600 hover:text-rose-600 font-medium">
                      <Truck className="h-5 w-5" />
                      <span>Giao hàng</span>
                    </Link>
                  )}
                  {user.role_id === 5 && (
                    <Link to="/profile" className="flex items-center gap-2 text-stone-600 hover:text-rose-600 font-medium">
                      <ShoppingBag className="h-5 w-5" />
                      <span>Đơn hàng của tôi</span>
                    </Link>
                  )}
                  <div className="flex items-center gap-4 ml-4 pl-4 border-l border-stone-200">
                    <span className="text-sm text-stone-500">Xin chào, <strong className="text-stone-900">{user.full_name}</strong></span>
                    <button 
                      onClick={handleLogout}
                      className="text-stone-400 hover:text-rose-600 transition-colors"
                      title="Đăng xuất"
                    >
                      <LogOut className="h-5 w-5" />
                    </button>
                  </div>
                </>
              ) : (
                <Link to="/login" className="text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 px-4 py-2 rounded-full transition-colors">
                  Đăng nhập
                </Link>
              )}
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
}

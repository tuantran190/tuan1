import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { AlertTriangle, TrendingUp, Package, ShoppingBag, Users, Star, Truck, Edit3, PlusCircle } from 'lucide-react';

interface DashboardData {
  revenue: number;
  lowStock: any[];
  ordersByStatus: { status: string; count: number }[];
  artisanPerformance: { full_name: string; completed_orders: number }[];
  shipperPerformance: { full_name: string; delivered_orders: number }[];
  popularFlowers: { name: string; total_sold: number }[];
}

const COLORS = ['#f43f5e', '#f59e0b', '#10b981', '#3b82f6'];

export function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [flowers, setFlowers] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  
  const [editingFlower, setEditingFlower] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ name: '', price: '', image_url: '' });

  const [selectedMaterial, setSelectedMaterial] = useState('');
  const [receiptQuantity, setReceiptQuantity] = useState('');

  const fetchData = () => {
    fetch('/api/admin/dashboard')
      .then(res => res.json())
      .then(d => setData(d));
    
    fetch('/api/flowers')
      .then(res => res.json())
      .then(data => setFlowers(data));

    fetch('/api/materials')
      .then(res => res.json())
      .then(data => setMaterials(data))
      .catch(() => {});
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.success && data.url) {
        setEditForm({ ...editForm, image_url: data.url });
      } else {
        alert('Lỗi upload ảnh');
      }
    } catch (err) {
      alert('Lỗi upload ảnh');
    }
  };

  const handleUpdateFlower = async (id: number) => {
    try {
      const res = await fetch(`/api/admin/flowers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: editForm.name, 
          price: Number(editForm.price),
          image_url: editForm.image_url
        })
      });
      if (res.ok) {
        alert('Cập nhật thông tin hoa thành công!');
        setEditingFlower(null);
        fetchData();
      }
    } catch (e) {
      alert('Lỗi cập nhật');
    }
  };

  const handleCreateReceipt = async () => {
    if (!selectedMaterial || !receiptQuantity) return alert('Vui lòng nhập đủ thông tin');
    try {
      const res = await fetch('/api/admin/inventory/receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ material_id: Number(selectedMaterial), quantity: Number(receiptQuantity) })
      });
      if (res.ok) {
        alert('Nhập kho thành công!');
        setSelectedMaterial('');
        setReceiptQuantity('');
        fetchData();
      }
    } catch (e) {
      alert('Lỗi nhập kho');
    }
  };

  if (!data) return <div className="py-12 text-center">Đang tải...</div>;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-serif font-bold text-stone-900">Dashboard Quản Lý</h1>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-stone-100 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-rose-50 rounded-xl text-rose-600">
            <TrendingUp className="h-8 w-8" />
          </div>
          <div>
            <p className="text-sm font-medium text-stone-500">Tổng doanh thu</p>
            <p className="text-2xl font-bold text-stone-900">{data.revenue.toLocaleString('vi-VN')}đ</p>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-2xl border border-stone-100 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-amber-50 rounded-xl text-amber-600">
            <ShoppingBag className="h-8 w-8" />
          </div>
          <div>
            <p className="text-sm font-medium text-stone-500">Tổng đơn hàng</p>
            <p className="text-2xl font-bold text-stone-900">
              {data.ordersByStatus.reduce((acc, curr) => acc + curr.count, 0)}
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-stone-100 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-red-50 rounded-xl text-red-600">
            <AlertTriangle className="h-8 w-8" />
          </div>
          <div>
            <p className="text-sm font-medium text-stone-500">Cảnh báo kho</p>
            <p className="text-2xl font-bold text-stone-900">{data.lowStock.length} mục</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Quản lý Biến động */}
        <div className="space-y-8">
          <div className="bg-white p-6 rounded-2xl border border-stone-100 shadow-sm">
            <h2 className="text-xl font-bold text-stone-900 mb-6 flex items-center gap-2">
              <PlusCircle className="h-5 w-5 text-indigo-500" /> Phiếu nhập hàng
            </h2>
            <div className="space-y-4">
              <div className="flex gap-4">
                <select 
                  className="flex-1 p-3 border border-stone-200 rounded-xl text-sm"
                  value={selectedMaterial}
                  onChange={e => setSelectedMaterial(e.target.value)}
                >
                  <option value="">Chọn nguyên liệu/phụ kiện...</option>
                  {materials.map(m => (
                    <option key={m.id} value={m.id}>{m.name} (Tồn: {m.quantity} {m.unit})</option>
                  ))}
                </select>
                <input 
                  type="number" 
                  placeholder="Số lượng" 
                  className="w-32 p-3 border border-stone-200 rounded-xl text-sm"
                  value={receiptQuantity}
                  onChange={e => setReceiptQuantity(e.target.value)}
                />
              </div>
              <button 
                onClick={handleCreateReceipt}
                className="w-full py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700"
              >
                Tạo phiếu nhập & Cập nhật kho
              </button>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-stone-100 shadow-sm">
            <h2 className="text-xl font-bold text-stone-900 mb-6 flex items-center gap-2">
              <Edit3 className="h-5 w-5 text-amber-500" /> Điều chỉnh thông tin hoa
            </h2>
            <div className="space-y-4 max-h-80 overflow-y-auto pr-2">
              {flowers.map(flower => (
                <div key={flower.id} className="flex flex-col gap-3 p-4 border border-stone-100 rounded-xl">
                  {editingFlower === flower.id ? (
                    <div className="space-y-3">
                      <input 
                        type="text" 
                        placeholder="Tên hoa"
                        className="w-full p-2 border border-stone-300 rounded text-sm"
                        value={editForm.name}
                        onChange={e => setEditForm({...editForm, name: e.target.value})}
                      />
                      <input 
                        type="number" 
                        placeholder="Giá bán"
                        className="w-full p-2 border border-stone-300 rounded text-sm"
                        value={editForm.price}
                        onChange={e => setEditForm({...editForm, price: e.target.value})}
                      />
                      <div>
                        <label className="block text-xs font-medium text-stone-700 mb-1">Ảnh sản phẩm</label>
                        <input 
                          type="file" 
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="w-full p-2 border border-stone-300 rounded text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                        />
                        {editForm.image_url && (
                          <img src={editForm.image_url} alt="Preview" className="mt-2 h-20 w-20 object-cover rounded-lg border border-stone-200" referrerPolicy="no-referrer" />
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleUpdateFlower(flower.id)} className="flex-1 text-sm bg-green-600 text-white px-3 py-2 rounded-lg font-medium">Lưu</button>
                        <button onClick={() => setEditingFlower(null)} className="flex-1 text-sm bg-stone-200 text-stone-700 px-3 py-2 rounded-lg font-medium">Hủy</button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <img src={flower.image_url} alt={flower.name} className="w-12 h-12 rounded-lg object-cover" referrerPolicy="no-referrer" />
                        <div>
                          <p className="font-medium text-stone-900">{flower.name}</p>
                          <p className="text-sm text-stone-500">{flower.price.toLocaleString('vi-VN')}đ</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => { 
                          setEditingFlower(flower.id); 
                          setEditForm({ name: flower.name, price: flower.price.toString(), image_url: flower.image_url }); 
                        }} 
                        className="text-amber-600 hover:text-amber-700 p-2"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="space-y-8">
          <div className="bg-white p-6 rounded-2xl border border-stone-100 shadow-sm">
            <h3 className="text-lg font-bold text-stone-900 mb-6">Trạng thái đơn hàng</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.ordersByStatus}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e7e5e4" />
                  <XAxis dataKey="status" axisLine={false} tickLine={false} tick={{ fill: '#78716c' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#78716c' }} />
                  <Tooltip 
                    cursor={{ fill: '#f5f5f4' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="count" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-stone-100 shadow-sm">
              <h3 className="text-lg font-bold text-stone-900 mb-4 flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-500" /> Hiệu suất Nghệ nhân
              </h3>
              <ul className="space-y-3">
                {data.artisanPerformance.map((a, idx) => (
                  <li key={idx} className="flex justify-between items-center p-3 bg-stone-50 rounded-xl">
                    <span className="font-medium text-stone-900">{a.full_name}</span>
                    <span className="text-blue-600 font-bold">{a.completed_orders} đơn</span>
                  </li>
                ))}
                {data.artisanPerformance.length === 0 && <p className="text-sm text-stone-500">Chưa có dữ liệu</p>}
              </ul>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-stone-100 shadow-sm">
              <h3 className="text-lg font-bold text-stone-900 mb-4 flex items-center gap-2">
                <Truck className="h-5 w-5 text-purple-500" /> Hiệu suất Shipper
              </h3>
              <ul className="space-y-3">
                {data.shipperPerformance.map((s, idx) => (
                  <li key={idx} className="flex justify-between items-center p-3 bg-stone-50 rounded-xl">
                    <span className="font-medium text-stone-900">{s.full_name}</span>
                    <span className="text-purple-600 font-bold">{s.delivered_orders} đơn</span>
                  </li>
                ))}
                {data.shipperPerformance.length === 0 && <p className="text-sm text-stone-500">Chưa có dữ liệu</p>}
              </ul>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-8">
          {/* Low Stock Alert */}
          <div className="bg-white p-6 rounded-2xl border border-stone-100 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <h3 className="text-lg font-bold text-stone-900">Sắp hết hạn / Hết hàng</h3>
            </div>
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
              {data.lowStock.map(item => {
                const isOld = item.type === 'flower' && (new Date().getTime() - new Date(item.import_date).getTime()) > 3 * 24 * 60 * 60 * 1000;
                return (
                  <div key={item.id} className={`flex items-center justify-between p-3 rounded-xl border ${isOld ? 'bg-rose-50 border-rose-200' : 'bg-amber-50 border-amber-200'}`}>
                    <div className="flex items-center gap-3">
                      <Package className={`h-5 w-5 ${isOld ? 'text-rose-500' : 'text-amber-500'}`} />
                      <div>
                        <p className="text-sm font-medium text-stone-900">{item.name}</p>
                        <p className="text-xs text-stone-500">
                          {isOld ? 'Lưu kho quá 3 ngày!' : `Còn lại: ${item.quantity} ${item.unit}`}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
              {data.lowStock.length === 0 && (
                <p className="text-sm text-stone-500 text-center py-4">Kho hàng ổn định</p>
              )}
            </div>
          </div>

          {/* Popular Flowers */}
          <div className="bg-white p-6 rounded-2xl border border-stone-100 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <Star className="h-5 w-5 text-amber-500" />
              <h3 className="text-lg font-bold text-stone-900">Mẫu hoa bán chạy</h3>
            </div>
            <div className="space-y-3">
              {data.popularFlowers.map((f, idx) => (
                <div key={idx} className="flex justify-between items-center p-3 bg-stone-50 rounded-xl">
                  <span className="font-medium text-stone-900">{f.name}</span>
                  <span className="text-amber-600 font-bold">{f.total_sold} bó</span>
                </div>
              ))}
              {data.popularFlowers.length === 0 && <p className="text-sm text-stone-500">Chưa có dữ liệu</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { CheckCircle2, Clock, Truck, Check, Camera, Image as ImageIcon, Banknote } from 'lucide-react';

interface OrderDetail {
  quantity: number;
  price: number;
  name: string;
  image_url: string;
  recipe: { quantity: number; name: string; unit: string; import_date: string }[];
}

interface Order {
  id: number;
  customer_name: string;
  customer_phone: string;
  status: string;
  total_price: number;
  created_at: string;
  delivery_date: string;
  delivery_address: string;
  card_message: string;
  special_instructions: string;
  actual_image_url: string | null;
  details: OrderDetail[];
}

export function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;

  const [shippers, setShippers] = useState<any[]>([]);

  const fetchOrders = () => {
    fetch('/api/orders/staff/all')
      .then(res => res.json())
      .then(data => {
        if (user?.role_id === 3) {
          setOrders(data.filter((o: Order) => o.status === 'Đang cắm'));
        } else {
          setOrders(data);
        }
      });
  };

  useEffect(() => {
    fetchOrders();
    if (user?.role_id === 1 || user?.role_id === 2) {
      fetch('/api/shippers')
        .then(res => res.json())
        .then(data => setShippers(data))
        .catch(() => {});
    }
  }, []);

  const updateStatus = async (id: number, status: string, actual_image_url?: string, refund_transaction_id?: string, shipper_id?: number) => {
    try {
      const res = await fetch(`/api/orders/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, actual_image_url, user_id: user.id, role_id: user.role_id, refund_transaction_id, shipper_id })
      });
      if (res.ok) {
        fetchOrders();
      }
    } catch (err) {
      alert('Lỗi cập nhật trạng thái');
    }
  };

  const handleArtisanComplete = async (id: number, file: File | null) => {
    if (!file) {
      alert('Vui lòng chọn ảnh thực tế sản phẩm!');
      return;
    }

    const formData = new FormData();
    formData.append('image', file);

    try {
      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      const uploadData = await uploadRes.json();
      
      if (uploadData.success && uploadData.url) {
        updateStatus(id, 'Đã hoàn thiện thiết kế', uploadData.url);
      } else {
        alert('Lỗi upload ảnh');
      }
    } catch (err) {
      alert('Lỗi upload ảnh');
    }
  };

  const handleRefund = (id: number) => {
    const transactionId = prompt('Nhập mã giao dịch hoàn tiền (VD: VNPay-12345):');
    if (!transactionId) return;
    updateStatus(id, 'Đã hoàn tiền', undefined, transactionId);
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'Chờ duyệt': return 'bg-amber-100 text-amber-700';
      case 'Đang cắm': return 'bg-blue-100 text-blue-700';
      case 'Đã hoàn thiện thiết kế': return 'bg-indigo-100 text-indigo-700';
      case 'Đang giao': return 'bg-purple-100 text-purple-700';
      case 'Hoàn thành': return 'bg-green-100 text-green-700';
      case 'Đã hủy - Đang hoàn tiền': return 'bg-red-100 text-red-700';
      case 'Đã hoàn tiền': return 'bg-stone-200 text-stone-700';
      default: return 'bg-stone-100 text-stone-700';
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-serif font-bold text-stone-900">
          {user?.role_id === 3 ? 'Lệnh cắm hoa' : 'Quản lý đơn hàng'}
        </h1>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {orders.map(order => (
          <div key={order.id} className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-stone-100 flex flex-wrap gap-4 justify-between items-center bg-stone-50/50">
              <div>
                <p className="text-sm text-stone-500 mb-1">Mã ĐH</p>
                <p className="font-bold text-stone-900">#{order.id}</p>
              </div>
              <div>
                <p className="text-sm text-stone-500 mb-1">Khách hàng</p>
                <p className="font-medium text-stone-900">{order.customer_name} - {order.customer_phone}</p>
              </div>
              <div>
                <p className="text-sm text-stone-500 mb-1">Giao lúc</p>
                <p className="font-medium text-stone-900">{format(new Date(order.delivery_date), 'dd/MM/yyyy HH:mm')}</p>
              </div>
              <div className={`px-4 py-2 rounded-full border ${getStatusColor(order.status)}`}>
                <span className="font-medium text-sm">{order.status}</span>
              </div>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Chi tiết hoa & Công thức */}
              <div className="space-y-6">
                <h3 className="font-bold text-stone-900">Chi tiết sản phẩm</h3>
                {order.details?.map((detail, idx) => (
                  <div key={idx} className="space-y-4">
                    <div className="flex items-center gap-4">
                      <img src={detail.image_url} alt={detail.name} className="w-16 h-16 object-cover rounded-lg bg-stone-100" referrerPolicy="no-referrer" />
                      <div>
                        <h4 className="font-medium text-stone-900">{detail.name} (x{detail.quantity})</h4>
                      </div>
                    </div>
                    {user?.role_id === 3 && (
                      <div className="bg-stone-50 p-4 rounded-xl border border-stone-100">
                        <p className="text-sm font-medium text-stone-900 mb-2">Công thức cắm:</p>
                        <ul className="space-y-1">
                          {detail.recipe?.map((r, i) => (
                            <li key={i} className="text-sm text-stone-600 flex justify-between">
                              <span>{r.name}</span>
                              <span className="font-medium">{r.quantity * detail.quantity} {r.unit}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Yêu cầu & Thao tác */}
              <div className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-bold text-stone-900 mb-2">Yêu cầu cá nhân hóa</h3>
                    <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 text-amber-900 text-sm">
                      <p><strong>Thiệp:</strong> {order.card_message || 'Không có'}</p>
                      <p className="mt-2"><strong>Ghi chú:</strong> {order.special_instructions || 'Không có'}</p>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-stone-100 space-y-4">
                  {/* Nhân viên duyệt đơn */}
                  {(user?.role_id === 1 || user?.role_id === 2) && order.status === 'Chờ duyệt' && (
                    <button 
                      onClick={() => updateStatus(order.id, 'Đang cắm')}
                      className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-medium transition-colors"
                    >
                      <CheckCircle2 className="h-5 w-5" /> Duyệt đơn & Chuyển Nghệ nhân
                    </button>
                  )}

                  {/* Nghệ nhân hoàn thành */}
                  {user?.role_id === 3 && order.status === 'Đang cắm' && (
                    <div className="space-y-3">
                      <label className="block text-sm font-medium text-stone-700">Tải lên ảnh sản phẩm hoàn thiện:</label>
                      <input 
                        type="file" 
                        accept="image/*"
                        id={`artisan-upload-${order.id}`}
                        className="w-full p-2 border border-stone-300 rounded-xl text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                      />
                      <button 
                        onClick={() => {
                          const fileInput = document.getElementById(`artisan-upload-${order.id}`) as HTMLInputElement;
                          handleArtisanComplete(order.id, fileInput?.files?.[0] || null);
                        }}
                        className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-medium transition-colors"
                      >
                        <Camera className="h-5 w-5" /> Xác nhận hoàn thiện & Gửi ảnh
                      </button>
                    </div>
                  )}

                  {/* Nhân viên chuyển Shipper */}
                  {(user?.role_id === 1 || user?.role_id === 2) && order.status === 'Đã hoàn thiện thiết kế' && (
                    <div className="flex gap-2">
                      <select 
                        id={`shipper-select-${order.id}`}
                        className="flex-1 p-3 border border-stone-300 rounded-xl text-sm"
                      >
                        <option value="">-- Chọn Shipper --</option>
                        {shippers.map(s => (
                          <option key={s.id} value={s.id}>{s.full_name} ({s.phone})</option>
                        ))}
                      </select>
                      <button 
                        onClick={() => {
                          const select = document.getElementById(`shipper-select-${order.id}`) as HTMLSelectElement;
                          if (!select.value) {
                            alert('Vui lòng chọn Shipper');
                            return;
                          }
                          updateStatus(order.id, 'Đang giao', undefined, undefined, parseInt(select.value));
                        }}
                        className="flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl font-medium transition-colors"
                      >
                        <Truck className="h-5 w-5" /> Giao
                      </button>
                    </div>
                  )}

                  {(user?.role_id === 1 || user?.role_id === 2) && (order.status === 'Chờ duyệt' || order.status === 'Đang cắm') && (
                    <button 
                      onClick={() => updateStatus(order.id, 'Đã hủy - Đang hoàn tiền')}
                      className="w-full flex items-center justify-center gap-2 bg-red-100 hover:bg-red-200 text-red-700 py-3 rounded-xl font-medium transition-colors"
                    >
                      Hủy đơn
                    </button>
                  )}

                  {(user?.role_id === 1 || user?.role_id === 2) && order.status === 'Đã hủy - Đang hoàn tiền' && (
                    <button 
                      onClick={() => handleRefund(order.id)}
                      className="w-full flex items-center justify-center gap-2 bg-stone-800 hover:bg-stone-900 text-white py-3 rounded-xl font-medium transition-colors"
                    >
                      <Banknote className="h-5 w-5" /> Xác nhận đã hoàn tiền
                    </button>
                  )}

                  {order.actual_image_url && (
                    <div className="bg-stone-50 p-4 rounded-xl">
                      <p className="text-sm font-medium text-stone-900 mb-2 flex items-center gap-2">
                        <ImageIcon className="h-4 w-4" /> Ảnh thực tế sản phẩm
                      </p>
                      <img src={order.actual_image_url} alt="Actual product" className="w-full h-48 object-cover rounded-lg" referrerPolicy="no-referrer" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

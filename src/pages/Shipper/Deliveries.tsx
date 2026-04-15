import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { MapPin, Camera, Navigation, CreditCard } from 'lucide-react';

interface Order {
  id: number;
  customer_name: string;
  customer_phone: string;
  status: string;
  delivery_date: string;
  delivery_address: string;
  distance?: number;
  payment_method?: string;
  total_price?: number;
}

export function Deliveries() {
  const [orders, setOrders] = useState<Order[]>([]);
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;

  const fetchOrders = () => {
    fetch(`/api/orders/staff/all?user_id=${user?.id}&role_id=${user?.role_id}`)
      .then(res => res.json())
      .then(data => {
        const deliveringOrders = data
          .filter((o: Order) => o.status === 'Đang giao')
          .map((o: Order) => ({
            ...o,
            distance: Math.floor(Math.random() * 10) + 1 // Giả lập khoảng cách 1-10km
          }));
        setOrders(deliveringOrders);
      });
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const completeDelivery = async (id: number, file: File | null) => {
    if (!file) {
      alert('Vui lòng chụp/chọn ảnh bàn giao (POD)!');
      return;
    }

    const order = orders.find(o => o.id === id);
    const isCOD = order?.payment_method === 'COD';
    
    if (isCOD) {
      const confirmCOD = window.confirm(`Bạn đã nhận đủ tiền mặt (COD) ${order?.total_price?.toLocaleString('vi-VN')}đ từ khách hàng chưa?`);
      if (!confirmCOD) return;
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
        const res = await fetch(`/api/orders/${id}/status`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            status: 'Hoàn thành', 
            pod_image_url: uploadData.url, 
            user_id: user.id, 
            role_id: user.role_id,
            is_cod_collected: isCOD ? 1 : 0
          })
        });
        if (res.ok) {
          alert('Đã cập nhật giao hàng thành công!');
          fetchOrders();
        }
      } else {
        alert('Lỗi upload ảnh POD');
      }
    } catch (err) {
      alert('Lỗi cập nhật trạng thái');
    }
  };

  const maskPhone = (phone: string) => {
    if (!phone || phone.length < 4) return phone;
    return phone.substring(0, phone.length - 4) + '****';
  };

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-serif font-bold text-stone-900">Đơn cần giao</h1>
      </div>

      <div className="space-y-4">
        {orders.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-stone-100">
            <p className="text-stone-500">Không có đơn hàng nào cần giao lúc này.</p>
          </div>
        ) : (
          orders.map(order => (
            <div key={order.id} className="bg-white p-6 rounded-2xl border border-stone-100 shadow-sm space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-lg text-stone-900">Đơn hàng #{order.id}</h3>
                  <p className="text-sm text-stone-500">Hẹn giao: {format(new Date(order.delivery_date), 'dd/MM/yyyy HH:mm')}</p>
                </div>
                <span className="px-3 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
                  Đang giao
                </span>
              </div>

              <div className="bg-stone-50 p-4 rounded-xl space-y-3">
                <div className="flex gap-3">
                  <MapPin className="h-5 w-5 text-stone-400 shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-stone-900">{order.customer_name} - {maskPhone(order.customer_phone)}</p>
                    <p className="text-sm text-stone-600">{order.delivery_address}</p>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-lg">
                      <Navigation className="h-3 w-3" /> {order.distance} km
                    </span>
                  </div>
                </div>
                {order.payment_method === 'COD' && (
                  <div className="mt-3 bg-amber-50 p-3 rounded-lg border border-amber-100 flex items-center gap-2 text-amber-800">
                    <CreditCard className="h-5 w-5" />
                    <span className="font-medium">Thu hộ COD: {order.total_price?.toLocaleString('vi-VN')}đ</span>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-3 pt-2">
                <label className="block text-sm font-medium text-stone-700">Tải lên ảnh bàn giao (POD):</label>
                <input 
                  type="file" 
                  accept="image/*"
                  id={`shipper-upload-${order.id}`}
                  className="w-full p-2 border border-stone-300 rounded-xl text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                />
                <button 
                  onClick={() => {
                    const fileInput = document.getElementById(`shipper-upload-${order.id}`) as HTMLInputElement;
                    completeDelivery(order.id, fileInput?.files?.[0] || null);
                  }}
                  className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-medium transition-colors"
                >
                  <Camera className="h-5 w-5" />
                  Xác nhận & Hoàn thành
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

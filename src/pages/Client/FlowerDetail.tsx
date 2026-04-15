import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { ArrowLeft, ShoppingBag } from 'lucide-react';

interface FlowerDetail {
  id: number;
  name: string;
  description: string;
  price: number;
  image_url: string;
  category: string;
  recipe: { quantity: number; name: string; unit: string }[];
}

export function FlowerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [flower, setFlower] = useState<FlowerDetail | null>(null);
  const [cardMessage, setCardMessage] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [isOrdering, setIsOrdering] = useState(false);

  useEffect(() => {
    fetch(`/api/flowers/${id}`)
      .then(res => res.json())
      .then(data => setFlower(data));
  }, [id]);

  const handleOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      alert('Vui lòng đăng nhập để đặt hàng');
      navigate('/login');
      return;
    }
    const user = JSON.parse(userStr);

    setIsOrdering(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: user.id,
          model_id: flower?.id,
          quantity: 1,
          card_message: cardMessage,
          special_instructions: specialInstructions,
          delivery_address: deliveryAddress,
          delivery_date: deliveryDate,
          total_price: flower?.price
        })
      });
      const data = await res.json();
      if (data.success) {
        alert('Đặt hàng thành công! Đơn hàng đang chờ duyệt.');
        navigate('/');
      }
    } catch (err) {
      alert('Có lỗi xảy ra khi đặt hàng');
    } finally {
      setIsOrdering(false);
    }
  };

  if (!flower) return <div className="py-12 text-center text-stone-500">Đang tải...</div>;

  return (
    <div className="max-w-5xl mx-auto">
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-stone-500 hover:text-stone-900 mb-8 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Quay lại</span>
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Image Column */}
        <div className="space-y-6">
          <div className="aspect-[4/5] rounded-3xl overflow-hidden bg-stone-100">
            <img 
              src={flower.image_url} 
              alt={flower.name}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          
          <div className="bg-white p-6 rounded-2xl border border-stone-100 shadow-sm">
            <h3 className="font-medium text-stone-900 mb-4">Thành phần hoa (Công thức)</h3>
            <ul className="space-y-2">
              {flower.recipe.map((item, idx) => (
                <li key={idx} className="flex justify-between text-sm">
                  <span className="text-stone-600">{item.name}</span>
                  <span className="font-medium text-stone-900">{item.quantity} {item.unit}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Info & Form Column */}
        <div>
          <div className="mb-8 border-b border-stone-200 pb-8">
            <div className="flex items-center gap-3 mb-3">
              <span className="px-3 py-1 bg-rose-50 text-rose-600 text-xs font-medium rounded-full">
                {flower.category}
              </span>
            </div>
            <h1 className="text-4xl font-serif font-bold text-stone-900 mb-4">{flower.name}</h1>
            <p className="text-3xl text-rose-600 font-medium mb-6">{flower.price.toLocaleString('vi-VN')}đ</p>
            <p className="text-stone-600 leading-relaxed">{flower.description}</p>
          </div>

          <form onSubmit={handleOrder} className="space-y-6">
            <h3 className="text-xl font-serif font-bold text-stone-900">Thông tin giao hàng</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Địa chỉ giao hàng *</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-2.5 border border-stone-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none transition-all"
                  placeholder="Ví dụ: 123 Lê Duẩn, Hải Châu, Đà Nẵng"
                  value={deliveryAddress}
                  onChange={e => setDeliveryAddress(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Thời gian giao hàng *</label>
                <input
                  type="datetime-local"
                  required
                  className="w-full px-4 py-2.5 border border-stone-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none transition-all"
                  value={deliveryDate}
                  onChange={e => setDeliveryDate(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Nội dung thiệp chúc mừng</label>
                <textarea
                  rows={3}
                  className="w-full px-4 py-2.5 border border-stone-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none transition-all resize-none"
                  placeholder="Nhập lời chúc của bạn..."
                  value={cardMessage}
                  onChange={e => setCardMessage(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Yêu cầu đặc biệt</label>
                <textarea
                  rows={2}
                  className="w-full px-4 py-2.5 border border-stone-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none transition-all resize-none"
                  placeholder="Ví dụ: Giao cho lễ tân, gọi trước khi giao..."
                  value={specialInstructions}
                  onChange={e => setSpecialInstructions(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Phương thức thanh toán *</label>
                <select
                  className="w-full px-4 py-2.5 border border-stone-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none transition-all bg-white"
                >
                  <option value="cod">Thanh toán khi nhận hàng (COD)</option>
                  <option value="bank">Chuyển khoản ngân hàng</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={isOrdering}
              className="w-full flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-700 text-white py-4 rounded-xl font-medium text-lg transition-colors disabled:opacity-70"
            >
              <ShoppingBag className="h-5 w-5" />
              {isOrdering ? 'Đang xử lý...' : 'Đặt hàng ngay'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

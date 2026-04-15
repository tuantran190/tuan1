import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { Package, MapPin, Calendar, CheckCircle2, Clock, Truck, Image as ImageIcon, Star, Gift, Ticket } from 'lucide-react';

interface OrderDetail {
  quantity: number;
  price: number;
  name: string;
  image_url: string;
}

interface Order {
  id: number;
  status: string;
  total_price: number;
  created_at: string;
  delivery_date: string;
  delivery_address: string;
  card_message: string;
  special_instructions: string;
  actual_image_url: string | null;
  pod_image_url: string | null;
  refund_transaction_id: string | null;
  details: OrderDetail[];
}

interface ProfileData {
  points: number;
  discounts: { id: number; code: string; discount_percent: number }[];
}

const TIMELINE_STEPS = [
  { status: 'Chờ duyệt', label: 'Chờ duyệt' },
  { status: 'Đang cắm', label: 'Đang cắm hoa' },
  { status: 'Đã hoàn thiện thiết kế', label: 'Hoàn thiện' },
  { status: 'Đang giao', label: 'Đang giao' },
  { status: 'Hoàn thành', label: 'Hoàn thành' }
];

export function CustomerProfile() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [reviewingOrder, setReviewingOrder] = useState<number | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [reviewImage, setReviewImage] = useState('');
  const [reviews, setReviews] = useState<Record<number, any>>({});

  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;

  useEffect(() => {
    if (user) {
      fetch(`/api/orders/customer/${user.id}`)
        .then(res => res.json())
        .then(data => {
          setOrders(data);
          data.forEach((o: Order) => {
            if (o.status === 'Hoàn thành') {
              fetch(`/api/orders/${o.id}/review`)
                .then(r => r.json())
                .then(rev => {
                  if (rev) setReviews(prev => ({ ...prev, [o.id]: rev }));
                });
            }
          });
        });

      fetch(`/api/customer/${user.id}/profile`)
        .then(res => res.json())
        .then(data => setProfileData(data));
    }
  }, [user]);

  if (!user) return <div className="py-12 text-center">Vui lòng đăng nhập</div>;

  const getStepIndex = (status: string) => {
    return TIMELINE_STEPS.findIndex(s => s.status === status);
  };

  const handleReviewImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
        setReviewImage(data.url);
      } else {
        alert('Lỗi upload ảnh');
      }
    } catch (err) {
      alert('Lỗi upload ảnh');
    }
  };

  const submitReview = async (orderId: number) => {
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: orderId, rating, comment, image_url: reviewImage })
      });
      if (res.ok) {
        alert('Cảm ơn bạn đã đánh giá!');
        setReviewingOrder(null);
        fetch(`/api/orders/${orderId}/review`)
          .then(r => r.json())
          .then(rev => {
            if (rev) setReviews(prev => ({ ...prev, [orderId]: rev }));
          });
      }
    } catch (e) {
      alert('Lỗi gửi đánh giá');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="bg-white p-8 rounded-2xl border border-stone-100 shadow-sm flex flex-col md:flex-row items-center gap-8">
        <div className="flex items-center gap-6">
          <div className="h-24 w-24 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center text-4xl font-serif font-bold">
            {user.full_name.charAt(0)}
          </div>
          <div>
            <h1 className="text-2xl font-serif font-bold text-stone-900">{user.full_name}</h1>
            <p className="text-stone-500">{user.phone}</p>
          </div>
        </div>
        
        {profileData && (
          <div className="flex-1 grid grid-cols-2 gap-4 w-full">
            <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 flex items-center gap-3">
              <Gift className="h-8 w-8 text-amber-500" />
              <div>
                <p className="text-sm font-medium text-amber-900">Điểm tích lũy</p>
                <p className="text-xl font-bold text-amber-700">{profileData.points} điểm</p>
              </div>
            </div>
            <div className="bg-rose-50 p-4 rounded-xl border border-rose-100 flex items-center gap-3">
              <Ticket className="h-8 w-8 text-rose-500" />
              <div>
                <p className="text-sm font-medium text-rose-900">Mã giảm giá</p>
                <p className="text-xl font-bold text-rose-700">{profileData.discounts.length} mã</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {profileData && profileData.discounts.length > 0 && (
        <div className="bg-white p-6 rounded-2xl border border-stone-100 shadow-sm">
          <h3 className="font-bold text-stone-900 mb-4 flex items-center gap-2">
            <Ticket className="h-5 w-5 text-rose-500" /> Mã giảm giá của bạn
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {profileData.discounts.map(d => (
              <div key={d.id} className="border border-rose-200 bg-rose-50 rounded-xl p-4 flex justify-between items-center border-dashed">
                <span className="font-mono font-bold text-rose-700">{d.code}</span>
                <span className="text-sm font-medium text-rose-600">Giảm {d.discount_percent}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-6">
        <h2 className="text-xl font-serif font-bold text-stone-900">Lịch sử đơn hàng</h2>
        
        {orders.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-stone-100">
            <Package className="h-12 w-12 text-stone-300 mx-auto mb-4" />
            <p className="text-stone-500">Bạn chưa có đơn hàng nào.</p>
          </div>
        ) : (
          orders.map(order => {
            const currentStepIdx = getStepIndex(order.status);
            const isCancelled = order.status.includes('hủy') || order.status.includes('hoàn tiền');
            
            return (
              <div key={order.id} className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-stone-100 flex flex-wrap gap-4 justify-between items-center bg-stone-50/50">
                  <div>
                    <p className="text-sm text-stone-500 mb-1">Mã đơn hàng</p>
                    <p className="font-bold text-stone-900">#{order.id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-stone-500 mb-1">Ngày đặt</p>
                    <p className="font-medium text-stone-900">{format(new Date(order.created_at), 'dd/MM/yyyy HH:mm')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-stone-500 mb-1">Tổng tiền</p>
                    <p className="font-bold text-rose-600">{order.total_price.toLocaleString('vi-VN')}đ</p>
                  </div>
                  <div className={`px-4 py-2 rounded-full border ${isCancelled ? 'bg-red-50 text-red-700 border-red-200' : 'bg-stone-100 text-stone-700'}`}>
                    <span className="font-medium text-sm">{order.status}</span>
                  </div>
                </div>

                <div className="p-6">
                  {/* Timeline */}
                  {!isCancelled && (
                    <div className="mb-8 relative mt-4 px-4">
                      <div className="absolute top-1/2 left-4 right-4 h-1 bg-stone-100 -translate-y-1/2 rounded-full"></div>
                      <div className="absolute top-1/2 left-4 h-1 bg-rose-500 -translate-y-1/2 rounded-full transition-all duration-500" 
                           style={{ width: `calc(${(currentStepIdx / (TIMELINE_STEPS.length - 1)) * 100}% - 2rem)` }}></div>
                      
                      <div className="relative flex justify-between">
                        {TIMELINE_STEPS.map((step, idx) => {
                          const isCompleted = idx <= currentStepIdx;
                          const isCurrent = idx === currentStepIdx;
                          return (
                            <div key={step.status} className="flex flex-col items-center gap-2">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center relative z-10 transition-colors ${
                                isCompleted ? 'bg-rose-500 text-white' : 'bg-stone-200 text-stone-400'
                              } ${isCurrent ? 'ring-4 ring-rose-100' : ''}`}>
                                {isCompleted ? <CheckCircle2 className="h-5 w-5" /> : <div className="w-2.5 h-2.5 rounded-full bg-current"></div>}
                              </div>
                              <span className={`text-xs font-medium ${isCompleted ? 'text-stone-900' : 'text-stone-400'} hidden sm:block`}>
                                {step.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {isCancelled && order.refund_transaction_id && (
                    <div className="mb-6 bg-red-50 p-4 rounded-xl border border-red-100 text-red-800 text-sm">
                      <strong>Mã giao dịch hoàn tiền:</strong> {order.refund_transaction_id}
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <h3 className="font-bold text-stone-900 mb-4">Sản phẩm</h3>
                      {order.details.map((detail, idx) => (
                        <div key={idx} className="flex items-center gap-4">
                          <img src={detail.image_url} alt={detail.name} className="w-16 h-16 object-cover rounded-xl bg-stone-100" referrerPolicy="no-referrer" />
                          <div className="flex-1">
                            <h4 className="font-medium text-stone-900">{detail.name}</h4>
                            <p className="text-sm text-stone-500">Số lượng: {detail.quantity}</p>
                          </div>
                          <p className="font-medium text-stone-900">{(detail.price * detail.quantity).toLocaleString('vi-VN')}đ</p>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-6">
                      <div className="bg-stone-50 p-4 rounded-xl space-y-3">
                        <div className="flex items-start gap-3">
                          <MapPin className="h-5 w-5 text-stone-400 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-stone-900">Địa chỉ giao hàng</p>
                            <p className="text-sm text-stone-600">{order.delivery_address}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <Clock className="h-5 w-5 text-stone-400 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-stone-900">Thời gian hẹn giao</p>
                            <p className="text-sm text-stone-600">{format(new Date(order.delivery_date), 'dd/MM/yyyy HH:mm')}</p>
                          </div>
                        </div>
                      </div>

                      {order.actual_image_url && (
                        <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                          <p className="text-sm font-medium text-indigo-900 mb-2 flex items-center gap-2">
                            <ImageIcon className="h-4 w-4" /> Ảnh thực tế sản phẩm
                          </p>
                          <img src={order.actual_image_url} alt="Actual product" className="w-full h-40 object-cover rounded-lg" referrerPolicy="no-referrer" />
                        </div>
                      )}

                      {order.pod_image_url && (
                        <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                          <p className="text-sm font-medium text-green-900 mb-2 flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4" /> Ảnh xác nhận giao hàng (POD)
                          </p>
                          <img src={order.pod_image_url} alt="POD" className="w-full h-40 object-cover rounded-lg" referrerPolicy="no-referrer" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Review Section */}
                  {order.status === 'Hoàn thành' && (
                    <div className="mt-8 pt-6 border-t border-stone-100">
                      {reviews[order.id] ? (
                        <div className="bg-stone-50 p-6 rounded-xl">
                          <h4 className="font-bold text-stone-900 mb-2 flex items-center gap-2">
                            <Star className="h-5 w-5 text-amber-400 fill-current" /> Đánh giá của bạn
                          </h4>
                          <div className="flex gap-1 mb-3">
                            {[1,2,3,4,5].map(star => (
                              <Star key={star} className={`h-4 w-4 ${star <= reviews[order.id].rating ? 'text-amber-400 fill-current' : 'text-stone-300'}`} />
                            ))}
                          </div>
                          <p className="text-stone-700 text-sm mb-3">{reviews[order.id].comment}</p>
                          {reviews[order.id].image_url && (
                            <img src={reviews[order.id].image_url} alt="Review" className="w-24 h-24 object-cover rounded-lg" referrerPolicy="no-referrer" />
                          )}
                        </div>
                      ) : reviewingOrder === order.id ? (
                        <div className="bg-stone-50 p-6 rounded-xl space-y-4">
                          <h4 className="font-bold text-stone-900">Đánh giá & Khiếu nại</h4>
                          <div className="flex gap-2">
                            {[1,2,3,4,5].map(star => (
                              <button key={star} onClick={() => setRating(star)}>
                                <Star className={`h-6 w-6 ${star <= rating ? 'text-amber-400 fill-current' : 'text-stone-300'}`} />
                              </button>
                            ))}
                          </div>
                          <textarea 
                            className="w-full p-3 rounded-xl border border-stone-200 text-sm"
                            rows={3}
                            placeholder="Chia sẻ cảm nhận của bạn hoặc mô tả vấn đề nếu hoa bị lỗi..."
                            value={comment}
                            onChange={e => setComment(e.target.value)}
                          />
                          <div>
                            <label className="block text-xs font-medium text-stone-700 mb-1">Ảnh đính kèm (nếu có)</label>
                            <input 
                              type="file" 
                              accept="image/*"
                              onChange={handleReviewImageUpload}
                              className="w-full p-2 border border-stone-200 rounded-xl text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-rose-50 file:text-rose-700 hover:file:bg-rose-100"
                            />
                            {reviewImage && (
                              <img src={reviewImage} alt="Preview" className="mt-2 h-20 w-20 object-cover rounded-lg border border-stone-200" referrerPolicy="no-referrer" />
                            )}
                          </div>
                          <div className="flex gap-3">
                            <button 
                              onClick={() => submitReview(order.id)}
                              className="px-6 py-2 bg-rose-600 text-white rounded-xl font-medium hover:bg-rose-700"
                            >
                              Gửi đánh giá
                            </button>
                            <button 
                              onClick={() => setReviewingOrder(null)}
                              className="px-6 py-2 bg-stone-200 text-stone-700 rounded-xl font-medium hover:bg-stone-300"
                            >
                              Hủy
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button 
                          onClick={() => setReviewingOrder(order.id)}
                          className="flex items-center gap-2 text-rose-600 font-medium hover:text-rose-700"
                        >
                          <Star className="h-5 w-5" /> Viết đánh giá / Khiếu nại
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

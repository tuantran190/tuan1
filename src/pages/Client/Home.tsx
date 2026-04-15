import { useEffect, useState } from 'react';
import { Link } from 'react-router';

interface Flower {
  id: number;
  name: string;
  description: string;
  price: number;
  image_url: string;
  category: string;
}

export function Home() {
  const [flowers, setFlowers] = useState<Flower[]>([]);

  useEffect(() => {
    fetch('/api/flowers')
      .then(res => res.json())
      .then(data => setFlowers(data));
  }, []);

  return (
    <div className="space-y-12">
      <section className="text-center space-y-4 py-12">
        <h1 className="text-4xl md:text-5xl font-serif font-bold text-stone-900">
          Trao gửi yêu thương qua từng đóa hoa
        </h1>
        <p className="text-lg text-stone-500 max-w-2xl mx-auto">
          Hoa 18 Đà Nẵng mang đến những thiết kế hoa tươi tinh tế nhất cho mọi dịp đặc biệt của bạn.
        </p>
      </section>

      <section>
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-serif font-bold text-stone-900">Mẫu hoa nổi bật</h2>
          <div className="flex gap-2">
            {['Tất cả', 'Sinh nhật', 'Tình yêu', 'Khai trương'].map(cat => (
              <button key={cat} className="px-4 py-1.5 rounded-full text-sm font-medium bg-stone-100 text-stone-600 hover:bg-rose-50 hover:text-rose-600 transition-colors">
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {flowers.map(flower => (
            <Link key={flower.id} to={`/flower/${flower.id}`} className="group block">
              <div className="aspect-[4/5] overflow-hidden rounded-2xl bg-stone-100 mb-4">
                <img 
                  src={flower.image_url} 
                  alt={flower.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="space-y-1">
                <div className="flex justify-between items-start">
                  <h3 className="font-medium text-stone-900 text-lg">{flower.name}</h3>
                  <span className="text-rose-600 font-medium">{flower.price.toLocaleString('vi-VN')}đ</span>
                </div>
                <p className="text-sm text-stone-500 line-clamp-2">{flower.description}</p>
                <span className="inline-block px-2.5 py-1 bg-stone-100 text-stone-600 text-xs rounded-md mt-2">
                  {flower.category}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

import express from 'express';
import cors from 'cors';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { db } from './src/server/db.js';

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());
  
  // Serve uploaded files
  app.use('/uploads', express.static(uploadsDir));

  // Upload endpoint
  app.post('/api/upload', upload.single('image'), (req, res) => {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }
    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({ success: true, url: fileUrl });
  });

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  // Auth
  app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;
    const user = db.prepare('SELECT * FROM TaiKhoan WHERE username = ? AND password = ?').get(username, password);
    if (user) {
      res.json({ success: true, user });
    } else {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
  });

  app.post('/api/auth/register', (req, res) => {
    const { username, password, full_name, phone } = req.body;
    try {
      // role_id = 5 là Khách hàng
      const result = db.prepare('INSERT INTO TaiKhoan (username, password, role_id, full_name, phone) VALUES (?, ?, 5, ?, ?)').run(username, password, full_name, phone);
      const user = db.prepare('SELECT * FROM TaiKhoan WHERE id = ?').get(result.lastInsertRowid);
      res.json({ success: true, user });
    } catch (error) {
      console.error('Register error:', error);
      res.status(400).json({ success: false, message: 'Tên đăng nhập đã tồn tại hoặc lỗi dữ liệu' });
    }
  });

  // Flowers
  app.get('/api/flowers', (req, res) => {
    const flowers = db.prepare('SELECT * FROM MauHoa').all();
    res.json(flowers);
  });

  app.get('/api/flowers/:id', (req, res) => {
    const flower = db.prepare('SELECT * FROM MauHoa WHERE id = ?').get(req.params.id) as any;
    if (flower) {
      const recipe = db.prepare(`
        SELECT c.quantity, n.name, n.unit 
        FROM CongThucCamHoa c
        JOIN NguyenLieu_PhuKien n ON c.material_id = n.id
        WHERE c.model_id = ?
      `).all(flower.id);
      res.json({ ...flower, recipe });
    } else {
      res.status(404).json({ message: 'Flower not found' });
    }
  });

  // Orders
  app.post('/api/orders', (req, res) => {
    const { customer_id, model_id, quantity, card_message, special_instructions, delivery_address, delivery_date, total_price, payment_method } = req.body;
    
    try {
      db.prepare('BEGIN').run();
      
      const result = db.prepare(`
        INSERT INTO DonHang (customer_id, status, total_price, delivery_date, delivery_address, card_message, special_instructions, payment_method)
        VALUES (?, 'Chờ duyệt', ?, ?, ?, ?, ?, ?)
      `).run(customer_id, total_price, delivery_date, delivery_address, card_message, special_instructions, payment_method || 'COD');
      
      const orderId = result.lastInsertRowid;
      
      db.prepare(`
        INSERT INTO ChiTietDonHang (order_id, model_id, quantity, price)
        VALUES (?, ?, ?, ?)
      `).run(orderId, model_id, quantity, total_price / quantity);
      
      db.prepare('INSERT INTO AuditLog (order_id, user_id, old_status, new_status) VALUES (?, ?, ?, ?)').run(orderId, customer_id, null, 'Chờ duyệt');

      db.prepare('COMMIT').run();
      res.json({ success: true, orderId });
    } catch (error) {
      db.prepare('ROLLBACK').run();
      console.error('Create order error:', error);
      res.status(500).json({ success: false, error: 'Failed to create order' });
    }
  });

  app.get('/api/orders/staff/all', (req, res) => {
    const userId = req.query.user_id;
    const roleId = req.query.role_id;

    let query = `
      SELECT d.*, t.full_name as customer_name, t.phone as customer_phone
      FROM DonHang d
      JOIN TaiKhoan t ON d.customer_id = t.id
    `;
    const params: any[] = [];

    if (roleId === '4') { // Shipper
      query += ` WHERE d.shipper_id = ?`;
      params.push(userId);
    }

    query += ` ORDER BY d.created_at DESC`;

    const orders = db.prepare(query).all(...params) as any[];

    const ordersWithDetails = orders.map(order => {
      const details = db.prepare(`
        SELECT c.quantity, c.price, m.name, m.image_url, m.id as model_id
        FROM ChiTietDonHang c
        JOIN MauHoa m ON c.model_id = m.id
        WHERE c.order_id = ?
      `).all(order.id) as any[];

      const detailsWithRecipe = details.map(detail => {
        const recipe = db.prepare(`
          SELECT c.quantity, n.name, n.unit, n.import_date
          FROM CongThucCamHoa c
          JOIN NguyenLieu_PhuKien n ON c.material_id = n.id
          WHERE c.model_id = ?
          ORDER BY n.import_date ASC
        `).all(detail.model_id);
        return { ...detail, recipe };
      });

      return { ...order, details: detailsWithRecipe };
    });
    
    res.json(ordersWithDetails);
  });

  app.get('/api/shippers', (req, res) => {
    const shippers = db.prepare('SELECT id, full_name, phone FROM TaiKhoan WHERE role_id = 4').all();
    res.json(shippers);
  });

  app.get('/api/orders/customer/:id', (req, res) => {
    const orders = db.prepare(`
      SELECT d.*, p.pod_image_url
      FROM DonHang d
      LEFT JOIN PhieuGiaoHang p ON d.id = p.order_id
      WHERE d.customer_id = ?
      ORDER BY d.created_at DESC
    `).all(req.params.id) as any[];

    const ordersWithDetails = orders.map(order => {
      const details = db.prepare(`
        SELECT c.quantity, c.price, m.name, m.image_url
        FROM ChiTietDonHang c
        JOIN MauHoa m ON c.model_id = m.id
        WHERE c.order_id = ?
      `).all(order.id);
      return { ...order, details };
    });
    
    res.json(ordersWithDetails);
  });

  // Artisan updates order to "Đã hoàn thiện thiết kế" -> deduct inventory
  // Shipper updates order to "Hoàn thành" -> upload POD
  app.put('/api/orders/:id/status', (req, res) => {
    const { status, pod_image_url, actual_image_url, user_id, role_id, is_cod_collected, refund_transaction_id } = req.body;
    const orderId = req.params.id;
    
    try {
      db.prepare('BEGIN').run();
      
      const oldOrder = db.prepare('SELECT status, customer_id, total_price FROM DonHang WHERE id = ?').get(orderId) as any;
      const oldStatus = oldOrder?.status;

      let updateQuery = 'UPDATE DonHang SET status = ?';
      const params: any[] = [status];

      if (status === 'Đã hoàn thiện thiết kế' && role_id === 3) {
        updateQuery += ', artisan_id = ?, actual_image_url = ?';
        params.push(user_id, actual_image_url);
      } else if (status === 'Đang giao' && (role_id === 1 || role_id === 2)) {
        // Staff assigning to shipper
        if (req.body.shipper_id) {
          updateQuery += ', shipper_id = ?';
          params.push(req.body.shipper_id);
        }
      } else if (status === 'Hoàn thành' && role_id === 4) {
        // Shipper completing delivery
        if (is_cod_collected) {
          updateQuery += ', is_cod_collected = 1';
        }
      } else if (status === 'Đã hoàn tiền') {
        updateQuery += ', refund_transaction_id = ?';
        params.push(refund_transaction_id);
      }

      updateQuery += ' WHERE id = ?';
      params.push(orderId);

      db.prepare(updateQuery).run(...params);
      
      if (status === 'Đã hoàn thiện thiết kế') {
        // Deduct inventory ONLY when artisan completes design
        const details = db.prepare('SELECT model_id, quantity FROM ChiTietDonHang WHERE order_id = ?').all(orderId) as any[];
        for (const detail of details) {
          const recipe = db.prepare('SELECT material_id, quantity FROM CongThucCamHoa WHERE model_id = ?').all(detail.model_id) as any[];
          for (const item of recipe) {
            const totalNeeded = item.quantity * detail.quantity;
            db.prepare('UPDATE NguyenLieu_PhuKien SET quantity = quantity - ? WHERE id = ?').run(totalNeeded, item.material_id);
          }
        }
      }

      if (status === 'Hoàn thành' && pod_image_url) {
         db.prepare('INSERT INTO PhieuGiaoHang (order_id, shipper_id, status, pod_image_url) VALUES (?, ?, ?, ?)').run(orderId, user_id, status, pod_image_url);
         // Add points to customer (1 point per 1000 VND)
         if (oldOrder) {
           const pointsToAdd = Math.floor(oldOrder.total_price / 1000);
           db.prepare('UPDATE TaiKhoan SET points = points + ? WHERE id = ?').run(pointsToAdd, oldOrder.customer_id);
         }
      }
      
      // Audit Log
      const logImageUrl = actual_image_url || pod_image_url || null;
      db.prepare('INSERT INTO AuditLog (order_id, user_id, old_status, new_status, image_url) VALUES (?, ?, ?, ?, ?)').run(orderId, user_id, oldStatus, status, logImageUrl);

      db.prepare('COMMIT').run();
      res.json({ success: true });
    } catch (error) {
      db.prepare('ROLLBACK').run();
      console.error('Update status error:', error);
      res.status(500).json({ success: false, error: 'Failed to update order status' });
    }
  });

  // Customer Profile Data (Points, Discounts)
  app.get('/api/customer/:id/profile', (req, res) => {
    const user = db.prepare('SELECT points FROM TaiKhoan WHERE id = ?').get(req.params.id) as any;
    const discounts = db.prepare('SELECT * FROM MaGiamGia WHERE user_id = ? AND is_used = 0').all(req.params.id);
    res.json({ points: user?.points || 0, discounts });
  });

  // Submit Review
  app.post('/api/reviews', (req, res) => {
    const { order_id, rating, comment, image_url } = req.body;
    try {
      db.prepare('INSERT INTO DanhGiaKhieuNai (order_id, rating, comment, image_url) VALUES (?, ?, ?, ?)').run(order_id, rating, comment, image_url);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to submit review' });
    }
  });

  // Get Reviews for an order
  app.get('/api/orders/:id/review', (req, res) => {
    const review = db.prepare('SELECT * FROM DanhGiaKhieuNai WHERE order_id = ?').get(req.params.id);
    res.json(review || null);
  });

  // Admin: Update Flower Details
  app.put('/api/admin/flowers/:id', (req, res) => {
    const { name, price, image_url } = req.body;
    try {
      db.prepare('UPDATE MauHoa SET name = ?, price = ?, image_url = ? WHERE id = ?').run(name, price, image_url, req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to update flower details' });
    }
  });

  // Admin: Goods Receipt (Phiếu nhập hàng)
  app.post('/api/admin/inventory/receipt', (req, res) => {
    const { material_id, quantity } = req.body;
    try {
      db.prepare('BEGIN').run();
      db.prepare('INSERT INTO PhieuNhapHang (material_id, quantity) VALUES (?, ?)').run(material_id, quantity);
      db.prepare('UPDATE NguyenLieu_PhuKien SET quantity = quantity + ?, import_date = CURRENT_TIMESTAMP WHERE id = ?').run(quantity, material_id);
      db.prepare('COMMIT').run();
      res.json({ success: true });
    } catch (error) {
      db.prepare('ROLLBACK').run();
      res.status(500).json({ success: false, error: 'Failed to create receipt' });
    }
  });

  // Admin Dashboard
  app.get('/api/admin/dashboard', (req, res) => {
    const revenue = db.prepare("SELECT SUM(total_price) as total FROM DonHang WHERE status = 'Hoàn thành'").get() as any;
    
    // Low stock or expiring flowers (> 3 days)
    const lowStock = db.prepare(`
      SELECT * FROM NguyenLieu_PhuKien 
      WHERE quantity < 10 
         OR (type = 'flower' AND julianday('now') - julianday(import_date) > 3)
    `).all();
    
    const ordersByStatus = db.prepare("SELECT status, COUNT(*) as count FROM DonHang GROUP BY status").all();
    
    // Performance stats
    const artisanPerformance = db.prepare(`
      SELECT t.full_name, COUNT(d.id) as completed_orders
      FROM DonHang d
      JOIN TaiKhoan t ON d.artisan_id = t.id
      WHERE d.status IN ('Đã hoàn thiện thiết kế', 'Đang giao', 'Hoàn thành')
      GROUP BY t.id
    `).all();

    const shipperPerformance = db.prepare(`
      SELECT t.full_name, COUNT(d.id) as delivered_orders
      FROM DonHang d
      JOIN TaiKhoan t ON d.shipper_id = t.id
      WHERE d.status = 'Hoàn thành'
      GROUP BY t.id
    `).all();

    // Popular flowers
    const popularFlowers = db.prepare(`
      SELECT m.name, SUM(c.quantity) as total_sold
      FROM ChiTietDonHang c
      JOIN MauHoa m ON c.model_id = m.id
      JOIN DonHang d ON c.order_id = d.id
      WHERE d.status = 'Hoàn thành'
      GROUP BY m.id
      ORDER BY total_sold DESC
      LIMIT 5
    `).all();

    // Reviews and Complaints
    const reviews = db.prepare(`
      SELECT r.*, d.id as order_id, t.full_name as customer_name
      FROM DanhGiaKhieuNai r
      JOIN DonHang d ON r.order_id = d.id
      JOIN TaiKhoan t ON d.customer_id = t.id
      ORDER BY r.created_at DESC
    `).all();

    res.json({
      revenue: revenue?.total || 0,
      lowStock,
      ordersByStatus,
      artisanPerformance,
      shipperPerformance,
      popularFlowers,
      reviews
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

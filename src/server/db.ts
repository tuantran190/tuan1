import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dbPath = path.join(process.cwd(), 'flower_shop.db');

// Remove existing db for fresh seed on restart (optional, but good for demo)
if (fs.existsSync(dbPath)) {
  fs.unlinkSync(dbPath);
}

export const db = new Database(dbPath);

// Initialize Schema
db.exec(`
  CREATE TABLE IF NOT EXISTS QuyenHan (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS TaiKhoan (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role_id INTEGER,
    full_name TEXT NOT NULL,
    phone TEXT,
    points INTEGER DEFAULT 0,
    FOREIGN KEY (role_id) REFERENCES QuyenHan(id)
  );

  CREATE TABLE IF NOT EXISTS NguyenLieu_PhuKien (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT NOT NULL, -- 'flower', 'accessory'
    quantity INTEGER NOT NULL DEFAULT 0,
    unit TEXT NOT NULL,
    expiry_days INTEGER,
    import_date DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS MauHoa (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    price REAL NOT NULL,
    image_url TEXT,
    category TEXT
  );

  CREATE TABLE IF NOT EXISTS CongThucCamHoa (
    model_id INTEGER,
    material_id INTEGER,
    quantity INTEGER NOT NULL,
    PRIMARY KEY (model_id, material_id),
    FOREIGN KEY (model_id) REFERENCES MauHoa(id),
    FOREIGN KEY (material_id) REFERENCES NguyenLieu_PhuKien(id)
  );

  CREATE TABLE IF NOT EXISTS DonHang (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER,
    artisan_id INTEGER,
    shipper_id INTEGER,
    status TEXT NOT NULL, -- 'Chờ duyệt', 'Đang cắm', 'Đã hoàn thiện thiết kế', 'Đang giao', 'Hoàn thành', 'Đã hủy - Đang hoàn tiền', 'Đã hoàn tiền'
    total_price REAL NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    delivery_date DATETIME,
    delivery_address TEXT,
    card_message TEXT,
    special_instructions TEXT,
    actual_image_url TEXT,
    payment_method TEXT DEFAULT 'COD',
    is_cod_collected INTEGER DEFAULT 0,
    refund_transaction_id TEXT,
    FOREIGN KEY (customer_id) REFERENCES TaiKhoan(id),
    FOREIGN KEY (artisan_id) REFERENCES TaiKhoan(id),
    FOREIGN KEY (shipper_id) REFERENCES TaiKhoan(id)
  );

  CREATE TABLE IF NOT EXISTS ChiTietDonHang (
    order_id INTEGER,
    model_id INTEGER,
    quantity INTEGER NOT NULL,
    price REAL NOT NULL,
    PRIMARY KEY (order_id, model_id),
    FOREIGN KEY (order_id) REFERENCES DonHang(id),
    FOREIGN KEY (model_id) REFERENCES MauHoa(id)
  );

  CREATE TABLE IF NOT EXISTS PhieuGiaoHang (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER,
    shipper_id INTEGER,
    status TEXT,
    pod_image_url TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES DonHang(id),
    FOREIGN KEY (shipper_id) REFERENCES TaiKhoan(id)
  );

  CREATE TABLE IF NOT EXISTS MaGiamGia (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE NOT NULL,
    discount_percent INTEGER NOT NULL,
    user_id INTEGER,
    is_used INTEGER DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES TaiKhoan(id)
  );

  CREATE TABLE IF NOT EXISTS DanhGiaKhieuNai (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER,
    rating INTEGER,
    comment TEXT,
    image_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES DonHang(id)
  );

  CREATE TABLE IF NOT EXISTS AuditLog (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER,
    user_id INTEGER,
    old_status TEXT,
    new_status TEXT,
    image_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES DonHang(id),
    FOREIGN KEY (user_id) REFERENCES TaiKhoan(id)
  );

  CREATE TABLE IF NOT EXISTS PhieuNhapHang (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    material_id INTEGER,
    quantity INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (material_id) REFERENCES NguyenLieu_PhuKien(id)
  );
`);

// Seed Data
const insertRole = db.prepare('INSERT INTO QuyenHan (id, name) VALUES (?, ?)');
insertRole.run(1, 'Admin');
insertRole.run(2, 'Nhân viên');
insertRole.run(3, 'Nghệ nhân');
insertRole.run(4, 'Shipper');
insertRole.run(5, 'Khách hàng');

const insertUser = db.prepare('INSERT INTO TaiKhoan (username, password, role_id, full_name, phone, points) VALUES (?, ?, ?, ?, ?, ?)');
insertUser.run('admin', '123', 1, 'Admin Quản Lý', '0901234567', 0);
insertUser.run('nghenhan1', '123', 3, 'Nghệ Nhân Lan', '0901234568', 0);
insertUser.run('shipper1', '123', 4, 'Shipper Tuấn', '0901234569', 0);
insertUser.run('khachhang1', '123', 5, 'Khách Hàng VIP', '0901234570', 150);

const insertDiscount = db.prepare('INSERT INTO MaGiamGia (code, discount_percent, user_id) VALUES (?, ?, ?)');
insertDiscount.run('WELCOME10', 10, 4); // khachhang1 is id 4
insertDiscount.run('VIP20', 20, 4);

const insertMaterial = db.prepare('INSERT INTO NguyenLieu_PhuKien (id, name, type, quantity, unit, expiry_days, import_date) VALUES (?, ?, ?, ?, ?, ?, ?)');
const today = new Date();
const fourDaysAgo = new Date(today);
fourDaysAgo.setDate(today.getDate() - 4);
const oldDateStr = fourDaysAgo.toISOString();
const newDateStr = today.toISOString();

insertMaterial.run(1, 'Hoa hồng đỏ', 'flower', 500, 'cành', 5, oldDateStr); // Cũ quá 3 ngày
insertMaterial.run(2, 'Hoa hồng vàng', 'flower', 300, 'cành', 5, newDateStr);
insertMaterial.run(3, 'Hoa baby trắng', 'flower', 200, 'bó', 7, oldDateStr); // Cũ quá 3 ngày
insertMaterial.run(4, 'Hoa hướng dương', 'flower', 150, 'cành', 4, newDateStr);
insertMaterial.run(5, 'Lá bạc', 'flower', 400, 'cành', 10, newDateStr);
insertMaterial.run(6, 'Giấy gói Kraft', 'accessory', 1000, 'tờ', null, newDateStr);
insertMaterial.run(7, 'Giấy gói lụa', 'accessory', 800, 'tờ', null, newDateStr);
insertMaterial.run(8, 'Nơ ruy băng', 'accessory', 2000, 'cái', null, newDateStr);
insertMaterial.run(9, 'Xốp cắm hoa', 'accessory', 500, 'cục', null, newDateStr);

const insertModel = db.prepare('INSERT INTO MauHoa (id, name, description, price, image_url, category) VALUES (?, ?, ?, ?, ?, ?)');
insertModel.run(1, 'Nắng Hạ', 'Bó hoa hướng dương rực rỡ mang năng lượng tích cực.', 450000, 'https://picsum.photos/seed/nangha/400/400', 'Sinh nhật');
insertModel.run(2, 'Tình Nồng', 'Bó hoa hồng đỏ lãng mạn dành tặng người yêu.', 650000, 'https://picsum.photos/seed/tinhnong/400/400', 'Tình yêu');
insertModel.run(3, 'Tinh Khôi', 'Bó hoa baby trắng nhẹ nhàng, tinh tế.', 350000, 'https://picsum.photos/seed/tinhkhoi/400/400', 'Kỷ niệm');
insertModel.run(4, 'Phát Tài', 'Lẵng hoa khai trương rực rỡ.', 1200000, 'https://picsum.photos/seed/phattai/400/400', 'Khai trương');
insertModel.run(5, 'Ngọt Ngào', 'Bó hoa hồng mix baby dễ thương.', 550000, 'https://picsum.photos/seed/ngotngao/400/400', 'Sinh nhật');

const insertRecipe = db.prepare('INSERT INTO CongThucCamHoa (model_id, material_id, quantity) VALUES (?, ?, ?)');
// Nắng Hạ
insertRecipe.run(1, 4, 5); // 5 hướng dương
insertRecipe.run(1, 3, 1); // 1 bó baby
insertRecipe.run(1, 6, 3); // 3 tờ kraft
insertRecipe.run(1, 8, 1); // 1 nơ
// Tình Nồng
insertRecipe.run(2, 1, 15); // 15 hồng đỏ
insertRecipe.run(2, 5, 5); // 5 lá bạc
insertRecipe.run(2, 7, 4); // 4 giấy lụa
insertRecipe.run(2, 8, 1); // 1 nơ
// Tinh Khôi
insertRecipe.run(3, 3, 3); // 3 bó baby
insertRecipe.run(3, 7, 2); // 2 giấy lụa
insertRecipe.run(3, 8, 1); // 1 nơ
// Phát Tài
insertRecipe.run(4, 2, 20); // 20 hồng vàng
insertRecipe.run(4, 4, 10); // 10 hướng dương
insertRecipe.run(4, 5, 10); // 10 lá bạc
insertRecipe.run(4, 9, 2); // 2 xốp
// Ngọt Ngào
insertRecipe.run(5, 1, 10); // 10 hồng đỏ
insertRecipe.run(5, 3, 1); // 1 bó baby
insertRecipe.run(5, 7, 3); // 3 giấy lụa
insertRecipe.run(5, 8, 1); // 1 nơ

console.log('Database initialized and seeded.');

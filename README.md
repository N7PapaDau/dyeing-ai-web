# DYEING AI WEB V1

Mục tiêu: cho công nhân nhập Case trước; kỹ thuật viên/AI xử lý dữ liệu về sau.

## Chạy ngay
Mở `index.html`. Không cần server.
- Nếu chưa cấu hình Supabase: dữ liệu lưu trên trình duyệt hiện tại (Demo Browser Mode).
- Nếu muốn nhiều máy cùng nhập và cùng thấy dữ liệu: cấu hình Supabase theo phần dưới.

## Đưa lên GitHub Pages
1. Tạo repository, ví dụ `dyeing-ai-web`.
2. Upload toàn bộ file trong thư mục này.
3. Settings → Pages → Deploy from branch → `main` / root.
4. Mở URL GitHub Pages.

## Dùng database chung cho công nhân
1. Tạo project Supabase.
2. Mở SQL Editor và chạy `supabase/schema.sql`.
3. Lấy Project URL và Publishable/anon key.
4. Điền vào `config.js`:
   SUPABASE_URL: "..."
   SUPABASE_ANON_KEY: "..."
5. Commit/push lại GitHub.

LƯU Ý:
- Không bao giờ đưa `service_role` key vào frontend.
- Schema hiện tại dùng policy demo để test nhanh. Trước khi triển khai thật cần Auth + RLS theo vai trò Worker/Technician/Admin.
- V1 chưa cho AI tự kết luận nguyên nhân. Đây là hệ thống thu thập dữ liệu sạch trước.

## Roadmap
V1 Worker input
V2 Technician treatment/result
V3 Search + filters
V4 AI Intent + Scope
V5 AI history/recommendation

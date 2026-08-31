# DYEING AI WEB V2.4 FREE

## Mục tiêu
Từ V2.3 FREE, thêm:
- Similar Case
- Knowledge Summary
- Thống kê NG / Cải thiện / Đạt / Confirmed
- Tổng hợp các phương pháp đã xác nhận
- Điểm tương đồng giữa các Case

## Không thay đổi
- Supabase database schema
- `dyeing_cases`
- `case_actions`
- Không OpenAI API
- Không Edge Function

## Similar Case scoring
Điểm tương đồng hiện tại:
- Product giống nhau: +60
- Problem giống nhau: +30
- Machine giống nhau: +10

Case đạt >= 60 điểm được xem là similar.

Đây chỉ là chỉ số tương đồng phục vụ tra cứu, không phải kết luận nguyên nhân.

## Knowledge Summary
Tổng hợp trên selected Case + các Similar Case:
- số Case
- số Action
- NG
- Cải thiện
- Đạt
- Confirmed
- các phương pháp đã xác nhận hiệu quả

## Cách triển khai
Giữ `config.js` hiện tại của project để không làm mất Supabase URL/key.

Tạo branch:
`git checkout -b v2-4-knowledge`

Sau đó copy:
- `index.html`
- `app.js`
- `style.css`
- các file V2.4 docs

vào project hiện tại.

Test local trước khi commit/push.

## Lưu ý
V2.4 FREE không phải LLM.
Đây là lớp Knowledge Retrieval + Similarity chạy trên dữ liệu thực tế.

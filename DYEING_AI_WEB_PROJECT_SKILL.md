# DYEING AI WEB — MASTER PROJECT SKILL

Version: 1.0
Project: AI ghi nhận – lưu trữ – tra cứu – hỗ trợ xử lý sự cố xưởng nhuộm

## 1. VAI TRÒ CỦA AI

Bạn là Technical Project Assistant, Full-stack Web Developer, Database Designer, AI System Architect và QA/Test Assistant.

Đang đồng hành xây dựng hệ thống DYEING AI WEB.

Mục tiêu:
Công nhân ghi nhận → lưu trữ → tra cứu → học từ lịch sử xử lý → hỗ trợ xử lý sự cố xưởng nhuộm.

## 2. MỤC TIÊU HỆ THỐNG

1. Công nhân nhập thông tin sự cố.
2. Dữ liệu lưu vào database chung.
3. Công nhân/kỹ thuật viên xem lại Case.
4. Ghi nhận nhiều lần xử lý cho cùng Case.
5. Theo dõi kết quả từng lần xử lý.
6. Xác nhận phương pháp xử lý đã hiệu quả.
7. Tra cứu đúng Case.
8. AI đọc lịch sử Case + Case Actions.
9. AI hỗ trợ đề xuất dựa trên dữ liệu thực tế.
10. Không trộn lịch sử giữa các Case.

## 3. NGUYÊN TẮC QUAN TRỌNG

AI KHÔNG ĐƯỢC tự biến suy đoán thành “nguyên nhân đã xác nhận”.

Phải phân biệt:
- Dữ liệu đã ghi nhận
- Phương pháp đã thử
- Kết quả
- Phương pháp đã xác nhận hiệu quả
- Đề xuất của AI

Nếu database chưa có bằng chứng: “Chưa có dữ liệu xác nhận.”

## 4. DATABASE

Supabase là database chung.

Bảng chính:
- `dyeing_cases`

Bảng lịch sử xử lý:
- `case_actions`

Quan hệ:
`dyeing_cases.case_id` → `case_actions.case_id`

Một Case có thể có nhiều Action. Không ghi đè lịch sử.

## 5. DYEING_CASES

Các trường quan trọng:
`case_id`, `product_code`, `batch_no`, `machine`, `event_date`, `problem`, `description`, `status`, `treatment`, `result`, `effective`, `next_action`, `created_by`, `created_at`.

Ví dụ:
- case_id: CASE-123
- product_code: SCO
- batch_no: 26209997
- machine: Fong's 501
- problem: Uneven Dyeing
- status: OPEN

## 6. CASE_ACTIONS

Các thông tin chính:
`case_id`, `action_no`, `treatment`, `result`, `effective`, `confirm_batch`, `created_at`.

Ví dụ:
- Action 1 → Test lại công thức → Không đạt
- Action 2 → Tăng muối → Không đạt
- Action 3 → Tăng Pump 65% → 70% → Cải thiện
- Action 4 → Mẻ xác nhận → Đạt → Xác nhận hiệu quả

## 7. PHÂN BIỆT KẾT QUẢ

- ❌ KHÔNG ĐẠT: Đã thử nhưng không giải quyết được.
- 🟡 CẢI THIỆN: Có cải thiện nhưng chưa đủ để xác nhận.
- 🟢 ĐẠT: Kết quả đạt trong lần thử.
- ⭐ ĐÃ XÁC NHẬN HIỆU QUẢ: Đã kiểm chứng trên mẻ xác nhận.

“Đạt” không đồng nghĩa với “Đã xác nhận hiệu quả”.

## 8. XÁC NHẬN PHƯƠNG PHÁP HIỆU QUẢ

Giao diện có khu vực:
“⭐ XÁC NHẬN PHƯƠNG PHÁP XỬ LÝ HIỆU QUẢ”

Nếu `effective = true` thì bắt buộc có `confirm_batch`.

Nếu thiếu `confirm_batch`, không cho lưu và báo:
“⚠️ Vui lòng nhập Mẻ xác nhận trước khi xác nhận phương pháp hiệu quả.”

## 9. CASE STATUS

Ban đầu: `OPEN`

Sau khi có phương pháp được xác nhận: `CONFIRMED`

Không chuyển CONFIRMED chỉ vì một lần test có kết quả “Đạt”.
Phải có mẻ xác nhận và `effective = true`.

## 10. V1 ĐÃ HOÀN THÀNH

- Ghi nhận Case
- Danh sách Case
- Tìm kiếm
- Supabase
- Demo localStorage khi chưa cấu hình Supabase

Các file chính:
`index.html`, `app.js`, `config.js`, `style.css`, `README.md`, `supabase/schema.sql`

## 11. SUPABASE

Frontend sử dụng:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

Domain `.supabase.co` là bình thường.

Không tự thay URL nếu chưa xác minh.

## 12. GITHUB

Repository: `dyeing-ai-web`
Owner: `N7PapaDau`

Nhánh ổn định: `main`
Nhánh phát triển: `v2-case-actions`

Nguyên tắc:
- `main` → phiên bản ổn định
- `v2-case-actions` → phát triển/test

Không tự động merge V2 vào `main`.

## 13. TRẠNG THÁI HIỆN TẠI

V2 đã test thành công:
- Case Actions
- Action 1, 2, 3
- Database `case_actions`
- Giao diện xác nhận hiệu quả
- Validation `confirm_batch`
- Search V2.1

V2.1 đã push thành công.

Commit đã push: `020f494`
Branch: `v2-case-actions`

Không reset hoặc ghi đè các phần đang chạy tốt.

## 14. SEARCH V2.1

Không dùng cách cũ:
`Object.values(x).join(" ").includes(query)`

Search ưu tiên:
- `product_code`
- `problem`
- `batch_no`
- `machine`

Ví dụ:
- `SCO` → tìm Case liên quan SCO.
- `SCO Uneven Dyeing` → tìm Case phù hợp với cả hai từ khóa.
- `26209997` → tìm đúng Batch.

Nếu có nhiều Case phù hợp: KHÔNG tự chọn một Case; phải hiển thị danh sách để người dùng chọn.

## 15. VẤN ĐỀ SEARCH QUAN TRỌNG

Đã từng xảy ra lỗi: hỏi “SCO” nhưng hệ thống trả lịch sử của Case khác, ví dụ sản phẩm/lịch sử `20726`.

Nguyên nhân: Search cũ tìm chuỗi trong toàn bộ `Object.values()`.

Giải pháp:
Product + Problem + Batch nếu có
→ tìm đúng Case
→ lấy Case Actions.

Không được lấy lịch sử của Case khác.

## 16. KIẾN TRÚC AI SAU NÀY — V2.2

Mục tiêu: AI Search / AI Assistant.

Luồng:
Người dùng hỏi
→ Phân tích mục đích câu hỏi
→ Xác định Product
→ Xác định Problem
→ Xác định Batch nếu có
→ Tìm đúng Case
→ Lấy `case_actions`
→ Phân loại kết quả
→ AI trả lời

Ví dụ:
“SCO bị Uneven Dyeing trước đây xử lý thế nào?”

AI phải xác định:
- Product = SCO
- Problem = Uneven Dyeing

Sau đó:
Case → Actions → lịch sử xử lý.

Không được trả dữ liệu của Product khác.

## 17. AI RESPONSE RULE

AI trả lời theo các mức:

1. ĐÃ BIẾT — “Dữ liệu Case ghi nhận...”
2. ĐÃ THỬ — “Đã thử các phương pháp...”
3. ĐÃ XÁC NHẬN — “Phương pháp X đã được xác nhận hiệu quả trên mẻ Y.”
4. AI ĐỀ XUẤT — “Dựa trên các Case tương tự, AI đề xuất...”

Phải ghi rõ:
“Đây là đề xuất của AI, chưa phải phương pháp đã được xác nhận.”

## 18. KHÔNG ĐƯỢC LÀM

Không:
- Tự tạo dữ liệu giả rồi coi là dữ liệu thật.
- Trộn Case hoặc Batch.
- Tự kết luận nguyên nhân.
- Tự đánh dấu phương pháp hiệu quả.
- Xóa lịch sử Action.
- Ghi đè Action cũ.
- Merge vào `main` khi chưa test.
- Làm hỏng V1 để phát triển V2.
- Thay toàn bộ `app.js` nếu chỉ cần sửa một chức năng.
- Thay đổi database schema tùy tiện.
- Đưa AI vào trước khi dữ liệu nền tảng ổn định.

## 19. QUY TRÌNH PHÁT TRIỂN

1. Xác định mục tiêu.
2. Xác định file cần sửa.
3. Sửa nhỏ từng phần.
4. Test local.
5. Test Supabase.
6. Kiểm tra database.
7. Commit.
8. Push branch phát triển.
9. Chỉ merge `main` sau khi ổn định.

Không thay toàn bộ project nếu không cần.

## 20. QUY TRÌNH TEST

Mỗi chức năng mới phải test:
A. Giao diện
B. Lưu dữ liệu
C. Database
D. Đọc dữ liệu
E. Trường hợp lỗi
F. Trường hợp dữ liệu trùng

Phải kiểm tra cả:
- `dyeing_cases`
- `case_actions`

## 21. CÁCH HƯỚNG DẪN NGƯỜI DÙNG

Người dùng muốn hướng dẫn từng bước.

Không đưa 20 bước cùng lúc nếu chưa cần.

Ưu tiên:
“Chạy lệnh này.” → Người dùng gửi kết quả → Phân tích → Đưa bước tiếp theo.

Khi sửa code phải nói rõ:
- Mở file nào.
- Ctrl + F tìm gì.
- Xóa đoạn nào.
- Dán đoạn nào.
- Save.
- Test.

Không bắt người dùng tự đoán vị trí code.

## 22. GITHUB COMMANDS

```powershell
git status
git add index.html app.js style.css
git commit -m "message"
git push -u origin v2-case-actions
```

Không push `main` nếu chưa được duyệt.

## 23. PROJECT ROADMAP

V1
→ Worker nhập Case
→ Supabase

V2
→ Case Actions
→ Lịch sử nhiều lần xử lý

V2.1
→ Search đúng Case

V2.2
→ AI Search
→ AI hiểu mục đích câu hỏi
→ AI xác định Product/Problem/Batch
→ AI lấy Case đúng
→ AI đọc Case Actions

V3
→ AI hỗ trợ phân tích
→ Case tương tự
→ Đề xuất phương pháp

V4
→ Knowledge Base
→ AI học từ lịch sử xử lý đã xác nhận

V5
→ Dashboard
→ Thống kê lỗi
→ Top lỗi
→ Top phương pháp hiệu quả
→ Machine / Product / Batch analysis

## 24. MỤC TIÊU DÀI HẠN

Hệ thống không chỉ là “Form nhập dữ liệu”.

WORKER
→ DATA COLLECTION
→ CENTRAL DATABASE
→ CASE HISTORY
→ KNOWLEDGE BASE
→ AI SEARCH
→ AI ANALYSIS
→ AI SUPPORT

AI là công cụ hỗ trợ kỹ thuật viên và công nhân, không thay thế hoàn toàn phán đoán kỹ thuật của con người.

## 25. PHONG CÁCH LÀM VIỆC

Người dùng muốn:
- Giải thích bằng tiếng Việt.
- Hướng dẫn thực tế.
- Code có thể copy/paste.
- Không nói lý thuyết quá dài.
- Khi sửa code phải chỉ đúng vị trí.
- Test từng bước.
- Không phá chức năng đã chạy.
- Luôn xác nhận database sau khi test.
- Ưu tiên giải pháp đơn giản trước.
- Sau khi ổn định mới mở rộng.

## 26. QUY TẮC TIẾP TỤC DỰ ÁN

Khi người dùng mở cuộc trò chuyện mới và gửi Skill này:

Không hỏi lại toàn bộ lịch sử dự án.

Hãy đọc Skill như PROJECT STATE.

Nếu người dùng nói:
“Tiếp tục V2.2”
→ bắt đầu từ AI Search / Intent Detection.

Nếu người dùng nói:
“Sửa lỗi”
→ xác định:
- lỗi ở đâu
- file nào
- database có đúng không
- bước test nào

Không tự viết lại toàn bộ hệ thống.

## 27. CURRENT PROJECT STATE

CURRENT STABLE: `V1`

CURRENT DEVELOPMENT: `V2.1`

CURRENT BRANCH: `v2-case-actions`

CURRENT DATABASE: `Supabase`

CURRENT TABLES:
- `dyeing_cases`
- `case_actions`

NEXT DEVELOPMENT:
**V2.2 — AI Search + Intent Detection**

KEY DESIGN PRINCIPLE:

**“Xác định đúng mục đích hỏi và đúng Case trước khi AI trả lời.”**

## 28. CÁCH DÙNG FILE NÀY Ở CHAT MỚI

Upload file này vào cuộc trò chuyện mới và nói:

“Đây là Project Skill của DYEING AI WEB.
Hãy đọc toàn bộ, coi đây là trạng thái dự án hiện tại và tiếp tục phát triển từ trạng thái cuối cùng.
Không hỏi lại những thông tin đã có trong Skill.”

Nếu có phiên bản Skill mới hơn, luôn ưu tiên phiên bản mới nhất.

---

END OF DYEING AI WEB PROJECT SKILL

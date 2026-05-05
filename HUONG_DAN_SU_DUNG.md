# 📖 Hướng Dẫn Sử Dụng Toàn Tập: Second Brain

Chào mừng bạn đến với **Second Brain** — Hệ thống quản lý tri thức, công việc và lịch trình cá nhân hiện đại nhất. Tài liệu này sẽ hướng dẫn bạn từ cách cài đặt, sử dụng các chức năng, cho đến việc đưa hệ thống lên mạng để dùng ở bất cứ đâu.

---

## Phần 1: Cách Cài Đặt và Chạy Hệ Thống Ở Máy Tính Gốc (Máy A)

Nếu bạn vừa tải mã nguồn về máy, hãy làm theo các bước sau:

1. **Yêu cầu môi trường:** Đảm bảo máy tính của bạn đã cài đặt Node.js (tải tại nodejs.org).
2. **Cài đặt thư viện:** 
   - Mở Terminal (Command Prompt / PowerShell) tại thư mục chứa mã nguồn (`second-brain`).
   - Gõ lệnh: `npm install` và ấn Enter. Chờ quá trình hoàn tất.
3. **Khởi động ứng dụng:**
   - Gõ lệnh: `npm run dev`
   - Trình duyệt sẽ hiển thị đường link (thường là `http://localhost:3000`). Bấm vào link đó để mở Second Brain.

---

## Phần 2: Hướng Dẫn Truy Cập Trên Máy B MÀ KHÔNG CẦN Bật Máy A

Vì "Second Brain" là ứng dụng Web thuần giao diện (Client-side), ta không cần chạy Server. Chỉ cần "Build" (Đóng gói) ứng dụng và đẩy lên một dịch vụ Hosting miễn phí (như Vercel hoặc Netlify). Sau đó, bạn sẽ có một đường link (ví dụ: `https://...`) để vào ứng dụng từ điện thoại, iPad, hoặc bất kỳ máy tính nào.

**Cách thực hiện (Sử dụng Vercel - Miễn phí 100%):**

1. **Đóng gói mã nguồn (Ở máy A):**
   - Mở Terminal tại thư mục `second-brain`.
   - Chạy lệnh: `npm run build`
   - Hệ thống sẽ tạo ra một thư mục mới tên là `dist` bên trong dự án. Thư mục `dist` này chứa toàn bộ ứng dụng đã được tối ưu.
2. **Đưa lên mạng:**
   - Đăng ký một tài khoản tại [vercel.com](https://vercel.com/) (Dùng tài khoản GitHub hoặc Google).
   - Truy cập trang [Vercel Drop](https://vercel.com/new/drop) hoặc tạo project mới bằng cách Kéo - Thả.
   - Bạn chỉ việc kéo nguyên thư mục `dist` vừa tạo ở bước 1 thả vào màn hình Vercel.
3. **Thưởng thức:**
   - Vercel sẽ cung cấp cho bạn một đường link tĩnh (Ví dụ: `https://my-second-brain.vercel.app`).
   - Bây giờ, máy A có thể tắt đi hoàn toàn. Từ máy B (điện thoại, máy tính cơ quan), bạn chỉ cần vào đường link trên là dùng được ngay!

---

## Phần 3: Hướng Dẫn Đồng Bộ Dữ Liệu Lên Đám Mây (Cloud Sync)

Dữ liệu của Second Brain được lưu trong bộ nhớ của Trình duyệt. Nếu bạn làm việc trên Máy A và muốn dữ liệu đó xuất hiện trên Máy B, hãy làm theo 2 bước "Push" và "Pull":

### Bước 1: Đẩy dữ liệu lên Cloud (Tại thiết bị bạn VỪA LÀM XONG)
1. Ở thanh menu bên trái, chọn **Cài đặt (Settings)**.
2. Cuộn xuống mục **☁️ Cloud Sync**.
3. Tại ô **Secret Passcode**, nhập một mật khẩu bất kỳ do bạn tự nghĩ ra (VD: `kiennguyen99`). *Nhớ kỹ mật khẩu này.*
4. Bấm **☁️ Push to Cloud** (Đẩy lên Cloud).
5. Đợi thông báo thành công. Toàn bộ dữ liệu của bạn đã được đóng gói an toàn lên Firebase.

### Bước 2: Tải dữ liệu về (Tại thiết bị bạn MUỐN TIẾP TỤC LÀM VIỆC)
1. Mở Second Brain trên thiết bị mới (Máy B).
2. Khi nhìn thấy màn hình "Ai đang sử dụng?" (Profile Selection), bấm vào nút **☁️ Restore from Cloud** ở góc dưới.
3. Nhập đúng mật khẩu `kiennguyen99` mà bạn đã dùng ở bước 1.
4. Bấm **Download**. Ứng dụng sẽ tự tải dữ liệu về, F5 lại trang, và thiết bị B của bạn sẽ có mọi dữ liệu y hệt thiết bị A!

---

## Phần 4: Cẩm Nang Chức Năng Hệ Thống

### 👤 1. Hệ thống Tài khoản (Profiles)
- **Tạo Profile:** Bấm vào nút `+` ở màn hình chờ để tạo không gian làm việc. Bạn có thể chọn Avatar, Đặt tên, chọn Ngôn ngữ (Việt/Anh), và Múi giờ.
- **Cách ly dữ liệu:** Nếu bạn tạo 2 profile "Công Việc" và "Cá Nhân", dữ liệu của chúng tách biệt 100%.

### ⚡ 2. Dashboard (Tổng Quan)
- Bảng điều khiển chính giúp bạn nhìn lướt qua toàn bộ ngày hôm nay.
- Hiển thị: Tổng số ghi chú, Việc chưa làm, Thẻ cần học.
- Theo dõi **Lịch trình sự kiện** và trạng thái **Viết Nhật ký** của ngày hôm nay.

### 📝 3. Kho Lưu Trữ (Notes - Phương pháp PARA)
- Nơi lưu trữ kiến thức dài hạn. Nút `+ Ghi chú mới` để tạo.
- Hỗ trợ cú pháp Markdown (bôi đậm, in nghiêng, tạo bảng).
- **Phân loại PARA:** Bạn có thể gắn thẻ Ghi chú vào Dự Án (Projects), Lĩnh Vực (Areas), Tài Nguyên (Resources), hoặc Lưu Trữ (Archive).

### ✅ 4. Quản Lý Công Việc (Tasks)
- Quản lý Todo-list kết hợp quản lý Dự án (Project).
- Bạn có thể tạo Dự án trước (VD: "Làm website"), sau đó gán các công việc nhỏ (Tasks) vào dự án đó.
- Công việc có Độ ưu tiên (Cao/TB/Thấp) và Ngày đến hạn (Due Date).

### 📅 5. Lịch Trình (Calendar)
- Hỗ trợ 3 chế độ xem: **Ngày** (có thanh kẻ đỏ chỉ thời gian thực), **Tuần**, và **Tháng**.
- Bấm vào biểu đồ hoặc bấm `+ Sự kiện mới` để lên lịch.
- Có thể lặp lại sự kiện (Mỗi ngày, Mỗi tuần...) và phân màu (Công việc, Học tập, Cá nhân).
- Tích hợp hiện luôn các Tasks có hạn chót vào lịch.

### 🎓 6. Góc Học Tập (Study Hub)
- Hệ thống thẻ ghi nhớ (Flashcards) sử dụng thuật toán Lặp Lại Ngắt Quãng (Spaced Repetition) giống Anki.
- **Tạo Bộ Thẻ:** Tạo bộ từ vựng hoặc khái niệm IT. Thêm các thẻ nhớ với Mặt trước (Hỏi) - Mặt sau (Đáp).
- **Cách học:** Mỗi ngày ứng dụng sẽ tự tính toán ra thẻ nào bạn sắp quên để báo bạn vào học (`Review`). Bấm thẻ để lật, tự đánh giá Dễ/Khó/Quên để máy tính lên lịch ôn tập lần sau.

### 📔 7. Nhật Ký (Journal)
- Ghi chép cảm xúc cuối ngày. 
- Có bộ câu hỏi gợi ý để kích thích suy ngẫm.
- Thống kê lịch sử cảm xúc (Mood) trong 30 ngày qua bằng biểu đồ emoji trực quan.

### 🔍 8. Quick Search (Tìm kiếm nhanh)
- Nơi tìm kiếm quyền năng nhất. Chỉ cần gõ từ khóa, ứng dụng sẽ lục lọi toàn bộ tiêu đề/nội dung của Ghi chú, Task, Thẻ học, và Sự kiện để đưa ra kết quả lập tức.

---

**Mẹo sử dụng:** 
- Luôn làm việc offline để đạt tốc độ nhanh nhất. 
- Cuối ngày, vào **Settings -> Push to Cloud** để sao lưu an toàn. 
- Hãy đẩy file build (thư mục `dist`) lên mạng thông qua Vercel. Lưu đường link lại vào điện thoại. Từ nay bạn đã có một chiếc "Não bộ số thứ hai" thực thụ luôn mang theo bên mình!

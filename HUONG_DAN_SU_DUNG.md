# 📖 Hướng Dẫn Sử Dụng Toàn Tập: Second Brain (DUT Edition)

Chào mừng bạn đến với **Second Brain (DUT Edition)** — Hệ thống quản lý tri thức, công việc, học tập và tài chính cá nhân dành riêng cho sinh viên CNTT trường Đại học Bách Khoa - Đại học Đà Nẵng. Tài liệu này sẽ hướng dẫn chi tiết cách vận hành từng chức năng một cách mượt mà và hiệu quả nhất.

---

## Phần 1: Hướng Dẫn Cài Đặt và Chạy Offline (Local-First)

Ứng dụng của bạn hoạt động hoàn toàn trên bộ nhớ trình duyệt (IndexedDB) thông qua thư viện Dexie. Điều này giúp hệ thống phản hồi ngay lập tức và có thể hoạt động hoàn toàn không cần kết nối mạng.

### 1. Cài đặt và khởi động ở máy chủ cục bộ (Máy tính của bạn)
1. **Yêu cầu:** Máy tính cần cài đặt **Node.js** (tải bản LTS tại [nodejs.org](https://nodejs.org/)).
2. **Cài đặt thư viện:** 
   - Mở Terminal/Command Prompt trong thư mục chứa mã nguồn (`second-brain`).
   - Chạy lệnh: `npm install`
3. **Khởi động:**
   - Chạy lệnh: `npm run dev`
   - Bấm vào đường dẫn hiển thị trên Terminal (mặc định là `http://localhost:3000`) để mở ứng dụng.

### 2. Sử dụng trên Điện thoại/Thiết bị khác (Đóng gói và Đưa lên Cloud)
Vì ứng dụng thuần giao diện và không cần server nền, bạn có thể triển khai miễn phí 100% lên **Vercel** để truy cập bằng điện thoại:
1. Tại thư mục dự án, chạy lệnh: `npm run build` để đóng gói thành thư mục `dist`.
2. Tạo tài khoản miễn phí trên [vercel.com](https://vercel.com).
3. Truy cập [vercel.com/new/drop](https://vercel.com/new/drop) và kéo-thả thư mục `dist` vào khung tải lên.
4. Nhận đường dẫn tĩnh dạng `https://ten-ung-dung.vercel.app` để lưu bookmark trên điện thoại hoặc máy tính khác để sử dụng mọi lúc mọi nơi.

---

## Phần 2: Hướng Dẫn Đồng Bộ Đám Mây (Cloud Sync)

Để dữ liệu tự động đồng bộ giữa máy tính học ở trường và điện thoại di động mà không cần đăng ký tài khoản rườm rà, chúng ta sử dụng cơ chế **Cloud Passcode**:

1. **Sao lưu (Từ thiết bị vừa thao tác xong):**
   - Vào mục **Cài đặt (Settings)** ở Sidebar bên trái.
   - Cuộn xuống mục **☁️ Đồng bộ đám mây (Cloud Sync)**.
   - Nhập một mật khẩu tự chọn vào ô **Mật khẩu bí mật (Secret Passcode)** (ví dụ: `duybkcntt2026`).
   - Bấm **Đẩy lên đám mây (Push to Cloud)**.
2. **Khôi phục (Tại thiết bị mới muốn làm việc tiếp):**
   - Mở ứng dụng trên thiết bị mới.
   - Tại màn hình chọn Profile tài khoản ("Ai đang sử dụng?"), bấm vào **Khôi phục từ đám mây (Restore from Cloud)** ở góc dưới.
   - Nhập đúng mật khẩu bí mật đã tạo ở trên (`duybkcntt2026`).
   - Bấm **Tải về (Download)**. Ứng dụng sẽ tự động nạp dữ liệu và tải lại trang.

---

## Phần 3: Cẩm Nang Vận Hành Chi Tiết Các Chức Năng

### 🎓 1. GPA & Học phần DUT (Học tập & Học lộ trình)
Đây là trái tim của hệ thống dành riêng cho sinh viên DUT.

#### Thao tác 1: Nhập khung chương trình nhanh
- **Cách làm:** Nếu tài khoản mới chưa có môn học, tại tab **Danh sách học phần**, bấm nút **Nhập khung chương trình DUT**.
- **Kết quả:** Hệ thống tự động nạp toàn bộ danh mục ~150 tín chỉ chuẩn của khoa CNTT ĐH Bách Khoa Đà Nẵng, phân bổ sẵn từ Học kỳ 1 đến Học kỳ 8.

#### Thao tác 2: Ghi nhận điểm số chi tiết
- **Cách làm:** Bấm vào icon **✏️ (Sửa)** bên cạnh tên môn học để mở Form chỉnh sửa:
  - Chọn trạng thái: `Chưa học`, `Đang học`, `Đã đạt`, hoặc `Không đạt`.
  - Nhập điểm số hệ 10 và trọng số tương ứng ở mục **Điểm thành phần môn học** (Chuyên cần, Bài tập, Giữa kỳ, Cuối kỳ).
  - Hệ thống sẽ **tự động tính toán điểm tổng kết hệ 10**, sau đó tự quy đổi ra điểm chữ (`A, B, C, D, F`) và điểm hệ 4 (`4.0, 3.0, 2.0, 1.0, 0.0`) chính xác theo quy chế đào tạo tín chỉ của DUT.
  - Bấm **Lưu**.

#### Thao tác 3: Đọc Cảnh báo môn tiên quyết & Đề xuất học lại
- **Môn tiên quyết:** Khi bạn lên danh sách đăng ký học hoặc mở chi tiết một môn học (như *Cấu trúc dữ liệu & Giải thuật*), hệ thống sẽ kiểm tra xem môn trước đó (*Kỹ thuật lập trình*) đã ở trạng thái **Đã đạt (Passed)** chưa. Nếu chưa đạt, một cảnh báo màu đỏ sẽ xuất hiện yêu cầu bạn phải thi đậu môn tiên quyết trước.
- **Học lại:** Đối với các môn học bị điểm nợ (`F`), hệ thống sẽ hiển thị một khuyến nghị thông minh đề xuất bạn đăng ký học lại vào kỳ **S + 2** (Ví dụ: nợ môn ở Kỳ 3 thì nên đăng ký học lại ở Kỳ 5) để khớp với chu kỳ đào tạo xen kẽ các học kỳ lẻ/chẵn của trường DUT.

#### Thao tác 4: Mô phỏng What-if GPA
- **Cách làm:** Chuyển sang tab **Mô phỏng What-if**.
- **Cách dùng:** Tại cột *Điểm giả định*, chọn điểm chữ mong muốn (`A, B, C, D, F`) cho các môn đang hoặc chưa học. Giao diện sẽ lập tức cập nhật chỉ số **GPA Mô phỏng** kế bên để bạn biết cần đạt điểm bao nhiêu ở mỗi môn nhằm kéo điểm tích lũy đạt bằng xuất sắc/giỏi.

---

### ⏱️ 2. Tập trung Pomodoro
Công cụ đắc lực chống trì hoãn và tối ưu hiệu suất làm việc.

#### Thao tác 1: Khởi động và Tùy chỉnh Timer
- Chọn **Tập trung** trên menu Sidebar.
- Lựa chọn chế độ tập trung phù hợp ở thanh Tab:
  - **Tập trung:** 25 phút (chu kỳ chuẩn).
  - **Nghỉ ngắn:** 5 phút.
  - **Nghỉ dài:** 15 phút.
- Bấm **Bắt đầu** để chạy đồng hồ. Bộ đếm thời gian sẽ hiển thị vòng tròn tiến trình SVG chuyển đổi sắc thái mượt mà theo giây. Bấm **Tạm dừng** để nghỉ ngang hoặc **Làm lại** để reset giờ.

#### Thao tác 2: Liên kết học phần và công việc
- **Cách làm:** Trước khi bấm chạy, ở khung liên kết phía dưới:
  - Chọn môn học cụ thể tại ô **Liên kết học phần** (ví dụ: *Giải tích*).
  - Hoặc chọn công việc chi tiết tại ô **Liên kết công việc** (các công việc chưa hoàn thành sẽ được tải lên).
- **Lưu ý:** Việc liên kết này giúp hệ thống ghi nhận chính xác thời gian bạn đầu tư cho từng môn học để vẽ biểu đồ thống kê.

#### Thao tác 3: Hoàn thành phiên và Nhập log
- Khi đồng hồ đếm về `00:00`, hệ thống tự phát **âm báo dual-tone êm ái** bằng thuật toán Web Audio và dừng hoạt động.
- Một biểu mẫu màu tím xuất hiện hiển thị: *"Chúc mừng! Bạn đã hoàn thành 1 phiên tập trung."*
- Hãy nhập nhanh những nội dung bạn đã làm được vào ô ghi chú (ví dụ: `đọc xong chương 2 giáo trình, code xong giao diện`).
- Bấm **Lưu log** để ghi vào cơ sở dữ liệu. Hệ thống sẽ tự động chuyển sang chế độ **Nghỉ ngắn (5 phút)** để bạn thư giãn.

#### Thao tác 4: Sử dụng Lối tắt (Quick-launch)
- **Từ trang công việc:** Bên cạnh mỗi Task chưa xong trong tab **Công việc**, có một biểu tượng `⏱️`. Bấm vào đó, ứng dụng sẽ đưa bạn thẳng tới trang Pomodoro và tự động khóa liên kết với task đó.
- **Từ trang môn học:** Tương tự, bấm vào biểu tượng `⏱️` ở dòng môn học hoặc trong Modal chi tiết môn học để mở đồng hồ và liên kết ngay với môn học đó.

---

### 🏗️ 3. Quản lý Đồ án PBL (Làm việc nhóm)
Tích hợp trực tiếp trong trang quản lý học phần để phục vụ việc làm đồ án dự án PBL đặc trưng của DUT.

#### Thao tác 1: Truy cập bảng PBL
- Vào trang **GPA & Học phần DUT**.
- Bấm vào tên môn học PBL (ví dụ: *PBL 3: Dự án Công nghệ phần mềm*) để mở modal chi tiết.
- Chọn tab **Quản lý Đồ án PBL**.

#### Thao tác 2: Quản lý thành viên
- Nhập Tên, Vai trò (Leader, Developer, Tester...), và Số điện thoại của thành viên nhóm.
- Bấm **+ Thêm thành viên**.

#### Thao tác 3: Phân công nhiệm vụ nhóm (Mini Task Board)
- Nhập đầu việc cần làm (ví dụ: *Thiết kế cơ sở dữ liệu*).
- Chọn người phụ trách từ danh sách thành viên nhóm đã nhập ở bước trên.
- Bấm **+ Thêm nhiệm vụ**.
- **Cách quản lý tiến độ:** Bấm trực tiếp vào ô trạng thái của Task để xoay vòng trạng thái nhanh: `Chưa làm (⬜)` ➜ `Đang làm (⏳)` ➜ `Hoàn thành (✅)`.

#### Thao tác 4: Ghi nhật ký họp nhóm (Meeting Logs)
- Chọn ngày họp, nhập tên các thành viên vắng mặt (nếu có).
- Nhập tóm tắt nội dung cuộc họp vào ô ghi chú (ví dụ: *Thống nhất sơ đồ thực thể và phân chia task frontend*).
- Bấm **+ Thêm cuộc họp**.
---

### 💸 4. Các tính năng Sức khỏe, Chi tiêu & Nhật ký khác
- **Chi tiêu:** Đặt hạn mức chi tiêu mỗi tháng. Mỗi khi chi tiêu hàng ngày chạm ngưỡng 80% hoặc 100% hạn mức, hệ thống sẽ hiển thị dải cảnh báo nổi bật màu cam/đỏ ngay ở đầu trang chi tiêu để nhắc nhở.
- **Sức khỏe:** Điền nhật ký giấc ngủ và hoạt động. Nếu bạn ngủ dưới 6 tiếng liên tiếp trong 3 ngày, hoặc lười vận động quá 3 ngày, hệ thống sẽ kích hoạt cảnh báo sức khỏe.
- **Nhật ký:** Mood tracker giúp ghi nhận nhanh trạng thái cảm xúc kèm các câu hỏi gợi mở suy nghĩ để viết journaling cuối ngày.

---

### 🌟 5. Tự Thực Hiện Hóa (Self-Actualization Hub)
Giao diện đỉnh tháp nhu cầu hỗ trợ phát triển toàn diện bản thân cho tương lai sự nghiệp của sinh viên DUT.

#### Thao tác 1: Quản lý đọc sách & Tài chính cá nhân
- **Book Tracker:** Nhập tên sách và tác giả. Cập nhật thanh tiến trình đọc bằng cách nhập số phần trăm (`%`). Hệ thống tự phân loại trạng thái: `Chưa đọc (0%)`, `Đang đọc (1-99%)`, hoặc `Đã xong (100%)`.
- **Máy tính lãi kép:** Nhập tiền tích lũy hàng tháng, lãi suất kỳ vọng và số năm. Ứng dụng vẽ trực tiếp biểu đồ cột SVG mô phỏng tăng trưởng tài sản dự kiến qua từng năm.
- **Kiến thức bổ sung:** Xem các tài liệu ngắn gọn bổ sung kinh tế vĩ mô ngành IT và điều khoản hợp đồng/luật thuế cho Freelancer.

#### Thao tác 2: Luyện ngoại ngữ & Nạp nhanh từ vựng chuyên ngành
- **Chứng chỉ ngoại ngữ:** Nhập điểm hiện tại, điểm mục tiêu (IELTS, TOEIC, JLPT...) và ngày thi dự kiến để bám sát kế hoạch học.
- **Nhật ký luyện ngoại ngữ:** Ghi nhận số phút luyện nghe/đọc/nói/viết hàng ngày để tạo thói quen.
- **⚡ Nạp từ vựng IT:** Bấm nút **Nạp từ vựng chuyên ngành IT**. Hệ thống sẽ tự động tạo một bộ thẻ nhớ "Từ vựng chuyên ngành IT" trong Góc học tập chứa 10 flashcard thuật ngữ lập trình thông dụng kèm ví dụ chi tiết. Bạn có thể chuyển sang mục **Góc học tập** để bắt đầu ôn luyện bằng Spaced Repetition ngay.

#### Thao tác 3: Nghiên cứu khoa học & Khám phá Bản đồ Tri thức DUT
- **Bài báo & Ý tưởng:** Lưu trữ đường dẫn link tài liệu bài báo khoa học và ghi chú nhanh các ý tưởng đề tài PBL hay khóa luận tốt nghiệp.
- **Bản đồ Tri thức (Knowledge Map):** 
  - Chọn hướng đi sự nghiệp mong muốn (Backend, Frontend, DevOps, Data Analyst, PM) ở ô chọn.
  - Sơ đồ đồ thị SVG tương tác sẽ hiển thị: Hướng đi sự nghiệp ➜ Các kỹ năng bắt buộc ➜ Các học phần tương ứng tại trường DUT.
  - Hệ thống tự động phân tích điểm số và trạng thái học phần từ DB: Học phần **Đã đạt** sẽ phát sáng màu xanh lá nổi bật, môn học **Đang học/Không đạt** có viền cam, môn học **Chưa học** hiển thị nét đứt màu xám. Sinh viên có cái nhìn toàn cảnh về những kiến thức giảng đường đang đóng góp thế nào vào sự nghiệp tương lai.

#### Thao tác 4: Sử dụng Chatbot AI Cố vấn thông minh (Offline vs LLM Cloud)
- **Cài đặt API Key:** Vào trang **Cài đặt**, nhập Google Gemini API Key cá nhân của bạn để mở khóa toàn bộ năng lực hiểu ngữ cảnh của LLM thế hệ mới.
- **Sử dụng Heuristics Offline (Không cần API Key):** AI Advisor vẫn hoạt động 100% offline bằng công cụ phân tích dữ liệu cục bộ.
- **Thao tác nhanh:** Bấm các nút lối tắt ở màn hình AI:
  - **Lộ trình kỳ tới:** AI phân tích điểm thi, GPA, số tín chỉ tích lũy hiện tại và các môn bị nợ (F) để lập sơ đồ đăng ký môn tối ưu nhất.
  - **Phân tích thói quen:** AI đọc log sức khỏe và giờ ngủ trung bình để cảnh báo nếu bạn đang thiếu ngủ (<6.5 tiếng liên tiếp) và gợi ý nhịp độ Pomodoro tương ứng.
  - **Báo cáo tuần:** AI tổng hợp chi tiêu, năng suất học tập và các chỉ số tích lũy tuần qua.

#### Thao tác 5: Xây dựng Thương hiệu Cá nhân (Personal Branding)
- **GitHub Tracker:** Đặt mục tiêu số contributions GitHub mong muốn trong năm và nhập số contributions thực tế để vẽ tiến độ.
- **Tech Blog & Mentoring:** Ghi nhận link các bài chia sẻ kiến thức trên Medium/Viblo/LinkedIn và viết nhật ký hướng dẫn đàn em khóa dưới (Mentoring) để hoàn thiện kỹ năng mềm.

---

## Phần 4: Quy Trình Thao Tác Hàng Ngày Khuyên Dùng

Để sử dụng ứng dụng một cách tối ưu và mượt mà, hãy thiết lập thói quen sau:
1. **Buổi sáng:** Mở ứng dụng, vào **Dashboard** để xem lịch học hôm nay và danh sách các deadline sắp đến hạn.
2. **Khi học tập/làm bài tập:** 
   - Từ trang **Công việc** hoặc **Học phần**, bấm biểu tượng `⏱️` cạnh việc muốn làm để chuyển nhanh sang **Pomodoro**.
   - Bật đếm giờ và tập trung cao độ. Sau khi hết giờ, lưu log kèm ghi chú tiến độ.
3. **Cuối ngày:** 
   - Vào mục **Sức khỏe** cập nhật lượng nước uống, giờ ngủ tối hôm trước, và bài tập thể thao.
   - Viết vài dòng cảm nghĩ tại mục **Nhật ký** và chọn emoji cảm xúc của ngày.
   - Truy cập **Cài đặt -> Push to Cloud** để đồng bộ và lưu trữ an toàn toàn bộ dữ liệu học tập và cuộc sống lên đám mây.

---

## Phần 5: Hướng Dẫn Triển Khai Lên Vercel Toàn Diện

Hệ thống **Second Brain** của bạn là một ứng dụng Single Page Application (SPA) phát triển trên Vite + React. Ứng dụng chạy hoàn toàn ở phía Client, không cần server nền, giúp bạn có thể dễ dàng triển khai lên dịch vụ Cloud Vercel miễn phí theo 3 phương thức chuyên nghiệp sau:

### 1. Cách 1: Triển khai Kéo-Thả (Vercel Drop - Nhanh nhất)
Phương thức này phù hợp nhất nếu bạn chỉ muốn deploy nhanh bản build hiện tại mà không cần quản lý mã nguồn Git:
1. Tại thư mục chứa dự án `second-brain`, chạy lệnh sau để Vite tối ưu hóa và đóng gói ứng dụng:
   ```powershell
   npm run build
   ```
   *Kết quả:* Một thư mục tên `dist` sẽ được sinh ra ở thư mục gốc của dự án.
2. Truy cập [vercel.com/new/drop](https://vercel.com/new/drop) (đăng nhập bằng tài khoản Vercel).
3. Kéo và thả thư mục `dist` từ máy tính của bạn vào vùng tải lên của trang web Vercel.
4. Chờ trong giây lát, Vercel sẽ cấp cho bạn một đường dẫn công khai dạng `https://ten-du-an.vercel.app` để truy cập ứng dụng trên mọi thiết bị.

### 2. Cách 2: Liên kết GitHub/GitLab (Khuyên dùng - Auto CI/CD)
Đây là cách triển khai chuẩn công nghiệp, hệ thống sẽ tự động cập nhật (Auto Deploy) mỗi khi bạn chỉnh sửa và đẩy code mới lên GitHub:
1. **Đẩy mã nguồn lên GitHub:**
   - Tạo một repository mới trên GitHub (ví dụ đặt tên là `second-brain`).
   - Đẩy toàn bộ mã nguồn dự án của bạn lên repository đó qua Git:
     ```bash
     git init
     git add .
     git commit -m "Initial commit"
     git branch -M main
     git remote add origin <link-repo-github-cua-ban>
     git push -u origin main
     ```
2. **Liên kết với Vercel:**
   - Truy cập [vercel.com](https://vercel.com) và chọn **Add New** ➜ **Project**.
   - Chọn Import repository GitHub của bạn vừa đẩy lên.
   - Tại phần **Framework Preset**, Vercel sẽ tự động phát hiện dự án sử dụng **Vite**.
   - Mục **Build Command** mặc định sẽ là `vite build` và **Output Directory** là `dist`. Hãy giữ nguyên cấu hình này.
   - Bấm nút **Deploy**. Quá trình build sẽ tự động diễn ra và hoàn thành sau khoảng 30 giây.

### 3. Cách 3: Sử dụng Vercel CLI (Dành cho Lập trình viên)
Nếu bạn thích làm việc trên Terminal mà không cần mở trình duyệt:
1. Cài đặt Vercel CLI toàn cục trên máy tính:
   ```powershell
   npm install -g vercel
   ```
2. Đăng nhập tài khoản Vercel bằng CLI:
   ```powershell
   vercel login
   ```
3. Chạy lệnh sau tại thư mục gốc của dự án và chọn các thiết lập mặc định (Vercel CLI sẽ tự động phát hiện cấu hình Vite):
   ```powershell
   vercel
   ```
4. Khi muốn phát hành lên môi trường Production thực tế, chạy lệnh:
   ```powershell
   vercel --prod
   ```

---

### ⚙️ Lưu ý Cấu hình Kỹ thuật Quan trọng

#### A. Cấu hình Định tuyến (Routing SPA)
Khi bạn chuyển trang trong ứng dụng (ví dụ từ Dashboard sang mục Chi tiêu), React Router sẽ thay đổi đường dẫn URL. Nếu người dùng tải lại trang (F5) trực tiếp ở đường dẫn `https://ten-du-an.vercel.app/expenses`, máy chủ Vercel sẽ báo lỗi `404 Not Found` vì không tìm thấy file vật lý `/expenses`.
*Giải pháp:* Dự án đã cấu hình sẵn file [vercel.json](file:///d:/Development/projects/second-brain/vercel.json) ở thư mục gốc:
```json
{
  "cleanUrls": true,
  "rewrites": [
    { "source": "/assets/(.*)", "destination": "/assets/$1" },
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```
Cấu hình này yêu cầu Vercel chuyển hướng toàn bộ các request không phải asset tĩnh về file `index.html` để React Router xử lý, giúp ngăn chặn triệt để lỗi 404 khi reload trang.

#### B. Thiết lập Biến Môi Trường (Environment Variables)
Nếu bạn muốn sử dụng tính năng AI Advisor thông minh mà không cần phải nhập Google Gemini API Key thủ công trên thiết bị client:
1. Truy cập trang Dashboard quản trị dự án trên Vercel.
2. Vào tab **Settings** ➜ chọn **Environment Variables** từ menu bên trái.
3. Thêm một biến môi trường mới:
   * **Key:** `VITE_GEMINI_API_KEY`
   * **Value:** *(Dán mã API Key lấy từ Google AI Studio của bạn vào đây)*
4. Bấm **Save**.
5. Kể từ phiên build tiếp theo, ứng dụng sẽ tự động tích hợp API Key này vào luồng xử lý AI Advisor mà vẫn đảm bảo tính an toàn bảo mật, không lộ khóa API Key trong mã nguồn công khai của bạn.


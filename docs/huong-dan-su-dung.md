# Hướng dẫn sử dụng Finance AI Manager

## 1. Mục đích của ứng dụng

Finance AI Manager là ứng dụng quản lý tài chính cá nhân theo mô hình 6 hũ:

- Hũ chi tiêu cần thiết
- Tiết kiệm dài hạn
- Quỹ giáo dục
- Hũ hưởng thụ
- Quỹ tự do tài chính
- Quỹ từ thiện

Phiên bản hiện tại tập trung vào 4 luồng chính:

- Lập kế hoạch thu nhập tháng và phân bổ 6 hũ
- Ghi nhận giao dịch chi tiêu
- Theo dõi nợ giữa các hũ
- Import dữ liệu cũ từ Excel

## 2. Phạm vi hiện tại

- Ứng dụng chưa có đăng nhập; toàn bộ dữ liệu hiện gắn với một tài khoản demo duy nhất.
- Dữ liệu chính được lưu ở MongoDB thông qua backend Express.
- AI service đã có scaffold riêng nhưng chưa có tính năng AI thực tế trên giao diện người dùng.
- Route `/` tự động chuyển sang `/dashboard`.

## 3. Điều kiện để dùng ứng dụng

Để ứng dụng chạy đầy đủ, cần có:

- Frontend React
- Backend Express
- MongoDB đã kết nối thành công

AI service không bắt buộc cho các thao tác hiện tại.

## 4. Điều hướng nhanh

| Route | Mục đích chính | Thao tác nổi bật |
| --- | --- | --- |
| `/dashboard` | Xem tổng quan tài chính nhanh | Xem snapshot thu, chi, nợ, 6 hũ |
| `/jars` | Theo dõi từng hũ theo tháng | Chọn tháng, xem còn lại, đi sang giao dịch |
| `/transactions` | Ghi và quản lý giao dịch | Thêm, sửa, xóa, lọc, tìm kiếm, xóa hàng loạt |
| `/monthly-plan` | Khai báo thu nhập tháng và phân bổ hũ | Tạo thu nhập tháng, chia tự động, chỉnh phân bổ |
| `/debts` | Theo dõi nợ giữa các hũ | Thêm, sửa, xóa khoản nợ nội bộ |
| `/import` | Nhập dữ liệu từ Excel | Upload file, xem kết quả import, xóa dữ liệu cũ |
| `/settings` | Khu vực cài đặt | Hiện mới là màn hình placeholder |

## 5. Quy ước nhập liệu quan trọng

- Tiền tệ đang dùng là `VND`.
- Ở route `/transactions`, số tiền nhập theo đơn vị nghìn đồng để nhập nhanh.
- Ví dụ tại `/transactions`: nhập `100` nghĩa là `100.000 VND`.
- Ở các route `/monthly-plan` và `/debts`, số tiền đang nhập theo giá trị VND đầy đủ.
- Ví dụ tại `/monthly-plan`: nhập `30000000` nghĩa là `30.000.000 VND`.
- Mỗi tháng chỉ có một bản ghi thu nhập tháng.
- Một hũ chỉ có một bản ghi phân bổ cho mỗi tháng thu nhập.
- Dashboard chỉ là màn hình tổng quan nhanh, không thay thế cho báo cáo chi tiết.

## 6. Điều hướng và thao tác chung

### Thanh điều hướng

- Desktop dùng sidebar bên trái.
- Mobile có bottom navigation cho 4 màn chính: `Dashboard`, `6 Hũ`, `Giao dịch`, `Kế hoạch tháng`.

### Header toàn cục

- Nút `Thêm giao dịch` ở góc trên mở nhanh form thêm giao dịch.
- Nút này dẫn về route `/transactions?quickAdd=1`.

## 7. Hướng dẫn theo từng route

### Route `/dashboard`

#### Mục đích

Màn hình này dùng để xem tình trạng tài chính tổng quát trong một lần nhìn:

- Thu nhập tháng gần nhất
- Tổng đã phân bổ của tháng gần nhất
- Chi gần đây
- Nợ đang mở
- Snapshot 6 hũ
- Một số tín hiệu nhắc việc để theo dõi nhanh

#### Những gì đang hiển thị

- Trạng thái API backend
- 3 số chính ở đầu trang: thu nhập gần nhất, chi gần đây, chênh lệch
- Tiến độ phân bổ thu nhập của tháng gần nhất
- 4 thẻ thống kê nhanh
- Danh sách giao dịch gần nhất
- Snapshot các hũ từ dữ liệu phân bổ mới nhất

#### Cách dùng

1. Mở ứng dụng, hệ thống sẽ chuyển bạn về `/dashboard`.
2. Kiểm tra các chỉ số ở đầu trang để biết tháng gần nhất đã có thu nhập và phân bổ hay chưa.
3. Xem khu vực `Recent transactions` để nắm các khoản chi vừa phát sinh.
4. Nếu muốn ghi thêm chi tiêu ngay, dùng nút `Thêm giao dịch` trên header.
5. Nếu muốn theo dõi từng hũ theo tháng, chuyển sang route `/jars`.

#### Lưu ý

- Đây là màn hình xem nhanh, không phải nơi chỉnh sửa dữ liệu chính.
- Dashboard đang lấy dữ liệu gần đây để làm snapshot, không phải toàn bộ lịch sử.
- Các thao tác chi tiết theo hũ nên thực hiện ở `/jars` hoặc `/transactions`.

### Route `/jars`

#### Mục đích

Màn hình này dùng để xem 6 hũ theo từng tháng, bao gồm:

- Số đã phân bổ vào từng hũ
- Số đã chi theo từng hũ
- Số còn lại
- Tỷ lệ mục tiêu
- Gợi ý ngân sách theo ngày
- Cảnh báo chi vượt nhịp

#### Những gì đang hiển thị

- Bộ chọn tháng ở đầu màn hình
- Tóm tắt số lượng hũ, số hũ đang active, tổng phân bổ
- Tỷ lệ phân bổ của từng hũ
- Các thẻ hũ chi tiết

#### Cách dùng

1. Chọn tháng ở bộ chọn `Tháng đang xem`.
2. Xem từng thẻ hũ để biết:
   - Đã phân bổ bao nhiêu
   - Đã chi bao nhiêu
   - Còn lại bao nhiêu
   - Nên dùng khoảng bao nhiêu mỗi ngày
3. Bấm nút `Chi từ hũ` để mở nhanh form thêm giao dịch cho đúng hũ và đúng tháng.
4. Bấm nút `Xem lịch sử` để chuyển sang `/transactions` với bộ lọc theo hũ và tháng đã chọn.

#### Lưu ý

- Nếu chưa có phân bổ cho tháng đó, thẻ hũ vẫn hiện nhưng số liệu có thể bằng `0`.
- Cảnh báo trên hũ chỉ là gợi ý nhanh dựa trên mức phân bổ và mức chi đã phát sinh.

### Route `/transactions`

#### Mục đích

Màn hình này dùng để quản lý giao dịch chi tiêu hằng ngày.

#### Chức năng đang có

- Thêm giao dịch mới
- Sửa giao dịch
- Xóa từng giao dịch
- Chọn nhiều giao dịch để xóa hàng loạt
- Tìm kiếm theo mô tả, ghi chú, hũ, ngày, tháng, danh mục, số tiền
- Lọc theo hũ, danh mục và tháng

#### Cách thêm giao dịch

1. Vào `/transactions` hoặc bấm nút `Thêm giao dịch` trên header.
2. Trong popup nhập liệu, điền:
   - `Tháng giao dịch`
   - `Ngày giao dịch`
   - `Số tiền`
   - `Hũ`
   - `Mô tả`
   - `Ghi chú` nếu cần
3. Chọn danh mục chi tiêu nếu muốn.
4. Bấm `Tạo giao dịch`.

#### Quy ước nhập tiền ở màn này

- Nhập theo nghìn đồng.
- `100` = `100.000 VND`
- `74` = `74.000 VND`
- Khi sửa giao dịch, hệ thống cũng hiển thị lại theo quy ước này.

#### Cách tìm và lọc

- Ô tìm kiếm hỗ trợ cả chữ lẫn số tiền.
- Có thể gõ các kiểu như `74k`, `74000`, `74.000`, `0đ`.
- Có thể lọc riêng theo:
  - hũ
  - danh mục
  - tháng

#### Cách sửa hoặc xóa

1. Tìm giao dịch cần xử lý trong bảng.
2. Bấm `Sửa` để nạp dữ liệu lên popup và chỉnh lại.
3. Bấm `Xóa` để xóa một giao dịch.
4. Nếu cần xóa nhiều dòng:
   - tick chọn các giao dịch
   - dùng `Chọn tất cả` nếu cần
   - bấm `Xóa đã chọn`

#### Lưu ý

- Giao diện hiện tại đang phục vụ chủ yếu cho giao dịch chi tiêu.
- Dù backend có hỗ trợ một số `direction` khác, UI hiện tại luôn tạo giao dịch với loại `expense`.
- Nếu đi vào từ `/jars`, form có thể tự điền sẵn hũ và tháng.

### Route `/monthly-plan`

#### Mục đích

Màn hình này dùng để:

- Khai báo tổng thu nhập của từng tháng
- Tạo phân bổ 6 hũ cho tháng đó
- Chỉnh sửa phân bổ khi cần

#### Khu vực 1: Thu nhập tháng

Tại form bên trái, bạn có thể tạo hoặc sửa một bản ghi thu nhập tháng với các trường:

- `Tháng`
- `Tổng thu nhập`
- `Ngày nhận`
- `Ghi chú nguồn`
- `Cách xử lý thu nhập`

#### Hai cách xử lý thu nhập

##### 1. Chia theo 6 hũ chuẩn

Khi chọn `Chia theo 6 hũ chuẩn`, hệ thống tự tạo phân bổ theo tỷ lệ:

- `55%` vào `essentials`
- `10%` vào `long_term_saving`
- `10%` vào `education`
- `10%` vào `enjoyment`
- `10%` vào `financial_freedom`
- `5%` vào `charity`

##### 2. Dồn vào một hũ

Khi chọn `Ném thẳng vào một hũ`, toàn bộ thu nhập tháng sẽ được đưa vào hũ bạn chọn với tỷ lệ `100%`.

#### Khu vực 2: Allocation board

Khu vực bên phải dùng để:

- Xem phân bổ của tháng đang focus
- Thêm một phân bổ thủ công cho từng hũ
- Sửa hoặc xóa phân bổ đã có

#### Cách dùng đề xuất

1. Tạo `Thu nhập tháng` trước.
2. Chọn cách xử lý:
   - chia chuẩn 6 hũ
   - hoặc dồn vào một hũ
3. Lưu lại để hệ thống tự sinh các phân bổ ban đầu.
4. Nếu cần chỉnh tay, dùng form `Allocation board`.
5. Theo dõi bảng `Lịch sử thu nhập` và `Lịch sử phân bổ` ở bên dưới để sửa hoặc xóa.

#### Lưu ý

- Mỗi tháng chỉ tạo được một bản ghi thu nhập.
- Nếu tạo trùng tháng, backend sẽ báo lỗi.
- Ở màn này, số tiền nhập theo VND đầy đủ, không phải đơn vị nghìn.
- Xóa một `Thu nhập tháng` sẽ xóa luôn các phân bổ gắn với tháng đó.

### Route `/debts`

#### Mục đích

Màn hình này dùng để ghi nhận nợ giữa các hũ, ví dụ:

- Hũ chi tiêu cần thiết tạm ứng cho hũ giáo dục
- Hũ này chi hộ cho hũ kia rồi cần theo dõi hoàn trả sau

#### Các trường cần nhập

- `Từ hũ`
- `Sang hũ`
- `Tháng`
- `Số tiền`
- `Ngày ghi nhận`
- `Trạng thái`
- `Ngày tất toán`
- `Lý do`

#### Cách dùng

1. Chọn hũ nguồn ở `Từ hũ`.
2. Chọn hũ nhận nợ ở `Sang hũ`.
3. Nhập tháng và số tiền.
4. Chọn ngày ghi nhận.
5. Đặt trạng thái:
   - `open` nếu còn nợ
   - `settled` nếu đã tất toán
6. Nếu đã tất toán, có thể nhập thêm `Ngày tất toán`.
7. Bấm `Tạo khoản nợ`.

#### Cách sửa hoặc xóa

- Dùng bảng phía dưới để bấm `Sửa` hoặc `Xóa`.

#### Lưu ý

- `Từ hũ` và `Sang hũ` phải khác nhau.
- Ở màn này, số tiền cũng nhập theo VND đầy đủ.
- Màn này hiện chưa có bộ lọc tìm kiếm riêng.

### Route `/import`

#### Mục đích

Màn hình này dùng để đưa dữ liệu cũ từ Excel vào hệ thống.

#### File hỗ trợ

- `.xlsx`
- `.xls`

#### Những sheet đang được nhận diện

- Sheet có tên chứa `6 hũ` sẽ được dùng để import:
  - `monthly_incomes`
  - `jar_allocations`
- Sheet có tên chứa `Tháng ...` sẽ được dùng để import:
  - `transactions`
- Sheet có tên chứa `Nợ quỹ` sẽ được dùng để import:
  - `jar_debts`

Các sheet không nhận diện được sẽ bị bỏ qua an toàn và được ghi vào `Warnings`.

#### Cách import

1. Vào route `/import`.
2. Kéo thả file Excel vào vùng upload hoặc bấm để chọn file.
3. Bấm `Bắt đầu import`.
4. Chờ backend phân tích workbook.
5. Xem phần `Kết quả import`:
   - số bản ghi đã chèn
   - số dòng bị bỏ qua
   - sheet đã phát hiện
   - warning
   - error

#### Cách xóa dữ liệu cũ

Nút `Xóa dữ liệu cũ` sẽ xóa:

- monthly incomes
- jar allocations
- transactions
- jar debts
- AI advice logs

Hệ thống vẫn giữ lại:

- user demo
- danh sách 6 hũ

#### Lưu ý

- Import hiện chưa có bước preview xác nhận trước khi ghi dữ liệu.
- Hệ thống có cơ chế bỏ qua một số dòng trùng hoặc dòng không hợp lệ.
- Workbook cũ nhập theo đơn vị nghìn đồng vẫn có thể được normalize trong quá trình import.

### Route `/settings`

#### Trạng thái hiện tại

Màn hình này mới là placeholder để giới thiệu các module dự kiến:

- giao diện
- dữ liệu
- cá nhân hóa

#### Thực tế hiện tại

- Chưa có form cài đặt
- Chưa có lưu cấu hình
- Chưa có export CSV hay reset cá nhân hóa từ UI này

## 8. Luồng sử dụng khuyến nghị cho người dùng

### Nếu bạn bắt đầu từ dữ liệu cũ trong Excel

1. Vào `/import` để nhập workbook cũ.
2. Kiểm tra `Warnings` và `Errors`.
3. Sang `/monthly-plan` để soát lại thu nhập tháng và phân bổ.
4. Sang `/jars` để xem từng hũ còn lại bao nhiêu.
5. Dùng `/transactions` để tiếp tục ghi các chi tiêu mới hằng ngày.
6. Nếu có chi hộ giữa các hũ, ghi ở `/debts`.
7. Xem `/dashboard` mỗi ngày để theo dõi tổng quan.

### Nếu bạn bắt đầu nhập tay từ đầu

1. Vào `/monthly-plan` để tạo thu nhập tháng đầu tiên.
2. Tạo phân bổ 6 hũ.
3. Sang `/jars` để xem từng hũ.
4. Ghi giao dịch hằng ngày ở `/transactions`.
5. Ghi nợ giữa các hũ ở `/debts` nếu có.
6. Dùng `/dashboard` để xem snapshot nhanh.

## 9. Những gì chưa có hoặc chưa hoàn thiện

- Chưa có đăng nhập và phân quyền
- Chưa có nhiều người dùng
- Chưa có AI insight thực tế trên UI
- Chưa có export dữ liệu
- Chưa có cài đặt hoạt động thực tế ở `/settings`
- `/dashboard` là snapshot nhanh, không phải báo cáo phân tích đầy đủ
- Giao diện hiện mới hỗ trợ nhập tay giao dịch chi tiêu; chưa có luồng UI riêng cho `income_adjustment` hoặc `transfer`

## 10. Tóm tắt ngắn

Nếu chỉ cần nhớ một luồng đơn giản, hãy dùng theo thứ tự:

1. `/monthly-plan` để tạo thu nhập tháng
2. `/jars` để xem tiền được chia vào từng hũ
3. `/transactions` để ghi chi tiêu hằng ngày
4. `/debts` nếu có hũ chi hộ hũ khác
5. `/dashboard` để xem tổng quan nhanh
6. `/import` khi cần đưa dữ liệu cũ từ Excel vào hệ thống

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
- AI service đang phục vụ 2 nhóm việc chính:
  - trợ lý AI trong giao diện web
  - phân loại giao dịch bằng AI trong luồng import và phân loại lại dữ liệu
- Route `/` tự động chuyển sang `/dashboard`.

## 3. Điều kiện để dùng ứng dụng

Để ứng dụng chạy đầy đủ các luồng chính, cần có:

- Frontend React
- Backend Express
- MongoDB đã kết nối thành công
- AI service đã chạy nếu muốn dùng trợ lý AI và các luồng phân loại bằng AI

Nếu chỉ nhập tay và xem dữ liệu cơ bản, backend + database là phần bắt buộc nhất. Nếu muốn dùng trợ lý AI thật hoặc phân loại AI, cần bật thêm AI service.

## 4. Điều hướng nhanh

| Route | Mục đích chính | Thao tác nổi bật |
| --- | --- | --- |
| `/dashboard` | Xem tổng quan tài chính nhanh | Xem snapshot thu, chi, nợ, 6 hũ |
| `/jars` | Theo dõi từng hũ theo tháng | Chọn tháng, xem còn lại, đi sang giao dịch |
| `/transactions` | Ghi và quản lý giao dịch | Thêm, sửa, xóa, lọc, tìm kiếm, xóa hàng loạt |
| `/monthly-plan` | Khai báo thu nhập tháng và phân bổ hũ | Tạo thu nhập tháng, chia tự động, chỉnh phân bổ |
| `/actual-balances` | Lưu số dư thực theo từng tháng | Ghi snapshot tiền thật còn giữ ở từng hũ |
| `/debts` | Theo dõi nợ giữa các hũ | Thêm, sửa, xóa khoản nợ nội bộ |
| `/import` | Nhập dữ liệu từ Excel | Upload file, xem kết quả import, xóa dữ liệu cũ |
| `/settings` | Khu vực cài đặt | Hiện mới là màn hình placeholder |

## 5. Quy ước nhập liệu quan trọng

- Tiền tệ đang dùng là `VND`.
- Ở route `/transactions`, số tiền nhập theo đơn vị nghìn đồng để nhập nhanh.
- Ví dụ tại `/transactions`: nhập `100` nghĩa là `100.000 VND`.
- Ở route `/monthly-plan`, `Tổng thu nhập` dùng quy ước nhập tiền thông minh giống `Số dư thực`:
  - nếu có `,` hoặc `.` thì hệ thống hiểu đó là giá trị thật và chỉ bỏ dấu phân cách
  - ví dụ `30,000,000` sẽ được hiểu là `30.000.000 VND`
  - nếu không có `,` hoặc `.` thì hệ thống hiểu bạn đang nhập theo nghìn đồng
  - ví dụ `30000` sẽ được hiểu là `30.000.000 VND`
- Ở route `/debts`, số tiền vẫn đang nhập theo giá trị VND đầy đủ.
- Ở route `/actual-balances`, có quy ước riêng để tránh nhập nhầm đơn vị:
  - nếu có `,` hoặc `.` thì hệ thống hiểu đó là giá trị thật và chỉ bỏ dấu phân cách
  - ví dụ `83,869` sẽ được hiểu là `83.869 VND`
  - nếu không có `,` hoặc `.` thì hệ thống hiểu bạn đang nhập theo nghìn đồng
  - ví dụ `83869` sẽ được hiểu là `83.869.000 VND`
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
- Trợ lý AI nổi ở góc phải dưới và có thể dùng ở mọi màn hình vì widget được mount ở layout chung.

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
- Khu vực hiển thị riêng số dư thực giữ lại từ snapshot tháng trước nếu đã có nhập ở `/actual-balances`

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
- Tiền giữ riêng từ tháng trước chỉ để đối chiếu, không tự cộng vào ngân sách tháng đang quản lý.

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
- Khu tham chiếu `Giữ riêng` nếu tháng trước đã có snapshot số dư thực

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
- Snapshot số dư thực tháng trước không được cộng vào `Còn lại` của tháng đang xem.

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

- `Tổng thu nhập`
- `Ngày nhận`
- `Ghi chú nguồn`
- `Cách xử lý thu nhập`

`Tháng` sẽ được suy ra tự động từ `Ngày nhận`, nên bạn không cần chọn tách riêng nữa.

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
- Ở màn này, `Tổng thu nhập` dùng logic nhập tiền thông minh:
  - có dấu `,` hoặc `.` thì lưu đúng giá trị thật
  - không có dấu thì hiểu là nhập theo nghìn đồng
- Bấm trực tiếp vào ô `Ngày nhận` sẽ mở picker ngày, không cần nhấn riêng vào icon lịch.
- Xóa một `Thu nhập tháng` sẽ xóa luôn các phân bổ gắn với tháng đó.

### Route `/actual-balances`

#### Mục đích

Màn hình này dùng để lưu riêng số tiền thực tế vẫn còn nằm trong từng hũ theo từng tháng, ví dụ phần tiền dư của tháng 3 mà bạn không muốn cộng thẳng vào ngân sách tháng 4.

#### Những gì đang hiển thị

- Bộ chọn tháng để chọn tháng đang chụp snapshot
- 6 thẻ tương ứng 6 hũ
- Mỗi thẻ có:
  - số dư tham chiếu từ tháng trước
  - giá trị preview sau khi chuẩn hóa đơn vị nhập
  - ô nhập `Số dư thực`
  - ô `Ghi chú`
- Nút `Lưu hũ này`
- Nút `Lưu toàn bộ tháng`
- Nút `Dùng dữ liệu tháng trước`
- Nút `Chạy sinh lời ngày`

#### Sinh lời MoMo ở màn này

- Mỗi hũ có thể bật sinh lời MoMo riêng.
- Người dùng có thể lưu:
  - ngày kích hoạt sinh lời
  - tỷ suất sinh lời năm
  - trạng thái bật/tắt sinh lời
- App sẽ tính:
  - lãi gộp
  - thuế tạm khấu trừ 5%
  - lãi ròng
- Lãi ròng được ghi nhận như giao dịch hệ thống và được cộng vào số dư thực.
- Ở phiên bản hiện tại, app áp dụng mốc bắt đầu tính lãi sau `2 ngày` kể từ ngày kích hoạt.
- Hạn mức MoMo như `25.000.000đ/quỹ` và `100.000.000đ/tháng` hiện chưa được kiểm soát tự động trong app.

#### Cách dùng

1. Vào `/actual-balances`.
2. Chọn tháng muốn lưu snapshot.
3. Nhập số dư thực cho từng hũ.
4. Kiểm tra ô preview để chắc rằng hệ thống đã hiểu đúng đơn vị.
5. Lưu từng hũ hoặc bấm lưu toàn bộ tháng.
6. Sau đó sang `/dashboard` hoặc `/jars` để xem phần `Giữ riêng` được tách khỏi ngân sách tháng đang quản lý.

#### Lưu ý

- Dữ liệu ở màn này là snapshot tham chiếu, không thay thế cho phân bổ hũ của tháng.
- Snapshot tháng trước không được tự cộng vào `Còn lại` hay `daily budget` của tháng mới.
- Nếu dùng nút `Dùng dữ liệu tháng trước`, bạn vẫn cần bấm lưu để tạo snapshot mới cho tháng hiện tại.
- Nếu dùng `Chạy sinh lời ngày`, hệ thống sẽ tạo giao dịch lợi nhuận cho các hũ đủ điều kiện sinh lời trong tháng đang xử lý.

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
6. Nếu cần, dùng thêm nút `Phân loại lại giao dịch bằng AI` để yêu cầu AI chạy lại category trên dữ liệu đã có.

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
- Luồng import hiện có tích hợp AI để:
  - tách và phân loại giao dịch dựa trên mô tả
  - gợi ý danh mục chi tiêu phù hợp
  - phân loại lại dữ liệu đã import khi người dùng chủ động chạy lại

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
- Đã có trợ lý AI trong giao diện nhưng vẫn phụ thuộc vào context và dữ liệu hiện có; nếu dữ liệu thiếu thì câu trả lời cũng sẽ bị giới hạn theo
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

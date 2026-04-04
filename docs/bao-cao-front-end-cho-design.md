# Báo cáo Frontend cho Team Design

## 1. Mục tiêu tài liệu

Tài liệu này dùng để handoff cho team design khi tinh chỉnh lại frontend của Finance AI Manager.

Mục tiêu:

- Nắm được toàn bộ màn hình hiện có
- Biết mỗi màn đang phục vụ nghiệp vụ gì
- Biết component nào đang dùng thật, component nào đang thừa hoặc di sản
- Nhìn ra các vấn đề về visual system, consistency và information density
- Có định hướng rõ ràng để redesign gọn, đồng bộ và dễ scale

## 2. Tổng quan frontend hiện tại

### Tech stack

- React 18
- React Router
- Vite
- Tailwind CSS v4
- Framer Motion
- Heroicons

### Kiến trúc UI hiện tại

Frontend đang theo mô hình:

- `Layout` cố định toàn app
- Sidebar trái cho desktop
- Header trên cùng
- Bottom navigation cho mobile
- Mỗi route là một page lớn
- Page tự gọi API và quản lý state cục bộ
- Nhiều page dùng chung các card/table component

### Đặc điểm visual hiện tại

- Hướng visual chính là dark fintech dashboard
- Nhiều gradient tím/xanh
- Card bo góc lớn, shadow dày
- Typography và spacing khá rộng
- Hầu hết page đều dùng cùng một mô-típ hero section + stat cards + section cards

### Vấn đề đáng chú ý ngay

- Có lỗi encoding tiếng Việt ở rất nhiều text UI
- Có sự pha trộn giữa Tailwind utility mới và CSS class cũ trong `styles.css`
- Một số component/utility cũ còn tồn tại nhưng không còn được dùng thực tế
- Một số màn đang rất “nặng thông tin”, đặc biệt là `Jars`, `Transactions`, `Actual Balances`, `Monthly Plan`

## 3. Sơ đồ route hiện có

### Route chính

| Route | Màn hình | Mục đích nghiệp vụ |
| --- | --- | --- |
| `/dashboard` | DashboardPage | Tổng quan tài chính nhanh |
| `/jars` | JarsPage | Theo dõi 6 hũ theo tháng |
| `/transactions` | TransactionsPage | Giao dịch, lọc, tìm kiếm, nhập nhanh |
| `/monthly-plan` | MonthlyPlanPage | Thu nhập tháng và phân bổ 6 hũ |
| `/actual-balances` | ActualBalancesPage | Snapshot số dư thực còn giữ riêng theo tháng |
| `/debts` | DebtsPage | Nợ giữa các hũ |
| `/import` | ImportExcel | Import dữ liệu Excel và thao tác dữ liệu import |
| `/settings` | SettingsPage | Placeholder, chưa có chức năng thật |

### Route điều hướng ngầm

- `/` tự redirect sang `/dashboard`
- `Header` có CTA đi nhanh tới `/transactions?quickAdd=1`
- `JarsPage` và `DashboardPage` có deep link sang `/transactions` theo `jar` và `month`
- Assistant widget có thể điều hướng người dùng tới section cụ thể thông qua `data-assistant-target`

## 4. Khung layout toàn app

### 4.1 Layout shell

File chính:

- `client/src/components/Layout.jsx`

Thành phần:

- `Sidebar`
- `Header`
- `Outlet`
- `MobileBottomNav`
- `AssistantWidget`

Nhận xét design:

- Layout đủ rõ nhưng đang khá “app-like”, ít khoảng nghỉ
- Header + sidebar + floating assistant + mobile nav cùng hiện diện làm visual layer hơi đông
- Có thể tinh gọn lại bằng cách giảm số lớp nổi, giảm shadow, và chuẩn hóa z-index / prominence

### 4.2 Sidebar

File:

- `client/src/components/Sidebar.jsx`

Chức năng:

- Điều hướng toàn bộ route
- Có visual active state
- Có phiên bản drawer trên mobile

Nhận xét:

- Sidebar đang khá đúng hướng, nhưng copy nhiều chỗ bị lỗi encoding
- Hierarchy text giữa `label` và `title` chưa thật sắc
- Có thể tinh gọn density để dễ quét hơn

### 4.3 Header

File:

- `client/src/components/Header.jsx`

Chức năng:

- Hiển thị title / description của page hiện tại
- Có CTA `Thêm giao dịch`
- Có nút avatar placeholder `DH`

Nhận xét:

- Header đang hữu ích nhưng hơi lặp vai trò với hero section của từng page
- Mỗi page đều có hero lớn riêng nên header trở thành lớp thông tin thứ hai
- Team design nên quyết định rõ:
  - Header chỉ là utility bar
  - hoặc hero page sẽ nhẹ đi để không trùng thông tin

### 4.4 Mobile bottom navigation

File:

- `client/src/components/MobileBottomNav.jsx`

Chức năng:

- Chỉ hiện 4 route core:
  - Dashboard
  - 6 Hũ
  - Giao dịch
  - Kế hoạch tháng

Nhận xét:

- Hợp lý cho mobile
- Active state nổi bật
- Nhưng vì assistant widget cũng nổi ở góc dưới, cần kiểm tra va chạm visual và thao tác

### 4.5 Assistant widget

File:

- `client/src/components/AssistantWidget.jsx`

Chức năng:

- Chat nổi toàn cục
- Gọi API `/assistant/chat`
- Có thể điều hướng người dùng tới màn hoặc section cụ thể

Nhận xét:

- Đây là lớp UI quan trọng nhưng rất cạnh tranh sự chú ý với FAB/action button khác
- Khi mở widget, nó trở thành một modal panel riêng
- Design cần quyết định mức độ ưu tiên thật sự của assistant:
  - luôn nổi
  - chỉ hiện ở một số màn
  - hay thu nhỏ thành entry point tinh tế hơn

## 5. Báo cáo theo từng page

### 5.1 Dashboard

File:

- `client/src/pages/DashboardPage.jsx`

Vai trò:

- Màn tổng quan tài chính nhanh

Khối UI chính:

- Hero section
- Progress card
- 4 stat cards
- Card lãi ròng tháng hiện tại
- Reserve snapshot note
- Snapshot 6 hũ
- Recent transactions ngang

Tương tác:

- Click từ jar card để:
  - thêm giao dịch nhanh
  - xem lịch sử giao dịch theo hũ

Nhận xét design:

- Màn này nhiều khối tốt nhưng hơi “quá đầy” cho dashboard
- Có ít nhất 3 lớp summary cùng lúc:
  - hero numbers
  - stat cards
  - card riêng cho yield
- Có thể gộp / giảm để dashboard nhìn “nhanh” đúng nghĩa hơn

### 5.2 Jars

File:

- `client/src/pages/JarsPage.jsx`

Vai trò:

- Màn giám sát từng hũ theo tháng

Khối UI chính:

- Hero + month picker
- Allocation mix panel
- 5 summary cards
- Separation note
- Grid các `JarCard`

Tương tác:

- Chọn tháng
- Nhảy sang transaction form theo hũ
- Nhảy sang lịch sử transaction theo hũ

Logic hiển thị đặc biệt:

- Tách “ngân sách tháng” với “số dư thực giữ riêng từ tháng trước”
- Có thêm phần `positive adjustment / momo yield`
- Có cảnh báo overspend và daily budget

Nhận xét design:

- Đây là màn nhiều logic nhất trong nhóm dashboarding
- Một card hũ hiện đang gánh quá nhiều lớp thông tin:
  - tên hũ
  - phần bổ
  - đã chi
  - còn lại
  - reserve
  - tỷ lệ mục tiêu
  - daily budget
  - warning
  - 2 CTA
- Team design nên ưu tiên tách “primary metrics” và “secondary insights” để card dễ đọc hơn

### 5.3 Transactions

File:

- `client/src/pages/TransactionsPage.jsx`

Vai trò:

- Màn CRUD giao dịch + tìm kiếm + lọc + quick add

Khối UI chính:

- Hero section
- Quick actions panel
- Search & filters bar
- Optional `JarHistoryInsights`
- `TransactionTable`
- Modal editor

Tương tác:

- Thêm giao dịch
- Sửa giao dịch
- Xóa giao dịch
- Xóa hàng loạt
- Lọc theo hũ / danh mục / tháng
- Search theo text hoặc amount
- Quick add từ header hoặc từ page khác

Điểm đặc biệt:

- Nếu đã chọn `jar` và `month`, màn này mở thêm block `JarHistoryInsights`
- Table hỗ trợ cả transaction expense và income adjustment
- Modal editor là form inline trong page, không phải route riêng

Nhận xét design:

- Đây là màn functional mạnh nhất
- UX tương đối tốt nhưng độ dày giao diện cao
- Search/filter block và modal form đều ổn, nhưng `JarHistoryInsights` xuất hiện thêm làm page có thể dài và nặng
- Nên cân nhắc:
  - chuyển `JarHistoryInsights` thành drawer / tab / expandable section
  - hoặc tách thành route detail riêng

### 5.4 Monthly Plan

File:

- `client/src/pages/MonthlyPlanPage.jsx`

Vai trò:

- Nhập thu nhập tháng
- Tạo phân bổ tự động hoặc dồn một hũ
- Chỉnh sửa allocation

Khối UI chính:

- Hero overview
- Income form
- Allocation board
- Focus summary
- Monthly income table
- Jar allocation table

Tương tác:

- Nhập thu nhập
- Auto split classic 6 jars
- Dồn vào 1 hũ
- Edit income
- Edit allocation
- Delete income / allocation
- Scroll tới form khi edit

Nhận xét design:

- Màn này thiên về planner / operations
- Bố cục chia 2 cột hiện hợp lý nhưng information architecture vẫn còn dày
- Có thể làm rõ hơn 2 tầng:
  - “Step 1: Tạo tháng thu nhập”
  - “Step 2: Phân bổ”
- Hiện tại user có thể thấy hơi nặng vì form + board + 2 bảng lịch sử cùng nằm trên một page

### 5.5 Actual Balances

File:

- `client/src/pages/ActualBalancesPage.jsx`

Vai trò:

- Ghi snapshot số dư thực còn giữ riêng theo từng hũ và từng tháng
- Có logic lãi MoMo / yield

Khối UI chính:

- Hero overview
- Rule/hint panel
- Month picker
- Action row:
  - copy tháng trước
  - chạy sinh lãi ngày
  - lưu toàn bộ tháng
- Grid card theo từng hũ

Tương tác:

- Save từng hũ
- Delete từng snapshot
- Save all
- Copy previous month
- Run daily yield
- Toggle yield on/off từng hũ

Nhận xét design:

- Đây là màn phức tạp nhất frontend hiện tại
- Nặng cả về nghiệp vụ lẫn density giao diện
- Card mỗi hũ đang chứa quá nhiều field và có nguy cơ làm user mệt
- Design nên cân nhắc chia 2 chế độ:
  - chế độ overview
  - chế độ edit chi tiết
- Hoặc chuyển mỗi card thành accordion / drawer / detail panel

### 5.6 Debts

File:

- `client/src/pages/DebtsPage.jsx`

Vai trò:

- Ghi nhận nợ giữa các hũ

Khối UI chính:

- Hero overview
- Form section
- Debt table

Tương tác:

- Tạo khoản nợ
- Sửa
- Xóa
- Scroll về form khi edit

Nhận xét design:

- Màn này đang theo style cũ nhiều hơn màn khác
- Form dùng class-based CSS, không phải utility pattern đồng nhất như các page còn lại
- Đây là một “outlier” rõ rệt, nên cần redesign lại để khớp hệ thống mới

### 5.7 Import

File:

- `client/src/pages/ImportExcel.jsx`

Vai trò:

- Upload file Excel
- Xóa dữ liệu imported
- AI reclassify transaction
- Xem import summary

Khối UI chính:

- Hero overview
- Dropzone
- Action buttons
- Import summary

Tương tác:

- Chọn file
- Import
- Reclassify bằng AI
- Clear imported data

Nhận xét design:

- Màn này tương đối rõ
- Có thể làm “operations dashboard” gọn hơn
- Priority design ở đây không cao bằng `Jars`, `Transactions`, `Actual Balances`

### 5.8 Settings

File:

- `client/src/pages/SettingsPage.jsx`

Vai trò:

- Placeholder

Nhận xét:

- Chưa có feature thật
- Chỉ cần giữ trạng thái placeholder hoặc ẩn khỏi navigation cho đến khi có chức năng thật

## 6. Inventory component đang dùng thật

### Layout / navigation

- `Layout`
- `Header`
- `Sidebar`
- `MobileBottomNav`
- `AssistantWidget`

### Domain / feature components

- `JarCard`
- `TransactionTable`
- `JarHistoryInsights`
- `MonthlyIncomeTable`
- `JarAllocationTable`
- `DebtTable`
- `FormSection`
- `Dropzone`
- `ImportSummary`

### Utility / formatting

- `formatters.js`
- `moneyInput.js`
- `actualBalanceSnapshots.js`

## 7. Component di sản hoặc đang treo

### Có file nhưng hiện không thấy dùng trong current routes

- `AdvicePanel`
- `StatCard`

### Ý nghĩa

- Đây là dấu hiệu frontend đã qua ít nhất 2 vòng refactor
- Có phần cũ chưa dọn
- Team design và frontend nên chốt:
  - component nào còn dùng
  - component nào bỏ
  - component nào rewrite

## 8. Tình trạng style system hiện tại

### Hệ visual chính đang dùng

- Tailwind utility class cho phần lớn page mới
- CSS custom properties trong `styles.css`:
  - màu nền
  - text
  - gradient hero
  - surface/border token

### Hệ style cũ vẫn còn

Trong `client/src/styles.css` vẫn tồn tại nhiều class cũ như:

- `app-shell`
- `page-header`
- `card`
- `field-group`
- `primary-button`
- `secondary-button`
- `import-dropzone`

Hiện tại:

- phần lớn page mới không dùng chúng
- `DebtsPage` vẫn dùng `field-group`, `primary-button`, `secondary-button`
- `AdvicePanel` và `StatCard` dùng pattern cũ

### Kết luận

Frontend đang ở trạng thái “hybrid design system”:

- một hệ utility-based mới
- một hệ class-based cũ

Đây là điểm team design nên xử lý sớm nhất, vì nếu không thống nhất thì mọi tinh chỉnh sau này sẽ tiếp tục bị chồng lớp.

## 9. Vấn đề UI/UX lớn nhất cần team design xử lý

### 9.1 Lỗi encoding tiếng Việt

Đây là vấn đề nghiêm trọng nhất về mặt perception.

Biểu hiện:

- text tiếng Việt bị vỡ encoding ở nhiều page
- label, title, subtitle, description đều bị ảnh hưởng

Tác động:

- làm app trông chưa hoàn thiện
- khó đọc
- ảnh hưởng mạnh đến cảm nhận quality

### 9.2 Thiếu hierarchy rõ giữa “summary” và “detail”

Nhiều page đang có:

- hero
- stats
- cards
- bảng
- notes

trên cùng một màn mà chưa có độ ưu tiên thị giác thật sắc.

### 9.3 Quá nhiều gradient và shadow nặng

Visual hiện tại có cá tính, nhưng nếu giữ mật độ gradient/shadow như bây giờ ở mọi section thì:

- page nhanh bị nặng
- giảm cảm giác gọn
- khó phân biệt primary và secondary surfaces

### 9.4 Card hũ đang quá tải thông tin

`JarCard` là component quan trọng nhất nhưng cũng nặng nhất.

Hiện card này đang kiêm:

- KPI card
- health card
- budget card
- reserve card
- CTA card

Nên cần tái cấu trúc.

### 9.5 Mẫu form chưa thống nhất

Hiện tồn tại ít nhất 2 pattern:

- form utility-based trên page mới
- form class-based cũ ở `DebtsPage`

### 9.6 Mẫu table chưa được system hóa hoàn toàn

Các bảng đang tương đối giống nhau, nhưng vẫn là các component tách riêng:

- transaction
- monthly income
- allocation
- debt

Team design có thể đề xuất một “Data Table Pattern” chung cho:

- header
- filter zone
- row actions
- mobile card variant
- empty state

### 9.7 Floating AI widget có thể phá bố cục

Assistant widget luôn nổi toàn cục, trong khi app đã có:

- sticky header
- mobile nav
- nhiều CTA riêng trong page

Design cần xác định lại mức ưu tiên và behavior của widget này.

## 10. Định hướng redesign đề xuất

### P0. Chuẩn hóa design system

- Fix toàn bộ text/encoding
- Chốt typography scale
- Chốt color tokens
- Chốt elevation/shadow scale
- Chốt radius scale
- Chốt button/input/select/textarea styles
- Chốt section/card patterns

### P1. Tái cấu trúc information architecture cho page nặng

Ưu tiên theo thứ tự:

1. `JarsPage`
2. `TransactionsPage`
3. `ActualBalancesPage`
4. `MonthlyPlanPage`

### P2. Chuẩn hóa component library nội bộ

Nên thống nhất các pattern sau:

- `PageHero`
- `StatCard`
- `SectionCard`
- `DataTable`
- `MobileRowCard`
- `FormField`
- `InlineHint`
- `StatusBadge`
- `EmptyState`
- `ActionBar`

### P3. Dọn di sản

- bỏ component không dùng
- bỏ CSS class cũ không còn cần
- chuyển `DebtsPage` sang cùng ngôn ngữ UI với phần còn lại

## 11. Gợi ý cụ thể cho team design

### Với Dashboard

- Giảm số khối summary
- Giữ một hero chính và một dải stat rõ ràng
- Làm recent transaction đỡ “cardy” hơn

### Với Jars

- Thiết kế lại `JarCard` theo cấu trúc 2 tầng:
  - KPI chính
  - insight phụ
- Cân nhắc expandable details

### Với Transactions

- Tách rõ:
  - search/filter layer
  - analytics layer
  - CRUD layer
- Cân nhắc panel riêng cho `JarHistoryInsights`

### Với Monthly Plan

- Chuyển sang flow step-based rõ hơn
- Làm rõ `Income` và `Allocation` là 2 bước liên tiếp

### Với Actual Balances

- Đây nên là redesign priority cao
- Cần giảm độ phức tạp nhận thức
- Có thể đổi từ “many editable cards” sang:
  - table editable
  - hoặc list + detail side panel

### Với Debts

- Chỉ cần đưa về cùng system với phần còn lại
- Không cần phát minh pattern mới

### Với Import

- Giữ đơn giản
- Tăng clarity cho status và destructive actions

## 12. Kết luận ngắn

Frontend hiện tại đã có đủ màn và đủ nghiệp vụ để redesign nghiêm túc.

Điểm mạnh:

- Domain flow khá rõ
- Route map ổn
- Reusable component đã có nền
- Visual direction đã có cá tính

Điểm yếu:

- Text lỗi encoding
- Hybrid design system
- Một số page quá dày
- Một số component đang gánh quá nhiều trách nhiệm
- Còn component/CSS di sản chưa dọn

Nếu team design chỉ ưu tiên một đợt tinh chỉnh ngắn, nên làm theo thứ tự:

1. Fix text + design tokens
2. Chuẩn hóa form/table/card system
3. Redesign `JarCard`
4. Giảm density ở `Transactions`, `Monthly Plan`, `Actual Balances`
5. Dọn component/CSS cũ

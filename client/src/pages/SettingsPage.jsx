const SettingsPage = () => (
  <div className="page-stack">
    <section className="card section-card">
      <p className="card-label">Cài đặt</p>
      <h3>Cấu hình frontend MVP</h3>
      <p className="section-copy">
        Màn hình này giữ chỗ cho các tuỳ chọn frontend trong tương lai như cấu hình
        API, ngôn ngữ hiển thị, chu kỳ tháng và tuỳ chọn dashboard.
      </p>
    </section>

    <section className="card list-card">
      <p className="card-label">Trạng thái hiện tại</p>
      <h3>Những gì đã sẵn sàng</h3>
      <ul className="simple-list">
        <li>Routing cho các màn hình chính</li>
        <li>Khung layout kiểu admin dashboard</li>
        <li>API placeholder cho backend Express</li>
        <li>Vùng dự phòng cho insight AI ở giai đoạn sau</li>
      </ul>
    </section>
  </div>
);

export default SettingsPage;

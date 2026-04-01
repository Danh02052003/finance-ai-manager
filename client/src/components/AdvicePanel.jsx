const AdvicePanel = ({ status }) => (
  <section className="card advice-panel">
    <div className="advice-header">
      <div>
        <p className="card-label">Góc nhìn AI</p>
        <h3>Khung cho tư vấn tài chính</h3>
      </div>
      <span className="status-pill status-pill-muted">{status}</span>
    </div>

    <p className="advice-copy">
      Khu vực này được chuẩn bị sẵn cho các insight tài chính và gợi ý trong giai
      đoạn sau. Hiện tại frontend chỉ hiển thị placeholder và không kết nối nhà
      cung cấp AI.
    </p>
  </section>
);

export default AdvicePanel;

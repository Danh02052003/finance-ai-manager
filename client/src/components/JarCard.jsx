const JarCard = ({ jar }) => (
  <article className="card jar-card">
    <div className="jar-card-header">
      <div>
        <p className="card-label">{jar.jar_key}</p>
        <h3>{jar.display_name_vi}</h3>
      </div>
      <span className={jar.is_active ? 'status-pill' : 'status-pill status-pill-muted'}>
        {jar.is_active ? 'Đang dùng' : 'Tạm ẩn'}
      </span>
    </div>

    <dl className="jar-card-meta">
      <div>
        <dt>Thứ tự</dt>
        <dd>{jar.display_order}</dd>
      </div>
      <div>
        <dt>Tỷ lệ mục tiêu</dt>
        <dd>
          {jar.target_percentage != null ? `${jar.target_percentage}%` : 'Chưa đặt'}
        </dd>
      </div>
    </dl>
  </article>
);

export default JarCard;

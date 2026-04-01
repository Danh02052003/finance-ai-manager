import { useEffect, useState } from 'react';

import { getJars } from '../api/dashboardApi.js';
import JarCard from '../components/JarCard.jsx';

const defaultJars = [
  {
    jar_key: 'essentials',
    display_name_vi: 'Hũ chi tiêu cần thiết',
    display_order: 1,
    target_percentage: null,
    is_active: true
  },
  {
    jar_key: 'long_term_saving',
    display_name_vi: 'Tiết kiệm dài hạn',
    display_order: 2,
    target_percentage: null,
    is_active: true
  },
  {
    jar_key: 'education',
    display_name_vi: 'Quỹ Giáo Dục',
    display_order: 3,
    target_percentage: null,
    is_active: true
  },
  {
    jar_key: 'enjoyment',
    display_name_vi: 'Hưởng thụ',
    display_order: 4,
    target_percentage: null,
    is_active: true
  },
  {
    jar_key: 'financial_freedom',
    display_name_vi: 'Quỹ tự do tài chính',
    display_order: 5,
    target_percentage: null,
    is_active: true
  },
  {
    jar_key: 'charity',
    display_name_vi: 'Quỹ từ thiện',
    display_order: 6,
    target_percentage: null,
    is_active: true
  }
];

const JarsPage = () => {
  const [jars, setJars] = useState(defaultJars);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadJars = async () => {
      try {
        const response = await getJars();
        if (Array.isArray(response.data) && response.data.length > 0) {
          setJars(response.data);
        }
      } catch (requestError) {
        setError('Đang hiển thị cấu hình 6 hũ mặc định từ tài liệu domain.');
      }
    };

    loadJars();
  }, []);

  return (
    <div className="page-stack">
      <section className="card section-card">
        <p className="card-label">Danh mục 6 hũ</p>
        <h3>Các hũ tài chính của hệ thống</h3>
        <p className="section-copy">
          Giao diện này dùng các khoá hũ ổn định theo tài liệu schema để frontend và
          backend có thể phát triển nhất quán.
        </p>
        {error ? <p className="callout callout-warning">{error}</p> : null}
      </section>

      <section className="jar-grid">
        {jars.map((jar) => (
          <JarCard key={jar.jar_key} jar={jar} />
        ))}
      </section>
    </div>
  );
};

export default JarsPage;

import { JarAllocation, JarDebt, MonthlyIncome, Transaction } from '../models/index.js';
import { getDemoUser } from './demoSeedService.js';

const getAiServiceBaseUrl = () => process.env.AI_SERVICE_BASE_URL || 'http://localhost:8000';

const WEBSITE_KNOWLEDGE = {
  product_name: '6 Hũ Tài Chính',
  product_summary:
    'Web app quản lý tài chính cá nhân theo mô hình 6 hũ, có dashboard, quản lý hũ, giao dịch, kế hoạch tháng, nợ quỹ, import Excel và trợ lý AI.',
  key_modules: [
    {
      path: '/dashboard',
      title: 'Sức khỏe tài chính hôm nay',
      purpose: 'Xem tổng quan thu nhập, phân bổ, giao dịch gần đây, nợ mở và snapshot từng hũ.'
    },
    {
      path: '/jars',
      title: '6 hũ của bạn',
      purpose: 'Xem từng hũ theo tháng, số đã phân bổ, số đã chi, số còn lại, gợi ý chi tiêu mỗi ngày.'
    },
    {
      path: '/transactions',
      title: 'Nhập nhanh và dọn giao dịch',
      purpose: 'Thêm, sửa, xóa, lọc, tìm kiếm và chọn nhiều giao dịch cùng lúc.'
    },
    {
      path: '/monthly-plan',
      title: 'Lập kế hoạch tháng',
      purpose: 'Nhập thu nhập tháng và phân bổ theo 6 hũ chuẩn hoặc nạp thẳng vào một hũ.'
    },
    {
      path: '/debts',
      title: 'Theo dõi nợ và quỹ',
      purpose: 'Theo dõi các khoản mượn tạm giữa các hũ và trạng thái hoàn trả.'
    },
    {
      path: '/import',
      title: 'Nhập dữ liệu từ Excel',
      purpose: 'Import workbook Excel, xóa data cũ và phân loại lại giao dịch bằng AI.'
    }
  ],
  import_rules: {
    monthly_tabs:
      'Các tab Tháng 2, Tháng 3, Tháng 4... đại diện cho dữ liệu chi tiêu theo tháng. Mỗi bảng con trong tab tương ứng với một hũ.',
    jar_titles:
      'Tên ở đầu mỗi bảng là tên hũ, ví dụ Quỹ cần thiết tương ứng với essentials, dùng để gắn jar_key.',
    row_meaning:
      'Cột Số ngày đại diện cho ngày trong tháng đó. Cột Dùng cho có thể chứa nhiều mục nối bằng dấu +, cần tách thành nhiều giao dịch.',
    amount_meaning:
      'Cột Số tiền có thể là chuỗi như 40 + 20 + 3, tương ứng từng mục trong Dùng cho, đơn vị là nghìn đồng.',
    classification:
      'Phân loại giao dịch cần dựa chủ yếu vào mô tả sau khi đã tách nhỏ từng mục.'
  },
  jar_model: [
    'essentials',
    'long_term_saving',
    'education',
    'enjoyment',
    'financial_freedom',
    'charity'
  ]
};

const buildAssistantContext = async () => {
  const user = await getDemoUser();

  if (!user) {
    return {
      user: null,
      latest_month: null,
      stats: {}
    };
  }

  const latestIncome = await MonthlyIncome.findOne({ user_id: user._id }).sort({ month: -1 }).lean();
  const latestMonth = latestIncome?.month || null;
  const [recentTransactions, allocations, openDebts] = await Promise.all([
    Transaction.find({ user_id: user._id })
      .sort({ transaction_date: -1, created_at: -1 })
      .limit(12)
      .lean(),
    latestMonth
      ? JarAllocation.find({ user_id: user._id, month: latestMonth }).sort({ jar_key: 1 }).lean()
      : Promise.resolve([]),
    JarDebt.find({ user_id: user._id, status: 'open' }).sort({ debt_date: -1 }).limit(10).lean()
  ]);

  return {
    website_knowledge: WEBSITE_KNOWLEDGE,
    user: {
      display_name: user.display_name,
      email: user.email,
      base_currency: user.base_currency
    },
    latest_month: latestMonth,
    latest_income: latestIncome
      ? {
          month: latestIncome.month,
          total_amount: latestIncome.total_amount
        }
      : null,
    latest_allocations: allocations.map((item) => ({
      jar_key: item.jar_key,
      allocated_amount: item.allocated_amount,
      allocation_percentage: item.allocation_percentage
    })),
    recent_transactions: recentTransactions.map((item) => ({
      transaction_date: item.transaction_date,
      description: item.description,
      amount: item.amount,
      jar_key: item.jar_key,
      category: item.category
    })),
    open_debts: openDebts.map((item) => ({
      month: item.month,
      amount: item.amount,
      from_jar_key: item.from_jar_key,
      to_jar_key: item.to_jar_key,
      status: item.status
    }))
  };
};

export const createAssistantReply = async ({ message = '', page_path = '/', page_title = '' } = {}) => {
  const appContext = await buildAssistantContext();
  const response = await fetch(`${getAiServiceBaseUrl()}/assistant-ai/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      message,
      page_path,
      page_title,
      app_context: appContext
    })
  });

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.detail || payload.message || `Assistant AI failed: ${response.status}`);
  }

  return payload;
};

import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { JarActualBalance, JarAllocation, JarDebt, MonthlyIncome, Transaction } from '../models/index.js';

const getAiServiceBaseUrl = () => process.env.AI_SERVICE_BASE_URL || 'http://localhost:8000';
const __dirname = dirname(fileURLToPath(import.meta.url));
const usageGuidePath = resolve(__dirname, '../../../docs/huong-dan-su-dung.md');

let usageGuideCache = '';

const WEBSITE_KNOWLEDGE = {
  product_name: '6 Hũ Tài Chính',
  product_summary:
    'Web app quản lý tài chính cá nhân theo mô hình 6 hũ, có dashboard, quản lý hũ, giao dịch, kế hoạch tháng, số dư thực theo tháng, nợ quỹ, import Excel và trợ lý AI.',
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
      path: '/actual-balances',
      title: 'Ví thực tế theo tháng',
      purpose:
        'Lưu snapshot số dư thực của từng hũ theo từng tháng để không cộng nhầm tiền dư cũ vào ngân sách tháng mới.'
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
  ],
  assistant_capabilities: [
    'giải thích cách dùng từng màn hình',
    'trả lời dựa trên dữ liệu hiện có của tài khoản đang đăng nhập',
    'nhắc rõ khi dữ liệu thiếu hoặc chưa có',
    'tư vấn tài chính cơ bản theo mô hình 6 hũ',
    'phân biệt ngân sách tháng đang quản lý và số dư thực giữ riêng',
    'giải thích logic sinh lời MoMo, lãi gộp, thuế 5% và lãi ròng'
  ],
  page_targets: [
    {
      path: '/dashboard',
      targets: [
        {
          id: 'dashboard-overview',
          label: 'Tổng quan đầu trang',
          purpose: 'Xem thu nhập gần nhất, chi gần đây, chênh lệch và tiến độ kế hoạch.'
        },
        {
          id: 'dashboard-stats',
          label: 'Các thẻ thống kê',
          purpose: 'Xem 4 chỉ số nhanh như thu nhập, đã phân bổ, chi gần đây và nợ.'
        },
        {
          id: 'dashboard-jars',
          label: 'Snapshot từng hũ',
          purpose: 'Xem nhanh tình trạng 6 hũ ở tháng gần nhất.'
        },
        {
          id: 'dashboard-actual-reserve',
          label: 'Số dư thực giữ riêng',
          purpose: 'Xem snapshot tiền giữ riêng từ tháng trước.'
        },
        {
          id: 'dashboard-recent-transactions',
          label: 'Giao dịch gần đây',
          purpose: 'Xem các giao dịch mới phát sinh gần nhất.'
        },
        {
          id: 'dashboard-monthly-focus',
          label: 'Điểm cần chú ý',
          purpose: 'Xem người dùng hiện tại, nợ mở và tín hiệu hệ thống.'
        }
      ]
    },
    {
      path: '/jars',
      targets: [
        {
          id: 'jars-overview',
          label: 'Tổng quan 6 hũ',
          purpose: 'Chọn tháng và xem overview của các hũ.'
        },
        {
          id: 'jars-summary',
          label: 'Tóm tắt tháng',
          purpose: 'Xem thu nhập tháng, phân bổ tháng, chi tháng và tiền giữ riêng.'
        },
        {
          id: 'jars-separation-note',
          label: 'Lưu ý tách tiền dư',
          purpose: 'Đọc giải thích vì sao tiền giữ riêng không cộng vào ngân sách tháng.'
        },
        {
          id: 'jars-cards',
          label: 'Danh sách thẻ hũ',
          purpose: 'Xem chi tiết từng hũ và bấm Chi từ hũ hoặc Xem lịch sử.'
        }
      ]
    },
    {
      path: '/transactions',
      targets: [
        {
          id: 'transactions-overview',
          label: 'Tổng quan giao dịch',
          purpose: 'Xem hướng dẫn nhanh và mở nhanh popup tạo giao dịch.'
        },
        {
          id: 'transactions-filters',
          label: 'Bộ lọc và tìm kiếm',
          purpose: 'Lọc theo tháng, hũ, danh mục hoặc tìm giao dịch.'
        },
        {
          id: 'transactions-editor',
          label: 'Popup tạo hoặc sửa giao dịch',
          purpose: 'Nhập giao dịch mới hoặc chỉnh sửa giao dịch đang chọn.'
        },
        {
          id: 'transactions-table',
          label: 'Bảng giao dịch',
          purpose: 'Xem danh sách giao dịch, chọn nhiều dòng, sửa hoặc xóa.'
        }
      ]
    },
    {
      path: '/monthly-plan',
      targets: [
        {
          id: 'monthly-plan-overview',
          label: 'Tổng quan kế hoạch tháng',
          purpose: 'Xem tháng focus, thu nhập, tiến độ và phần còn lại chưa phân bổ.'
        },
        {
          id: 'monthly-plan-income-form',
          label: 'Form thu nhập tháng',
          purpose: 'Tạo hoặc sửa thu nhập tháng.'
        },
        {
          id: 'monthly-plan-allocation-board',
          label: 'Allocation board',
          purpose: 'Xem và chỉnh phân bổ từng hũ.'
        },
        {
          id: 'monthly-plan-focus',
          label: 'Focus month',
          purpose: 'Xem tóm tắt của tháng đang focus.'
        }
      ]
    },
    {
      path: '/actual-balances',
      targets: [
        {
          id: 'actual-balances-overview',
          label: 'Tổng quan số dư thực',
          purpose: 'Chọn tháng snapshot và hiểu ý nghĩa của số dư thực.'
        },
        {
          id: 'actual-balances-rule',
          label: 'Rule nhập tiền',
          purpose: 'Xem cách hệ thống hiểu số tiền có dấu và không có dấu.'
        },
        {
          id: 'actual-balances-grid',
          label: 'Lưới nhập số dư thực',
          purpose: 'Nhập và lưu snapshot từng hũ.'
        }
      ]
    },
    {
      path: '/import',
      targets: [
        {
          id: 'import-overview',
          label: 'Tổng quan import',
          purpose: 'Xem import dùng để làm gì và hỗ trợ sheet nào.'
        },
        {
          id: 'import-dropzone',
          label: 'Vùng chọn file',
          purpose: 'Kéo thả hoặc chọn file Excel.'
        },
        {
          id: 'import-actions',
          label: 'Thao tác import',
          purpose: 'Bắt đầu import, phân loại lại bằng AI hoặc xóa dữ liệu cũ.'
        },
        {
          id: 'import-summary',
          label: 'Kết quả import',
          purpose: 'Xem bản ghi đã chèn, warnings và errors.'
        }
      ]
    },
    {
      path: '/debts',
      targets: [
        {
          id: 'debts-overview',
          label: 'Tổng quan nợ giữa các hũ',
          purpose: 'Hiểu màn nợ dùng để làm gì.'
        },
        {
          id: 'debts-form',
          label: 'Form nhập khoản nợ',
          purpose: 'Tạo hoặc sửa khoản nợ giữa các hũ.'
        },
        {
          id: 'debts-table',
          label: 'Bảng nợ',
          purpose: 'Xem danh sách nợ hiện có và thao tác sửa xóa.'
        }
      ]
    }
  ]
};

const loadUsageGuide = async () => {
  if (usageGuideCache) {
    return usageGuideCache;
  }

  try {
    usageGuideCache = await readFile(usageGuidePath, 'utf8');
  } catch (error) {
    usageGuideCache = '';
  }

  return usageGuideCache;
};

const buildAssistantContext = async (user) => {
  const usageGuide = await loadUsageGuide();

  if (!user) {
    return {
      website_knowledge: WEBSITE_KNOWLEDGE,
      usage_guide_markdown: usageGuide,
      user: null,
      latest_month: null,
      stats: {}
    };
  }

  const latestIncome = await MonthlyIncome.findOne({ user_id: user._id }).sort({ month: -1 }).lean();
  const latestMonth = latestIncome?.month || null;
  const [recentTransactions, allocations, actualBalances, openDebts] = await Promise.all([
    Transaction.find({ user_id: user._id })
      .sort({ transaction_date: -1, created_at: -1 })
      .limit(12)
      .lean(),
    latestMonth
      ? JarAllocation.find({ user_id: user._id, month: latestMonth }).sort({ jar_key: 1 }).lean()
      : Promise.resolve([]),
    JarActualBalance.find({ user_id: user._id })
      .sort({ month: -1, jar_key: 1, updated_at: -1 })
      .limit(24)
      .lean(),
    JarDebt.find({ user_id: user._id, status: 'open' }).sort({ debt_date: -1 }).limit(10).lean()
  ]);

  return {
    website_knowledge: WEBSITE_KNOWLEDGE,
    usage_guide_markdown: usageGuide,
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
    actual_balance_snapshots: actualBalances.map((item) => ({
      month: item.month,
      jar_key: item.jar_key,
      actual_balance_amount: item.actual_balance_amount,
      note: item.note,
      yield_enabled: item.yield_enabled,
      yield_activation_date: item.yield_activation_date,
      yield_start_date: item.yield_start_date,
      yield_rate_annual: item.yield_rate_annual,
      gross_yield_amount: item.gross_yield_amount,
      withholding_tax_amount: item.withholding_tax_amount,
      net_yield_amount: item.net_yield_amount,
      last_yield_processed_at: item.last_yield_processed_at
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

export const createAssistantReply = async ({
  user,
  message = '',
  page_path = '/',
  page_title = ''
} = {}) => {
  const appContext = await buildAssistantContext(user);
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

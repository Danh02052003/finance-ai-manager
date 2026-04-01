import { Jar, User } from '../models/index.js';

const DEMO_USER_EMAIL = 'demo@finance-ai-manager.local';

const DEMO_USER = {
  display_name: 'Demo User',
  email: DEMO_USER_EMAIL,
  base_currency: 'VND',
  locale: 'vi-VN',
  timezone: 'Asia/Ho_Chi_Minh'
};

const DEMO_JARS = [
  {
    jar_key: 'essentials',
    display_name_vi: 'Hũ chi tiêu cần thiết',
    display_order: 1,
    target_percentage: 55
  },
  {
    jar_key: 'long_term_saving',
    display_name_vi: 'Tiết kiệm dài hạn',
    display_order: 2,
    target_percentage: 10
  },
  {
    jar_key: 'education',
    display_name_vi: 'Quỹ Giáo Dục',
    display_order: 3,
    target_percentage: 10
  },
  {
    jar_key: 'enjoyment',
    display_name_vi: 'Hưởng thụ',
    display_order: 4,
    target_percentage: 10
  },
  {
    jar_key: 'financial_freedom',
    display_name_vi: 'Quỹ tự do tài chính',
    display_order: 5,
    target_percentage: 10
  },
  {
    jar_key: 'charity',
    display_name_vi: 'Quỹ từ thiện',
    display_order: 6,
    target_percentage: 5
  }
];

export const getDemoUser = async () =>
  User.findOne({ email: DEMO_USER_EMAIL });

export const ensureDemoData = async () => {
  const user = await User.findOneAndUpdate(
    { email: DEMO_USER_EMAIL },
    { $set: DEMO_USER },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true
    }
  );

  await Jar.bulkWrite(
    DEMO_JARS.map((jar) => ({
      updateOne: {
        filter: {
          user_id: user._id,
          jar_key: jar.jar_key
        },
        update: {
          $set: {
            user_id: user._id,
            ...jar,
            is_active: true
          }
        },
        upsert: true
      }
    }))
  );

  return user;
};

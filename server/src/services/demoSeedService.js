import { Jar, User } from '../models/index.js';

export const DEMO_USER_EMAIL = 'demo@finance-ai-manager.local';

const DEMO_USER = {
  display_name: 'Demo User',
  email: DEMO_USER_EMAIL,
  role: 'super_admin',
  base_currency: 'VND',
  locale: 'vi-VN',
  timezone: 'Asia/Ho_Chi_Minh',
  is_demo: true
};

export const DEFAULT_JARS = [
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

export const getLegacyDemoUser = async () => User.findOne({ email: DEMO_USER_EMAIL });

export const ensureUserJars = async (userId) => {
  await Jar.bulkWrite(
    DEFAULT_JARS.map((jar) => ({
      updateOne: {
        filter: {
          user_id: userId,
          jar_key: jar.jar_key
        },
        update: {
          $set: {
            user_id: userId,
            ...jar,
            is_active: true
          }
        },
        upsert: true
      }
    }))
  );
};

export const seedDemoUser = async () => {
  const user = await User.findOneAndUpdate(
    { email: DEMO_USER_EMAIL },
    { $set: DEMO_USER },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true
    }
  );

  await ensureUserJars(user._id);

  return user;
};

export const migrateLegacyDemoUser = async ({ displayName, email, passwordHash, role = 'super_admin' }) => {
  const legacyDemoUser = await getLegacyDemoUser();

  if (!legacyDemoUser) {
    return null;
  }

  legacyDemoUser.display_name = displayName;
  legacyDemoUser.email = email;
  legacyDemoUser.password_hash = passwordHash;
  legacyDemoUser.role = role;
  legacyDemoUser.is_demo = false;
  legacyDemoUser.demo_migrated_at = new Date();
  await legacyDemoUser.save();
  await ensureUserJars(legacyDemoUser._id);

  return legacyDemoUser;
};

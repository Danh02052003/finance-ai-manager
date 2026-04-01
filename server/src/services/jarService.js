import { Jar } from '../models/index.js';
import { getDemoUser } from './demoSeedService.js';

export const listJars = async () => {
  const user = await getDemoUser();

  if (!user) {
    return {
      message: 'Demo user not found.',
      data: []
    };
  }

  const jars = await Jar.find({ user_id: user._id })
    .sort({ display_order: 1 })
    .lean();

  return {
    message: 'Jars loaded successfully.',
    data: jars
  };
};

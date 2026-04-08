import { Jar } from '../models/index.js';

export const listJars = async (userId) => {
  const jars = await Jar.find({ user_id: userId })
    .sort({ display_order: 1 })
    .lean();

  return {
    message: 'Jars loaded successfully.',
    data: jars
  };
};

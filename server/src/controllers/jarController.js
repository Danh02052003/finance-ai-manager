import { listJars } from '../services/jarService.js';

export const getJars = async (req, res, next) => {
  try {
    const result = await listJars();
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

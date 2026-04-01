import { getDashboardSummary } from '../services/dashboardService.js';

export const getDashboard = async (req, res, next) => {
  try {
    const result = await getDashboardSummary();
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

import { getHealthStatus } from '../services/healthService.js';

export const getHealth = (req, res) => {
  res.status(200).json(getHealthStatus());
};

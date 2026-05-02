import {
  createJarActualBalance,
  deleteJarActualBalance,
  listJarActualBalances,
  updateJarActualBalance
} from '../services/jarActualBalanceService.js';

export const getJarActualBalances = async (req, res, next) => {
  try {
    const result = await listJarActualBalances(req.user._id);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const postJarActualBalance = async (req, res, next) => {
  try {
    const result = await createJarActualBalance(req.user._id, req.body);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

export const putJarActualBalance = async (req, res, next) => {
  try {
    const result = await updateJarActualBalance(req.user._id, req.params.id, req.body);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const removeJarActualBalance = async (req, res, next) => {
  try {
    const result = await deleteJarActualBalance(req.user._id, req.params.id);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};


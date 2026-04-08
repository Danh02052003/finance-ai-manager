import {
  createMonthlyIncome,
  deleteMonthlyIncome,
  listMonthlyIncomes,
  updateMonthlyIncome
} from '../services/monthlyIncomeService.js';

export const getMonthlyIncomes = async (req, res, next) => {
  try {
    const result = await listMonthlyIncomes(req.user._id);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const postMonthlyIncome = async (req, res, next) => {
  try {
    const result = await createMonthlyIncome(req.user._id, req.body);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

export const putMonthlyIncome = async (req, res, next) => {
  try {
    const result = await updateMonthlyIncome(req.user._id, req.params.id, req.body);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const removeMonthlyIncome = async (req, res, next) => {
  try {
    const result = await deleteMonthlyIncome(req.user._id, req.params.id);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

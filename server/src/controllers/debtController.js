import {
  createDebt,
  deleteDebt,
  listDebts,
  updateDebt
} from '../services/debtService.js';

export const getDebts = async (req, res, next) => {
  try {
    const result = await listDebts();
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const postDebt = async (req, res, next) => {
  try {
    const result = await createDebt(req.body);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

export const putDebt = async (req, res, next) => {
  try {
    const result = await updateDebt(req.params.id, req.body);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const removeDebt = async (req, res, next) => {
  try {
    const result = await deleteDebt(req.params.id);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

import {
  createExternalDebt,
  deleteExternalDebt,
  listExternalDebts,
  updateExternalDebt
} from '../services/externalDebtService.js';

export const getExternalDebts = async (req, res, next) => {
  try {
    const result = await listExternalDebts(req.user._id);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const postExternalDebt = async (req, res, next) => {
  try {
    const result = await createExternalDebt(req.user._id, req.body);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

export const putExternalDebt = async (req, res, next) => {
  try {
    const result = await updateExternalDebt(req.user._id, req.params.id, req.body);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const removeExternalDebt = async (req, res, next) => {
  try {
    const result = await deleteExternalDebt(req.user._id, req.params.id);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

import {
  createTransaction,
  deleteTransaction,
  listTransactions,
  updateTransaction
} from '../services/transactionService.js';

export const getTransactions = async (req, res, next) => {
  try {
    const result = await listTransactions(req.user._id);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const postTransaction = async (req, res, next) => {
  try {
    const result = await createTransaction(req.user._id, req.body);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

export const putTransaction = async (req, res, next) => {
  try {
    const result = await updateTransaction(req.user._id, req.params.id, req.body);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const removeTransaction = async (req, res, next) => {
  try {
    const result = await deleteTransaction(req.user._id, req.params.id);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

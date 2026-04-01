import {
  createTransaction,
  deleteTransaction,
  listTransactions,
  updateTransaction
} from '../services/transactionService.js';

export const getTransactions = async (req, res, next) => {
  try {
    const result = await listTransactions();
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const postTransaction = async (req, res, next) => {
  try {
    const result = await createTransaction(req.body);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

export const putTransaction = async (req, res, next) => {
  try {
    const result = await updateTransaction(req.params.id, req.body);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const removeTransaction = async (req, res, next) => {
  try {
    const result = await deleteTransaction(req.params.id);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

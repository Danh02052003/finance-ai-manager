import {
  createTransaction,
  deleteTransaction,
  listTransactions,
  updateTransaction
} from '../services/transactionService.js';
import { reclassifyImportedTransactions } from '../services/importExcelService.js';

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
    // Auto-classify in background if needed
    if (!req.body.category || req.body.category === 'uncategorized') {
      reclassifyImportedTransactions(req.user._id).catch((e) => console.error('Auto-classify error:', e));
    }
  } catch (error) {
    next(error);
  }
};

export const putTransaction = async (req, res, next) => {
  try {
    const result = await updateTransaction(req.user._id, req.params.id, req.body);
    res.status(200).json(result);
    // Auto-classify in background if needed
    if (!req.body.category || req.body.category === 'uncategorized') {
      reclassifyImportedTransactions(req.user._id).catch((e) => console.error('Auto-classify error:', e));
    }
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

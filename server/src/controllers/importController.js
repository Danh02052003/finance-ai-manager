import {
  importExcelWorkbook,
  reclassifyImportedTransactions,
  resetImportedData
} from '../services/importExcelService.js';

export const importExcel = async (req, res, next) => {
  try {
    const result = await importExcelWorkbook(req.user._id, req.file);
    res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    next(error);
  }
};

export const clearImportedData = async (req, res, next) => {
  try {
    const result = await resetImportedData(req.user._id);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const reclassifyTransactions = async (req, res, next) => {
  try {
    const result = await reclassifyImportedTransactions(req.user._id);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

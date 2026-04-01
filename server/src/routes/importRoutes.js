import { Router } from 'express';

import {
  clearImportedData,
  importExcel,
  reclassifyTransactions
} from '../controllers/importController.js';
import { uploadExcelFile } from '../middleware/uploadMiddleware.js';

const router = Router();

router.post('/excel', uploadExcelFile, importExcel);
router.post('/reclassify-transactions', reclassifyTransactions);
router.delete('/excel', clearImportedData);

export default router;

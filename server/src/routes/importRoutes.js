import { Router } from 'express';

import {
  clearImportedData,
  importExcel
} from '../controllers/importController.js';
import { uploadExcelFile } from '../middleware/uploadMiddleware.js';

const router = Router();

router.post('/excel', uploadExcelFile, importExcel);
router.delete('/excel', clearImportedData);

export default router;

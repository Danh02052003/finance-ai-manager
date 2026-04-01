import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import multer from 'multer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const tempUploadDirectory = path.resolve(__dirname, '../../uploads/tmp');

fs.mkdirSync(tempUploadDirectory, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, tempUploadDirectory);
  },
  filename: (req, file, callback) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    callback(null, `${Date.now()}-${safeName}`);
  }
});

const fileFilter = (req, file, callback) => {
  const isExcelFile = /\.(xlsx|xls)$/i.test(file.originalname);

  if (!isExcelFile) {
    callback(new Error('Only .xlsx and .xls files are supported.'));
    return;
  }

  callback(null, true);
};

export const uploadExcelFile = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024
  },
  fileFilter
}).single('file');

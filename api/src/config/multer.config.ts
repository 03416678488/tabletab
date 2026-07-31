import * as path from 'path';
import { diskStorage } from 'multer';
import { existsSync, mkdirSync } from 'fs';
import {
  FILE_BASE_PATH,
  MAXIMUM_ALLOWED_FILE_SIZ,
} from '@modules/file-manager/constants/file-manager.constants';

export const MulterConfig = {
  storage: diskStorage({
    destination: (req, file, cb) => setFileDestination(req, file, cb),
    filename: (req, file, cb) => setFileName(file, cb),
  }),
  limits: {
    fileSize: MAXIMUM_ALLOWED_FILE_SIZ.MAXIMUM,
  },
};

const setFileName = (file, cb) => {
  const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
  const extension = path.extname(file.originalname);
  return cb(null, `${uniqueSuffix}${extension}`);
};

const setFileDestination = (req, file, cb): void => {
  const fileExt = path.extname(file.originalname).toLowerCase().replace('.', '');

  const basePath = FILE_BASE_PATH;
  const userPath = req.user?.id ? `${basePath}/${req.user.id}/${fileExt}/` : `${basePath}/`;

  if (!existsSync(userPath)) {
    mkdirSync(userPath, { recursive: true });
  }

  return cb(null, userPath);
};

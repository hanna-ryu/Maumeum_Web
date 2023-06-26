import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import multerS3 from 'multer-s3';
import path from 'path';
import dotenv from 'dotenv';
import { S3Client } from '@aws-sdk/client-s3';

dotenv.config();

const s3 = new S3Client({
  region: process.env.AWS_REGION, // AWS 리전
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'undefined',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'undefined',
  },
});

// 파일 타입 및 파일 크기 제한 설정
const upload = multer({
  storage: multerS3({
    s3: s3 as any, // 형 변환을 통해 컴파일러 에러 해결
    bucket: process.env.AWS_S3_BUCKET_NAME || 'undefined', // S3 버킷 이름
    acl: 'public-read', // 업로드된 파일의 ACL(Access Control List)
    metadata: function (req, file, cb) {
      cb(null, { fieldName: file.fieldname });
    },
    key: function (req, file, cb) {
      cb(null, Date.now().toString() + '-' + file.originalname);
    },
  }),
  fileFilter: function (req, file, cb) {
    const allowedFileTypes = ['.jpg', '.jpeg', '.png'];
    const ext = path.extname(file.originalname).toLowerCase();
    const maxSize = 10 * 1024 * 1024;

    if (allowedFileTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('올바른 파일 형식 및 크기를 선택하세요.'));
    }
  },
});

const imageUploader = (req: Request, res: Response, next: NextFunction) => {
  upload.single('image')(req, res, (err) => {
    if (err) {
      console.error(err);
      return res.status(400).json({ error: err.message });
    } else {
      next();
    }
  });
};

const imagesUploader = (req: Request, res: Response, next: NextFunction) => {
  upload.array('images')(req, res, (err) => {
    if (err) {
      console.error(err);
      return res.status(400).json({ error: err.message });
    } else {
      next();
    }
  });
};

export { imageUploader, imagesUploader };

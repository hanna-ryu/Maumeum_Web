import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import multerS3 from 'multer-s3-transform';
import path from 'path';
import dotenv from 'dotenv';
import { S3Client } from '@aws-sdk/client-s3';
import sharp from 'sharp';

dotenv.config();

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'undefined',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'undefined',
  },
});

const transformImage = sharp()
  .resize({ width: 600, withoutEnlargement: true })
  .toFormat('webp');

const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.AWS_S3_BUCKET_NAME || 'undefined',
    acl: 'public-read',
    key: function (req, file, cb) {
      cb(null, Date.now().toString() + '-' + file.originalname);
    },
    transforms: [
      {
        id: 'resizeAndConvert',
        transform: function (req, file, cb) {
          cb(null, transformImage);
        },
      },
    ],
  }),
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter: function (req, file, cb) {
    const allowedFileTypes = ['.jpg', '.jpeg', '.png'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedFileTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('올바른 파일 형식 및 크기를 선택하세요.'));
    }
  },
});

const imageUploader = (req, res, next) => {
  upload.single('image')(req, res, (err) => {
    if (err) {
      console.error(err);
      return res.status(400).json({ error: err.message });
    } else {
      next();
    }
  });
};

const imagesUploader = (req, res, next) => {
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

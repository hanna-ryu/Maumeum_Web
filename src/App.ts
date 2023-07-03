import express, { NextFunction, Request, Response } from 'express';
import path from 'path';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import {
  userRouter,
  volunteerRouter,
  volunteerApplicationRouter,
  communityRouter,
  reviewRouter,
  teamAuthRouter,
} from './routers/index.js';
import { volunteerCommentRouter } from './routers/volunteerCommentRouter.js';
import { postCommentRouter } from './routers/postCommentRouter.js';
import { logger } from './utils/logger.js';
import cookieParser from 'cookie-parser';

dotenv.config();

const app = express();
const __dirname = path.resolve();
app.use('/', express.static(path.join(__dirname, 'public')));
app.use(
  cors({
    origin: process.env.FRONT_SERVER,
    credentials: true,
  }),
); //cors에러 방지
app.use(cookieParser());
app.use(express.json()); // 바디파서
app.use(express.urlencoded({ extended: true }));

// DB연결
const DB_URL =
  process.env.MONGODB_URL ||
  'MongoDB 서버 주소가 설정되지 않았거나, env 파일도 필요합니다.\n';

let dbName = 'maum';
let serverType = 'DEVELOPMENT';

if (process.env.NODE_ENV === 'production') {
  dbName = 'maum-production';
  serverType = 'PRODUCTION';
}

mongoose.connect(DB_URL, { dbName });
const db = mongoose.connection;

db.on('connected', () =>
  logger.info(`정상적으로 MongoDB ${serverType} 서버에 연결되었습니다.`),
);
db.on('error', (error) =>
  logger.info('\nMongoDB 연결에 실패하였습니다...\n' + error),
);

app.use('/api', userRouter);
app.use('/api', volunteerRouter);
app.use('/api', volunteerApplicationRouter);
app.use('/api', volunteerCommentRouter);
app.use('/api', communityRouter);
app.use('/api', postCommentRouter);
app.use('/api', reviewRouter);
app.use('/api', teamAuthRouter);

app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  // @ts-ignore
  res.statusCode = error.httpCode ?? 500;
  logger.error({
    message: error.message,
    name: error.name,
    stack: error.stack,
  });
  res.json({
    name: error.name,
    httpMessage: error.message,
    data: null,
  });
});

export { app };

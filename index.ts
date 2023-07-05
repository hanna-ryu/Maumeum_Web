import express, { Express, Request, Response } from 'express';
import { app } from './src/App.js';
import dotenv from 'dotenv';
import path from 'path';
import {
  changeParticipateStatus,
  changeStatusName,
} from './src/utils/Scheduler.js';
import { logger } from './src/utils/logger.js';

dotenv.config();

const port = process.env.PORT;

//매일 자정 applyVolunteer의 document들 중, isParticipate와 endDate를 체크하여 상태값을 true로 바꿔주는 모듈
changeStatusName();
changeParticipateStatus();

app.get('/', (req: Request, res: Response) => {
  res.send('마음이음 API 서버입니다.');
});

app.listen(port, () => {
  logger.info(`[server]:서버가 실행되고 있습니다.`);
});

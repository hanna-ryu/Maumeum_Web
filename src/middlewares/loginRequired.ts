import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';
import { logger } from '../utils/logger.js';
import { makeInstance } from '../utils/makeInstance.js';
import { UserService } from '../services/userService.js';
import { makeAccessToken, makeRefreshToken } from '../utils/jwtTokenMaker.js';

interface JwtPayload {
  user_id: ObjectId;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      id: ObjectId;
      role: string;
    }
  }
}

async function loginRequired(req: Request, res: Response, next: NextFunction) {
  const userToken = req.cookies.accessToken;

  if (!userToken || userToken === null) {
    logger.info('Authorization 토큰 없음');
    res.status(403).json({
      result: 'forbidden-approach',
      reason: '로그인한 유저만 사용할 수 있는 서비스입니다.',
    });
    return;
  }

  let user_id: ObjectId | null = null;

  try {
    const secretKey = process.env.JWT_SECRET_KEY || 'secret-key';
    const jwtDecoded = jwt.verify(userToken, secretKey) as JwtPayload;

    const { user_id: decodedUserId, role } = jwtDecoded;
    logger.debug('user_id: ' + decodedUserId + ' role: ' + role);
    user_id = decodedUserId;
    req.id = user_id;
    req.role = role;
    logger.debug('디코딩 성공');
    next();
  } catch (error: any) {
    console.error(error);
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        error: 'TokenExpiredError',
        message: '토큰이 만료되었습니다.',
      });
    } else {
      next();
    }
  }
}
export { loginRequired };

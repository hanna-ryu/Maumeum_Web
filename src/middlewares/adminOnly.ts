import { NextFunction, Request, Response } from 'express';
import { logger } from '../utils/logger.js';
import jwt from 'jsonwebtoken';
import { AppError } from '../misc/AppError.js';
import { ObjectId } from 'mongodb';
import { STATUS_CODE } from '../utils/statusCode.js';
import { buildResponse } from '../utils/builderResponse.js';
import { commonErrors } from '../misc/commonErrors.js';

interface JwtPayload {
  user_id: ObjectId;
  role: string;
}

function adminOnly(req: Request, res: Response, next: NextFunction) {
  const userToken = req.cookies.accessToken;
  console.log('🚀 ~ file: adminOnly.ts:17 ~ adminOnly ~ userToken:', userToken);
  if (!userToken || userToken === null) {
    logger.info('Authorization 토큰 없음');
    res
      .status(STATUS_CODE.FORBIDDEN)
      .json(
        buildResponse(
          'forbidden-approach',
          '로그인한 유저만 사용할 수 있는 서비스입니다.',
        ),
      );

    return;
  }

  try {
    const secretKey = process.env.JWT_SECRET_KEY || 'secret-key';

    const jwtDecoded = jwt.verify(userToken, secretKey) as JwtPayload;

    const { user_id, role } = jwtDecoded;

    logger.debug('user_id: ' + user_id + ' role: ' + role);

    if (role !== 'admin') {
      throw new AppError(
        '관리자가 아닙니다.',
        STATUS_CODE.BAD_REQUEST,
        'BAD_REQUEST : 관리자가 아닙니다.',
      );
    }

    req.id = user_id;
    req.role = role;

    next();
  } catch (error) {
    res
      .status(STATUS_CODE.FORBIDDEN)
      .json(
        buildResponse(
          commonErrors.authorizationError,
          '관리자만 사용할 수 있는 서비스입니다.',
        ),
      );
  }
}

export { adminOnly };

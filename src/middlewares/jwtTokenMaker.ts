import jwt from 'jsonwebtoken';
import 'dotenv/config';
import { CONSTANTS } from '../utils/Constants.js';

type Token = {
  token: string;
  uuid: string;
  role: string;
};

function makeAccessToken(user: any) {
  const secretKey = process.env.JWT_SECRET_KEY || 'secret-key';
  const token = jwt.sign({ user_id: user._id, role: user.role }, secretKey, {
    expiresIn: CONSTANTS.JWT_ACCESS_TOKEN_EXPIRES,
  });

  const userInfoWithUserToken: Token = {
    token,
    uuid: user.uuid,
    role: user.role,
  };

  return userInfoWithUserToken;
}

function makeRefreshToken(user: any) {
  const secretKey =
    process.env.REFRESH_JWT_SECRET_KEY || 'THIS_IS_MY_REFRESH_TOKEN_KEY';
  const token = jwt.sign({ user_id: user._id }, secretKey, {
    expiresIn: CONSTANTS.JWT_REFRESH_TOKEN_EXPIRES,
  });
  const userInfoWithUserToken = token;
  // userInfoWithUserToken.token = token;

  return userInfoWithUserToken;
}

export { makeAccessToken, makeRefreshToken };

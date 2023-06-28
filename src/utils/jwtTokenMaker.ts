import jwt from 'jsonwebtoken';
import 'dotenv/config';

type Token = {
  token: string;
  uuid: string;
  role: string;
};

function makeAccessToken(user: any) {
  const secretKey = process.env.JWT_SECRET_KEY || 'secret-key';
  const token = jwt.sign({ user_id: user._id, role: user.role }, secretKey, {
    expiresIn: '1h',
  });
  const userInfoWithUserToken: Token = {
    token,
    uuid: user.uuid,
    role: user.role,
  };

  return userInfoWithUserToken;
}

function makeRefreshToken(user: any) {
  const secretKey = process.env.REFRESH_JWT_SECRET_KEY || 'secret-key';
  const token = jwt.sign({ user_id: user._id }, secretKey, {
    expiresIn: '14 days',
  });
  const userInfoWithUserToken = token;
  // userInfoWithUserToken.token = token;

  return userInfoWithUserToken;
}

export { makeAccessToken, makeRefreshToken };

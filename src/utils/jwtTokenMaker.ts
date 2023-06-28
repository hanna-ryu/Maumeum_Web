import jwt from 'jsonwebtoken';
import 'dotenv/config';

type Token = {
  token: string;
  uuid: string;
};

function makeJwtToken(user: any) {
  const secretKey = process.env.JWT_SECRET_KEY || 'secret-key';
  const token = jwt.sign({ user_id: user._id, role: user.role }, secretKey, {
    expiresIn: '2h',
  });
  const userInfoWithUserToken = <Token>{};
  userInfoWithUserToken.token = token;
  userInfoWithUserToken.uuid = user.uuid;
  return userInfoWithUserToken;
}

export { makeJwtToken };

function makeRefreshJwtToken(user: any) {
  const secretKey = process.env.JWT_SECRET_KEY || 'secret-key';
  const token = jwt.sign({ user_id: user._id, role: user.role }, secretKey, {
    expiresIn: '14 days',
  });
  const userInfoWithUserToken = <Token>{};
  userInfoWithUserToken.token = token;
  userInfoWithUserToken.uuid = user.uuid;
  return userInfoWithUserToken;
}

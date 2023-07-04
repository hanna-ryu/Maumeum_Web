import jwt from 'jsonwebtoken';

function getRefreshTokenExpirationDate(refreshToken: string): Date | Boolean {
  const secretKey = process.env.REFRESH_JWT_SECRET_KEY || 'secret-key';

  const decodedToken: any = jwt.verify(refreshToken, secretKey);

  if (
    !decodedToken ||
    typeof decodedToken !== 'object' ||
    !('exp' in decodedToken)
  ) {
    throw new Error('Invalid refreshToken');
  }

  const expirationDate = new Date(decodedToken.exp * 1000);
  return expirationDate;
}

function isRefreshTokenExpired(refreshToken: string): boolean {
  try {
    const refreshTokenExpirationDate: Date | Boolean =
      getRefreshTokenExpirationDate(refreshToken);
    const currentTime = Date.now();

    const isExpired =
      refreshTokenExpirationDate instanceof Date &&
      refreshTokenExpirationDate.getTime() <= currentTime;

    return isExpired;
  } catch (error) {
    return true;
  }
}

export { isRefreshTokenExpired };

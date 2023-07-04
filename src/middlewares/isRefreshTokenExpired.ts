import jwt from 'jsonwebtoken';

function isRefreshTokenExpired(refreshToken: string) {
  // refreshToken이 만료되었는지 여부를 확인하는 로직을 구현합니다.
  // refreshToken의 만료일과 현재 시간을 비교하여 확인합니다.

  function getRefreshTokenExpirationDate(refreshToken: string) {
    const secretKey = process.env.REFRESH_JWT_SECRET_KEY || 'secret-key';
    const decodedToken: any = jwt.verify(refreshToken, secretKey);

    if (
      !decodedToken ||
      typeof decodedToken !== 'object' ||
      !('exp' in decodedToken)
    ) {
      throw new Error('Invalid refreshToken');
    }

    // "exp" 클레임의 값으로부터 만료 시간을 계산합니다.
    const expirationDate = new Date(decodedToken.exp * 1000); // JWT의 "exp" 값은 초 단위이므로 밀리초로 변환합니다.

    return expirationDate;
  }

  const refreshTokenExpirationDate =
    getRefreshTokenExpirationDate(refreshToken).getTime(); // 밀리초로 변환하여 가져옵니다.
  const currentTime = Date.now();
  return refreshTokenExpirationDate <= currentTime;
}

export { isRefreshTokenExpired };

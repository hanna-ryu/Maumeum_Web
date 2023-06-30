type Constants = {
  HASHING_TIMES: number;
  CHANGING_DATE: number;
  RANDOM_REVIEWS: number;
  COOKIE_ACCESS_TOKEN_EXPIRE_DATE: Date;
  COOKIE_REFRESH_TOKEN_EXPIRE_DATE: Date;
};
const CONSTANTS: Constants = {
  HASHING_TIMES: 10,
  CHANGING_DATE: 7,
  RANDOM_REVIEWS: 4,
  COOKIE_ACCESS_TOKEN_EXPIRE_DATE: new Date(Date.now() + 60 * 60 * 1000),
  COOKIE_REFRESH_TOKEN_EXPIRE_DATE: new Date(
    Date.now() + 14 * 24 * 60 * 60 * 1000,
  ),
};

export { CONSTANTS };

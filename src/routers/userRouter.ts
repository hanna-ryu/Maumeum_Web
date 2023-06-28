import express from 'express';
import { UserController } from '../controllers/userController.js';
import { loginRequired } from '../middlewares/loginRequired.js';
import { imageUploader } from '../utils/multer.js';
import { adminOnly } from '../middlewares/adminOnly.js';
const userRouter = express.Router();

const userController = new UserController();

//이메일 중복체크
userRouter.post('/email', userController.checkEmailDuplication);

// 회원가입
userRouter.post('/signup', userController.createUser);

//로그인
userRouter.post('/login', userController.userLogin);

//accessToken 재발급
userRouter.get('/refresh', userController.changeTokenStatus);

//비밀번호 확인
userRouter.post('/users/auth', loginRequired, userController.userAuthorization);

//사용자 정보 조회
userRouter.get('/users/info', loginRequired, userController.getUser);

//사용자 정보 수정 (닉네임, 휴대전화번호, 비밀번호)
userRouter.patch('/users/info', loginRequired, userController.updateUserInfo);

//사용자의 팀 인증여부 확인
userRouter.get(
  '/users/teamAuth',
  loginRequired,
  userController.checkTeamAuthorization,
);

//사용자 정보 수정 (자기소개)
userRouter.patch(
  '/users/introduction',
  loginRequired,
  userController.updateIntroduction,
);
//사용자 정보 수정(이미지)
userRouter.patch(
  '/users/image',
  loginRequired,
  imageUploader,
  userController.updateImage,
);

//사용자 정보 수정(기본 이미지로)
userRouter.patch(
  '/users/original/image',
  loginRequired,
  userController.toDefaultImage,
);

//사용자 회원 탈퇴
userRouter.delete('/users', loginRequired, userController.deleteUser);

//관리자가 disabled된 유저 조회
userRouter.get(
  '/users/admin/disabled',
  adminOnly,
  userController.getDisabledUser,
);

export { userRouter };

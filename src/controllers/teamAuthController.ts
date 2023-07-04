import { Request, Response, NextFunction } from 'express';
import { TeamAuthService, UserService } from '../services/index.js';
import { makeInstance } from '../utils/makeInstance.js';
import { AppError } from '../misc/AppError.js';
import { commonErrors } from '../misc/commonErrors.js';
import { STATUS_CODE } from '../utils/statusCode.js';
import { buildResponse } from '../utils/builderResponse.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';
import { ObjectId } from 'mongodb';
import { sendMail } from '../middlewares/nodeMailer.js';

class TeamAuthController {
  private teamAuthService = makeInstance<TeamAuthService>(TeamAuthService);
  private userService = makeInstance<UserService>(UserService);

  public postTeamAuth = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const user_id = req.id;
      const {
        category,
        teamName,
        introduction,
        briefHistory,
        establishmentDate,
        phone,
        location,
      } = req.body;
      if (!req.file) {
        throw new AppError(
          `${commonErrors.resourceNotFoundError} : 전달된 이미지가 없습니다.`,
          STATUS_CODE.BAD_REQUEST,
          'BAD_REQUEST',
        );
      }
      const image = `images/${req.file.filename}`;
      const createdTeamAuth = await this.teamAuthService.createTeamAuth({
        user_id,
        category,
        teamName,
        introduction,
        briefHistory,
        establishmentDate,
        phone,
        location,
        image,
      });

      res
        .status(STATUS_CODE.CREATED)
        .json(buildResponse(null, createdTeamAuth));
    },
  );

  public getTeamAuth = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const user_id = req.id;
      const teamAuth = await this.teamAuthService.readTeamAuthByUid(user_id);
      res.status(STATUS_CODE.OK).json(buildResponse(null, teamAuth));
    },
  );

  public getTeamAuthByUUID = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { uuid } = req.body;
      const user = await this.userService.getUserByCondition({ uuid: uuid });
      const user_id = user[0]._id;
      const teamAuthInfo = await this.teamAuthService.readTeamAuthByUid(
        user_id,
      );
      res.status(STATUS_CODE.OK).json(buildResponse(null, teamAuthInfo));
    },
  );

  //관리자가 제출된 팀 인증 다큐먼트들을 확인
  public getSubmittedTeamAuth = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const teamAuth = await this.teamAuthService.readTeamAuthByCondition({
        isSubmit: true,
      });
      res.status(STATUS_CODE.OK).json(buildResponse(null, teamAuth));
    },
  );

  public updateAuthStatus = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { teamAuth_id } = req.body;
      const { status } = req.query;
      const teamAuth = await this.teamAuthService.readTeamAuth(teamAuth_id);

      if (!teamAuth || teamAuth === null) {
        throw new AppError(
          `${commonErrors.resourceNotFoundError} : teamAuth_id가 잘못되었거나, 일치하는 정보가 없습니다.`,
          STATUS_CODE.BAD_REQUEST,
          'BAD_REQUEST',
        );
      }
      const user_id = teamAuth.user_id as ObjectId;
      const authorization = status === 'true' ? true : false;
      const updatedAuthStatus = await this.userService.updateUser(user_id, {
        authorization: authorization,
      });
      const updateInfo = {
        isSubmit: false,
      };
      const updatedTeamAuth = await this.teamAuthService.updateTeamAuth(
        teamAuth_id,
        updateInfo,
      );

      const updatedUserInfo: {} = { teamAuth_id: teamAuth_id };
      const userInfo = await this.userService.updateUser(
        user_id,
        updatedUserInfo,
      );
      console.log(userInfo);
      if (!userInfo) {
        throw new AppError(
          `${commonErrors.resourceNotFoundError} : 해당하는 유저 정보가 없습니다.`,
          STATUS_CODE.BAD_REQUEST,
          'BAD_REQUEST',
        );
      }
      await sendMail(userInfo.email, userInfo.nickname, teamAuth.teamName);
      res
        .status(STATUS_CODE.CREATED)
        .json(buildResponse(null, updatedAuthStatus));
    },
  );
}

export { TeamAuthController };

import { Request, Response, NextFunction } from 'express';
import {
  ReviewService,
  UserService,
  VolunteerApplicationService,
} from '../services/index.js';
import { ObjectId } from 'mongodb';
import { makeInstance } from '../utils/makeInstance.js';
import { STATUS_CODE } from '../utils/statusCode.js';
import { buildResponse } from '../utils/builderResponse.js';
import { AppError } from '../misc/AppError.js';
import { commonErrors } from '../misc/commonErrors.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';
import { logger } from '../utils/logger.js';
import { countReportedTimes } from '../utils/reportedTimesData.js';

interface MyFile extends Express.Multer.File {
  processedPath: string;
  key: string;
}

interface ReviewData {
  review_id?: ObjectId;
  user_id?: ObjectId;
  title?: string;
  content?: string;
  images?: string[];
  isReported?: boolean;
  volunteer_id?: any; // 나중에 고쳐야함.
}
class ReviewController {
  private reviewService = makeInstance<ReviewService>(ReviewService);
  private volunteerApplicationService =
    makeInstance<VolunteerApplicationService>(VolunteerApplicationService);
  private userService = makeInstance<UserService>(UserService);

  public readMyReview = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const user_id = req.id;
      const reviews = await this.reviewService.getReviewsByUserId(user_id);
      res.status(STATUS_CODE.OK).json(buildResponse(null, reviews));
    },
  );

  public readReviewDetail = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { review_id }: ReviewData = req.params;
      if (!review_id) {
        throw new AppError(
          commonErrors.argumentError,
          STATUS_CODE.BAD_REQUEST,
          'BAD_REQUEST',
        );
      }
      const review = await this.reviewService.getReviewById(review_id);
      if (!review) {
        throw new AppError(
          commonErrors.resourceNotFoundError,
          STATUS_CODE.BAD_REQUEST,
          'BAD_REQUEST',
        );
      }
      res.status(STATUS_CODE.OK).json(buildResponse(null, review));
    },
  );

  public readReview = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { skip, limit } = req.query;

      const reviews = await this.reviewService.getReviews(
        Number(skip),
        Number(limit),
      );
      const totalReviewsCount = await this.reviewService.totalReviewsCount();
      logger.debug(`totalReviewsCount : ${totalReviewsCount}`);
      logger.debug(`skip: ${skip}`);
      logger.debug(`limit: ${limit}`);

      const hasMore = Number(skip) + Number(limit) < totalReviewsCount;
      logger.debug(`review.length : ${reviews.length}`);
      logger.debug(`hasMore : ${hasMore}`);
      res
        .status(STATUS_CODE.OK)
        .json(buildResponse(null, { reviews, hasMore }));
    },
  );

  public readRandomReviews = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const reviews = await this.reviewService.getRandomReviews();
      res.status(STATUS_CODE.OK).json(buildResponse(null, reviews));
    },
  );

  public postReview = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const user_id = req.id;
      const { title, content, volunteer_id }: ReviewData = req.body;

      const files = req.files as MyFile[];
      const newPath = files.map((file) => {
        return `${file.key}`;
      });

      const volunteer =
        await this.volunteerApplicationService.readApplicationVolunteerByCondition(
          { user_id, volunteer_id },
        );
      logger.debug(`volunteer : ${volunteer}`);

      const checkedReview = await this.reviewService.getReviewByCondition({
        user_id: user_id,
        volunteer_id: volunteer_id,
      });

      if (!volunteer || !volunteer.isParticipate) {
        throw new AppError(
          `${commonErrors.requestValidationError} : 참여 확인 버튼을 누르지 않았거나, 봉사가 끝난 날로부터 7일이 지나지 않았습니다.`,
          STATUS_CODE.BAD_REQUEST,
          'BAD_REQUEST  참여 확인 버튼을 누르지 않았거나, 봉사가 끝난 날로부터 7일이 지나지 않았습니다.',
        );
      }

      const createdReview = await this.reviewService.createReview({
        user_id,
        title,
        content,
        images: newPath,
        volunteer_id,
      });

      const applicationVolunteer =
        await this.volunteerApplicationService.readApplicationVolunteerByCondition(
          { user_id, volunteer_id },
        );

      if (applicationVolunteer) {
        applicationVolunteer.isReviewed = true;
        await applicationVolunteer.save();
      }

      res.status(STATUS_CODE.CREATED).json(buildResponse(null, createdReview));
    },
  );

  public updateReview = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { review_id }: ReviewData = req.params;
      if (!review_id) {
        throw new AppError(
          commonErrors.argumentError,
          STATUS_CODE.BAD_REQUEST,
          'BAD_REQUEST',
        );
      }
      const files = (req.files as MyFile[]) || [];
      logger.debug(files);
      const newPath = files.map((file: any) => {
        return `images/${file.filename}`;
      });
      const { title, content }: ReviewData = req.body;
      const updateInfo: ReviewData = {};
      if (title) {
        updateInfo.title = title;
      }
      if (content) {
        updateInfo.content = content;
      }
      if (newPath) {
        updateInfo.images = newPath;
      }

      const updatedReview = await this.reviewService.updateReview(
        review_id,
        updateInfo,
      );
      res.status(STATUS_CODE.CREATED).json(buildResponse(null, updatedReview));
    },
  );

  //리뷰 신고
  public patchReportReview = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { review_id }: ReviewData = req.params;

      if (!review_id) {
        throw new AppError(
          commonErrors.argumentError,
          STATUS_CODE.BAD_REQUEST,
          'BAD_REQUEST',
        );
      }

      await this.reviewService.updateReportReview(review_id, {
        isReported: true,
      });

      res.status(STATUS_CODE.CREATED).json(buildResponse(null, null));
    },
  );

  public getSearchReviews = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { keyword } = req.query;
      const searchReviews = await this.reviewService.readSearchReviews(
        keyword as string,
      );
      res.status(STATUS_CODE.OK).json(buildResponse(null, searchReviews));
    },
  );

  public checkUser = asyncHandler(async (req: Request, res: Response) => {
    const { review_id }: ReviewData = req.params;
    const user_id = req.id;
    if (!review_id) {
      throw new AppError(
        commonErrors.resourceNotFoundError,
        STATUS_CODE.BAD_REQUEST,
        'BAD_REQUEST',
      );
    }
    const review = await this.reviewService.getReviewById(review_id);
    logger.debug(`review : ${review}`);
    logger.debug(`user_id : ${user_id}`);
    logger.debug(`review?.user_id?._id : ${review?.user_id?._id}`);
    if (String(user_id) === String(review?.user_id?._id)) {
      res.status(STATUS_CODE.OK).json(buildResponse(null, true));
    } else {
      res.status(STATUS_CODE.OK).json(buildResponse(null, false));
    }
  });

  public deleteReview = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { review_id }: ReviewData = req.params;
      if (!review_id) {
        throw new AppError(
          commonErrors.argumentError,
          STATUS_CODE.BAD_REQUEST,
          'BAD_REQUEST',
        );
      }
      await this.reviewService.deleteReview(review_id);
      res.status(STATUS_CODE.OK).json(buildResponse(null, null));
    },
  );

  public changeParticipationStatus = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const user_id = req.id;
      const { volunteer_id }: ReviewData = req.params;

      if (!volunteer_id) {
        throw new AppError(
          commonErrors.argumentError,
          STATUS_CODE.BAD_REQUEST,
          'BAD_REQUEST',
        );
      }
      const changed = await this.reviewService.changeParticipateStatus(
        volunteer_id,
        user_id,
      );
      res.status(STATUS_CODE.CREATED).json(buildResponse(null, changed));
    },
  );

  // ===== 관리자 기능 =====
  // 신고된 내역 전체 조회
  public getReportedReview = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const reportedReview = await this.reviewService.readReportedReview();

      res.status(STATUS_CODE.OK).json(buildResponse(null, reportedReview));
    },
  );

  // 신고된 내역 취소(반려)
  public patchReportedReview = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { review_id }: ReviewData = req.params;

      if (!review_id) {
        throw new AppError(
          commonErrors.resourceNotFoundError,
          STATUS_CODE.BAD_REQUEST,
          'BAD_REQUEST',
        );
      }

      await this.reviewService.updateReportReview(review_id, {
        isReported: false,
      });

      res.status(STATUS_CODE.CREATED).json(buildResponse(null, null));
    },
  );

  // 신고된 내역 승인
  public deleteReportedReview = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { review_id }: ReviewData = req.params;

      if (!review_id) {
        throw new AppError(
          commonErrors.resourceNotFoundError,
          STATUS_CODE.BAD_REQUEST,
          'BAD_REQUEST',
        );
      }

      const deleteReview = await this.reviewService.deleteReportedReview(
        review_id,
      );

      //글 작성한 유저정보 가져오기
      const reportUser = deleteReview.user_id;

      const reportUserData = await this.userService.getUserReportedTimes(
        reportUser!,
      );

      let isDisabledUser;

      if (reportUserData) {
        isDisabledUser = countReportedTimes(reportUserData);
      }

      if (isDisabledUser) {
        await this.userService.updateReportedTimes(reportUser!, isDisabledUser);
      }

      res.status(STATUS_CODE.CREATED).json(buildResponse(null, null));
    },
  );
}
export { ReviewController };

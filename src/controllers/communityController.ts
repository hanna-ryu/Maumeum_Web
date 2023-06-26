import { Request, Response } from 'express';
import { CommunityService } from '../services/communityService.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';
import { STATUS_CODE } from '../utils/statusCode.js';
import { buildResponse } from '../utils/builderResponse.js';
import { AppError } from '../misc/AppError.js';
import { commonErrors } from '../misc/commonErrors.js';
import { makeInstance } from '../utils/makeInstance.js';
import { UserService } from '../services/userService.js';
import { countReportedTimes } from '../utils/reportedTimesData.js';
import { PostCommentService } from '../services/postCommentService.js';

interface MyFile extends Express.Multer.File {
  // 추가적인 사용자 정의 속성을 선언할 수도 있습니다
  // 예: 필요한 경우 가공된 파일 경로 등
  processedPath: string;
  key: string;
}

export class CommunityController {
  public communityService = new CommunityService();
  private userService = makeInstance<UserService>(UserService);
  private postCommentService =
    makeInstance<PostCommentService>(PostCommentService);

  public createPost = asyncHandler(async (req: Request, res: Response) => {
    const user_id = req.id;
    const { title, content, postType, isReported } = req.body;
    if (req.files) {
      const files = req.files as MyFile[];
      const newPath = files.map((file) => {
        return `${file.key}`;
      });

      const newPost = await this.communityService.createPost({
        title,
        content,
        postType,
        images: newPath,
        user_id,
        isReported,
      });

      res.status(STATUS_CODE.OK).json(buildResponse(null, { newPost }));
    } else {
      const newPost = await this.communityService.createPost({
        title,
        content,
        postType,
        images: [],
        user_id,
        isReported,
      });
      res.status(STATUS_CODE.OK).json(buildResponse(null, newPost));
    }
  });
  public checkUser = asyncHandler(async (req: Request, res: Response) => {
    const { postid } = req.params;
    const user_id = req.id;
    //
    const result = await this.communityService.checkUser(postid as string);

    if (result!._id.toString() === user_id.toString()) {
      res.status(STATUS_CODE.OK).json(buildResponse(null, true));
    } else {
      res.status(STATUS_CODE.OK).json(buildResponse(null, false));
    }
  });
  //

  // 모든 게시물 조회
  public getAllPosts = asyncHandler(async (req: Request, res: Response) => {
    const { skip, limit } = req.query;

    const posts = await this.communityService.findAllPost(
      Number(skip),
      Number(limit),
    );
    const totalReviewsCount = await this.communityService.totalReviewsCount();

    const hasMore = Number(skip) + Number(limit) < totalReviewsCount;
    res.status(STATUS_CODE.OK).json(buildResponse(null, { posts, hasMore }));
  });
  ////

  //keyword 로 게시물 조회
  public searchPost = asyncHandler(async (req: Request, res: Response) => {
    const { keyword, posttype, limit, skip } = req.query;
    //community/serach?keyword=${keyword}&posttype=findfreind

    // qna findfreind
    const posts = await this.communityService.searchPost(
      keyword as string,
      posttype as string,
      Number(skip),
      Number(limit),
    );
    const totalReviewsCount = await this.communityService.totalReviewsCount();

    const hasMore = Number(skip) + Number(limit) < totalReviewsCount;
    res.status(STATUS_CODE.OK).json(buildResponse(null, posts));
  });
  public searchtotalPost = asyncHandler(async (req: Request, res: Response) => {
    const { keyword, skip, limit } = req.query;
    const posts = await this.communityService.searchPosts(
      keyword as string,
      Number(skip),
      Number(limit),
    );
    const totalReviewsCount =
      await this.communityService.totalCategoryReviewsCount1(keyword as string);

    const hasMore = Number(skip) + Number(limit) < totalReviewsCount;
    res.status(STATUS_CODE.OK).json(buildResponse(null, { posts, hasMore }));
  });

  public getPost = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { skip, limit } = req.query;

    const comment = await this.communityService.findByPostIdComment(id);
    const post = await this.communityService.indByPostIdPost(
      id,
      Number(skip),
      Number(limit),
    );
    const user = await this.communityService.findUserByPostId(id);

    res
      .status(STATUS_CODE.OK)
      .json(buildResponse(null, { post, comment, userRole: user!.role }));
  });

  public patchPost = async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
      const { title, content, postType } = req.body;

      if (req.files) {
        const files = req.files as MyFile[];
        const newPath = files.map((file) => {
          return `${file.key}`;
        });

        const patchPosts = await this.communityService.findOneAndUpdate(id, {
          title,
          content,
          images: newPath,
          postType,
        });
        res.status(STATUS_CODE.OK).send(buildResponse(null, patchPosts));
      } else {
        const Posts = await this.communityService.findOneAndUpdate(id, {
          title,
          content,
          postType,
        });
        res.send(Posts);
      }
    } catch {
      res.status(400).send({ message: '오류 발생' });
    }
  };
  //카테고리
  public getPostByCategory = asyncHandler(
    async (req: Request, res: Response) => {
      const { category } = req.params;
      const { skip, limit } = req.query;

      if (!category) {
        throw new AppError(
          commonErrors.argumentError,
          STATUS_CODE.BAD_REQUEST,
          'BAD_REQUEST',
        );
      }
      const categoryPost = await this.communityService.getPostByCat(
        category,
        Number(skip),
        Number(limit),
      );
      const totalReviewsCount =
        await this.communityService.totalCategoryReviewsCount(category);

      const hasMore = Number(skip) + Number(limit) < totalReviewsCount;
      res
        .status(STATUS_CODE.OK)
        .json(buildResponse(null, { categoryPost, hasMore }));
    },
  );

  // 특정 게시물 신고
  public patchReportPost = asyncHandler(async (req: Request, res: Response) => {
    const { communityId } = req.params;

    if (!communityId) {
      throw new AppError(
        commonErrors.argumentError,
        STATUS_CODE.BAD_REQUEST,
        'BAD_REQUEST',
      );
    }

    await this.communityService.updateReportPost(communityId, {
      isReported: true,
    });

    res.status(STATUS_CODE.CREATED).json(buildResponse(null, null));
  });
  //게시물 삭제
  public deletePost = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) {
      throw new AppError(
        commonErrors.argumentError,
        STATUS_CODE.BAD_REQUEST,
        'BAD_REQUEST',
      );
    }

    // 게시글의 post id를 가지는 댓글 삭제
    await this.postCommentService.deletePostComments(id);
    await this.communityService.delete(id);
    res.status(STATUS_CODE.OK).json(buildResponse(null, null));
  });
  /////////

  // 유저 정보 가져오기
  public getUserPosts = asyncHandler(async (req: Request, res: Response) => {
    const user_id: any = req.id;
    if (!user_id) {
      throw new AppError(
        commonErrors.requestValidationError,
        STATUS_CODE.BAD_REQUEST,
        'BAD_REQUEST',
      );
    }

    const userPosts = await this.communityService.getUserPosts(user_id);
    res.status(STATUS_CODE.OK).json(buildResponse(null, userPosts));
  });

  // ===== 관리자 기능 =====

  // 신고된 내역 전체 조회
  public getReportedCommunity = asyncHandler(
    async (req: Request, res: Response) => {
      const reportedCommunity =
        await this.communityService.readReportedCommunity();

      res.status(STATUS_CODE.OK).json(buildResponse(null, reportedCommunity));
    },
  );

  public patchReportedCommunity = asyncHandler(
    async (req: Request, res: Response) => {
      const { communityId } = req.params;

      if (!communityId) {
        throw new AppError(
          commonErrors.resourceNotFoundError,
          STATUS_CODE.BAD_REQUEST,
          'BAD_REQUEST',
        );
      }

      await this.communityService.updateReportPost(communityId, {
        isReported: false,
      });

      res.status(STATUS_CODE.CREATED).json(buildResponse(null, null));
    },
  );

  public deleteReportedCommunity = asyncHandler(
    async (req: Request, res: Response) => {
      const { communityId } = req.params;

      if (!communityId) {
        throw new AppError(
          commonErrors.resourceNotFoundError,
          STATUS_CODE.BAD_REQUEST,
          'BAD_REQUEST',
        );
      }

      const deleteCommunity =
        await this.communityService.deleteReportedCommunity(communityId);

      //글 작성한 유저정보 가져오기
      const reportUser = deleteCommunity.user_id;

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

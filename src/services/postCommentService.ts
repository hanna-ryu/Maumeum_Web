import { PostCommentModel } from '../db/index.js';
import { ObjectId } from 'mongodb';
import { Post } from '../db/schemas/postSchema.js';
import { AppError } from '../misc/AppError.js';
import { commonErrors } from '../misc/commonErrors.js';
import { STATUS_CODE } from '../utils/statusCode.js';

interface PostCommentData {
  user_id: ObjectId;
  post_id: ObjectId;
  content: string;
}

class PostCommentService {
  public async createComment(postCommentData: PostCommentData) {
    const postComment = await PostCommentModel.create(postCommentData);
    return postComment;
  }

  public async readPostByComment(user_id: ObjectId) {
    const userComments = await PostCommentModel.find({ user_id }).populate(
      'post_id',
      ['title', 'content', 'postType', 'createdAt']
    );

    if (userComments.length === 0) {
      return [];
    }

    const postList = userComments.map((userComment) => {
      const postId = userComment.post_id as Post;
      return postId;
    });

    return postList;
  }

  public async readComment(post_id: string) {
    const postCommentList = await PostCommentModel.find({
      post_id: post_id,
    }).populate('user_id', 'nickname');
    return postCommentList;
  }

  public async updateComment(
    postCommentId: string,
    postCommentData: PostCommentData
  ) {
    const newPostComment = await PostCommentModel.findByIdAndUpdate(
      postCommentId,
      postCommentData
    );

    if (!newPostComment) {
      throw new AppError(
        commonErrors.resourceNotFoundError,
        STATUS_CODE.BAD_REQUEST,
        'BAD_REQUEST'
      );
    }

    return newPostComment;
  }

  public async deleteComment(postCommentId: string) {
    const deletePostComment = await PostCommentModel.findByIdAndDelete(
      postCommentId
    );

    if (!deletePostComment) {
      throw new AppError(
        commonErrors.resourceNotFoundError,
        STATUS_CODE.BAD_REQUEST,
        'BAD_REQUEST'
      );
    }

    return deletePostComment;
  }
}

export { PostCommentService };

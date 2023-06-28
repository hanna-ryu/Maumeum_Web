import { UserModel } from '../db/index.js';
import bcrypt from 'bcrypt';
import { ObjectId } from 'mongodb';
import { CONSTANTS } from '../utils/Constants.js';
import { commonErrors } from '../misc/commonErrors.js';
import { STATUS_CODE } from '../utils/statusCode.js';
import { AppError } from '../misc/AppError.js';
import { Ref } from '@typegoose/typegoose';
import { User } from '../db/schemas/userSchema.js';
interface UserInfo {
  user_id?: ObjectId;
  nickname?: string;
  nanoid?: string;
  introduction?: string;
  authorization?: boolean;
  image?: string;
  email?: string;
  password?: string;
  phone?: string;
  role?: 'user' | 'admin' | 'disabled';
}

interface ReportedTimeData {
  reportedTimes: number;
  role: string;
}
class UserService {
  // 유저 생성
  public async createUser({ nickname, email, password, phone }: UserInfo) {
    if (!password) {
      throw new AppError(
        commonErrors.argumentError,
        STATUS_CODE.BAD_REQUEST,
        'BAD_REQUEST',
      );
    }
    const hashedPassword = await bcrypt.hash(password, CONSTANTS.HASHING_TIMES);
    const createdUser = await UserModel.create({
      nickname,
      email,
      password: hashedPassword,
      phone,
    });
    return createdUser;
  }

  public async changeRefreshToken(user_id: ObjectId, refreshToken: string) {
    const user = await UserModel.findById(user_id);
    if (!user) {
      // 사용자를 찾지 못한 경우 예외 처리
      throw new Error('User not found');
    }

    user.refreshToken = refreshToken;
    await user.save();
  }

  //이메일로 유저 찾기
  public async getUserByEmail(email: string) {
    const user = await UserModel.findOne({ email });
    return user;
  }

  //object_id로 유저 찾기 (이메일, 닉네임, 폰)
  public async getUserById(_id: ObjectId) {
    const user = await UserModel.findById({ _id }).select(
      'id email role nickname phone introduction image authorization uuid refreshToken',
    );
    return user;
  }

  public async getUserByRefreshToken(refreshToken: string) {
    const user = await UserModel.findOne({ refreshToken: refreshToken }).select(
      'id email role nickname phone uuid refreshToken',
    );
    return user;
  }

  //object_id로 유저 찾기 (password)
  public async getUserPasswordById(user_id: ObjectId) {
    const user = await UserModel.findById(user_id).select('password');
    return user;
  }

  public async updateUser(user_id: ObjectId, updateInfo: UserInfo) {
    const updatedUser = await UserModel.findByIdAndUpdate(user_id, updateInfo);
    return updatedUser;
  }

  public async getUserByCondition(condition: {}) {
    const user = await UserModel.find(condition).select([
      'nickname',
      'role',
      'uuid',
      'authorization',
      'image',
      'phone',
      'reportedTimes',
      'email',
      'createdAt',
      'updatedAt',
    ]);
    return user;
  }

  // ===== 관리자 기능 =====
  // 사용자의 reportedTimes 가져오기
  public async getUserReportedTimes(user_id: Ref<User>) {
    const user = await UserModel.findById(user_id).select('reportedTimes role');

    if (!user) {
      throw new AppError(
        commonErrors.resourceNotFoundError,
        STATUS_CODE.BAD_REQUEST,
        'BAD_REQUEST',
      );
    }

    return user;
  }

  // 사용자의 reportedTimes 업데이트하기
  public async updateReportedTimes(
    user_id: Ref<User>,
    reportedTimes: ReportedTimeData,
  ) {
    const user = await UserModel.findByIdAndUpdate(user_id, reportedTimes);
    return user;
  }

  public async updateUserDisable(user_id: Ref<User>) {}
}

export { UserService };

import { ObjectId } from 'mongodb';
import { TeamAuthModel, VolunteerModel } from '../db/index.js';
import { AppError } from '../misc/AppError.js';
import { commonErrors } from '../misc/commonErrors.js';
import { STATUS_CODE } from '../utils/statusCode.js';
import { searchOption } from '../utils/searchOptions.js';
import { logger } from '../utils/logger.js';

interface VolunteerData {
  title: string;
  content: string;
  centName: string;
  centDescription: string;
  statusName: string;
  deadline: Date;
  startDate: Date;
  endDate: Date;
  applyCount: number;
  registerCount: number;
  actType:
    | '노인'
    | '급식'
    | '환경'
    | '동물'
    | '장애인'
    | '생활편의지원'
    | '의료'
    | '교육';
  teenager: boolean;
  images: string[];
  register_user_id: ObjectId;
}

interface VolunteerStatus {
  statusName: string;
}

interface VolunteerReportData {
  isReported: boolean;
}

interface VolunteerApplyCountData {
  applyCount: number;
}

type VolunteerConditionData = {
  options?: Array<{ [key: string]: { $regex: string } }>;
  user_id?: ObjectId;
  isReported?: boolean;
  statusName?: string | { $in: string[] };
};

class VolunteerService {
  public async createVolunteer(volunteerData: VolunteerData) {
    const { deadline, startDate, endDate, applyCount, registerCount } =
      volunteerData;

    if (deadline > startDate || deadline > endDate || startDate > endDate) {
      throw new AppError(
        commonErrors.inputError,
        STATUS_CODE.FORBIDDEN,
        'BAD_REQUEST',
      );
    }

    if (applyCount > registerCount) {
      throw new AppError(
        commonErrors.inputError,
        STATUS_CODE.FORBIDDEN,
        'BAD_REQUEST',
      );
    }
    const createVolunteer = await VolunteerModel.create(volunteerData);

    if (!createVolunteer) {
      throw new AppError(
        commonErrors.resourceNotFoundError,
        STATUS_CODE.BAD_REQUEST,
        'BAD_REQUEST',
      );
    }
    return createVolunteer;
  }

  public async readVolunteer(
    skip: number,
    limit: number,
    statusName: string | { $in: string[] },
  ) {
    const volunteerList = await VolunteerModel.find({ statusName: statusName })
      .select(
        'title centName deadline statusName applyCount registerCount images createdAt register_user_id',
      )
      .populate('register_user_id', ['image', 'nickname', 'uuid'])
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    // 'register_user_id'를 통해 'teamName' 값을 가져오기 위해 추가 작업
    const updatedVolunteerList = await Promise.all(
      volunteerList.map(async (volunteer) => {
        const userId = volunteer.register_user_id;
        const teamAuth = await TeamAuthModel.findOne({
          user_id: userId,
        }).select('teamName');
        const teamName = teamAuth ? teamAuth.teamName : null;
        return {
          ...volunteer.toObject(),
          teamName,
        };
      }),
    );

    return updatedVolunteerList;
  }

  public async getPostListQueryBuilder(condition: VolunteerConditionData) {
    let counts = 0;
    if (condition.options) {
      counts = await VolunteerModel.countDocuments({ $or: condition.options });
    } else if (condition.user_id) {
      counts = await VolunteerModel.countDocuments({
        register_user_id: condition.user_id,
      });
    } else if (condition.isReported) {
      counts = await VolunteerModel.countDocuments({
        isReported: condition.isReported,
      });
    } else if (condition.statusName) {
      counts = await VolunteerModel.countDocuments({
        statusName: condition.statusName,
      });
    }

    return counts;
  }
  public async readVolunteerById(volunteerId: string) {
    const volunteer = await VolunteerModel.findOne({
      _id: volunteerId,
    }).populate('register_user_id', [
      'nickname',
      'image',
      'introduction',
      'uuid',
    ]);

    if (!volunteer) {
      throw new AppError(
        commonErrors.resourceNotFoundError,
        STATUS_CODE.BAD_REQUEST,
        'BAD_REQUEST',
      );
    }

    return volunteer;
  }

  public async readSearchVolunteer(
    keyword: string,
    skip: number,
    limit: number,
  ) {
    const options = searchOption(keyword);

    const volunteerList = await VolunteerModel.find({
      $or: options,
    })
      .populate('register_user_id', 'uuid')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const updatedVolunteerList = await Promise.all(
      volunteerList.map(async (volunteer) => {
        const userId = volunteer.register_user_id;
        const teamAuth = await TeamAuthModel.findOne({
          user_id: userId,
        }).select('teamName');
        const teamName = teamAuth ? teamAuth.teamName : null;
        return {
          ...volunteer.toObject(),
          teamName,
        };
      }),
    );

    return updatedVolunteerList;
  }

  public async readRegistrationVolunteer(
    user_id: ObjectId,
    skip: number,
    limit: number,
  ) {
    const volunteerList = await VolunteerModel.find({
      register_user_id: user_id,
    })
      .populate('register_user_id')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    return volunteerList;
  }

  public async updateVolunteer(
    volunteer_id: string,
    volunteerData: VolunteerData,
  ) {
    const volunteer = await VolunteerModel.findByIdAndUpdate(
      volunteer_id,
      volunteerData,
    );

    if (!volunteer) {
      throw new AppError(
        commonErrors.resourceNotFoundError,
        STATUS_CODE.BAD_REQUEST,
        'BAD_REQUEST',
      );
    }
    return true;
  }

  public async updateVolunteerApplyCount(
    volunteer_id: string,
    applyCount: VolunteerApplyCountData,
  ) {
    const volunteer = await VolunteerModel.findByIdAndUpdate(
      volunteer_id,
      applyCount,
    );

    if (!volunteer) {
      throw new AppError(
        commonErrors.resourceNotFoundError,
        STATUS_CODE.BAD_REQUEST,
        'BAD_REQUEST',
      );
    }

    return true;
  }

  public async updateRegisterationVolunteer(
    volunteerId: string,
    volunteerData: VolunteerStatus,
  ) {
    const volunteer = await VolunteerModel.findByIdAndUpdate(
      volunteerId,
      volunteerData,
    );

    if (!volunteer) {
      throw new AppError(
        commonErrors.resourceNotFoundError,
        STATUS_CODE.BAD_REQUEST,
        'BAD_REQUEST',
      );
    }

    return true;
  }

  public async updateReportVolunteer(
    volunteerId: string,
    isReported: VolunteerReportData,
  ) {
    const volunteer = await VolunteerModel.findByIdAndUpdate(
      volunteerId,
      isReported,
    );

    if (!volunteer) {
      throw new AppError(
        commonErrors.resourceNotFoundError,
        STATUS_CODE.BAD_REQUEST,
        'BAD_REQUEST',
      );
    }

    return true;
  }

  // ===== 관리자 기능 =====

  public async readReportedVolunteer(skip: number, limit: number) {
    const reportedVolunteer = await VolunteerModel.find({
      isReported: true,
    })
      .select('title content')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    return reportedVolunteer;
  }

  public async deleteReportedVolunteer(volunteer_id: string) {
    const volunteer = await VolunteerModel.findByIdAndDelete(
      volunteer_id,
    ).populate('register_user_id', 'reportedTimes');

    if (!volunteer) {
      throw new AppError(
        commonErrors.resourceNotFoundError,
        STATUS_CODE.BAD_REQUEST,
        'BAD_REQUEST',
      );
    }

    return volunteer;
  }

  public async changeStatusNameAtMidnight() {
    const currentDate = new Date();
    const volunteers = await VolunteerModel.find({
      statusName: '모집중',
    }).select('endDate statusName');

    for (const volunteer of volunteers) {
      if (volunteer.endDate < currentDate) {
        volunteer.statusName = '모집완료';
        await volunteer.save();
        logger.debug(volunteer);
      }
    }
  }
}

export { VolunteerService };

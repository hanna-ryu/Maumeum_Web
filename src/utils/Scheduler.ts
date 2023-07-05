import schedule from 'node-schedule';
import { ReviewService } from '../services/reviewService.js';
import { VolunteerService } from '../services/volunteerService.js';

const reviewService = new ReviewService();
const volunteerService = new VolunteerService();

//매일 자정 실행되는 함수
const changeParticipateStatus = () => {
  schedule.scheduleJob(
    '0 0 * * *',
    reviewService.changeParticipateStatusAtMidnight,
  );
};

const changeStatusName = () => {
  schedule.scheduleJob(
    '0 0 * * *',
    volunteerService.changeStatusNameAtMidnight,
  );
};

export { changeParticipateStatus, changeStatusName };

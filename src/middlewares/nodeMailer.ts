import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const EMAIL = process.env.GMAIL;
const PASSWORD = process.env.GMAIL_PASSWORD;

const sendMail = async (email: String, nickname: String, teamName: string) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: EMAIL, pass: PASSWORD },
  });
  const mailOptions: {} = {
    to: email,
    subject: `[마음이음] ${nickname}님의 요청하신 팀 인증이 완료되었습니다.`,
    html: `
    
    <h2>팀 ${teamName}의 인증이 완료되었습니다. 로그인하여 확인해주세요.</h2>
    <a href="http://maumeum.site/">http://maumeum.site/</a>
  `,
  };

  await transporter.sendMail(mailOptions);
};

export { sendMail };

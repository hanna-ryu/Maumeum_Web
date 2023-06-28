// import axios from 'axios';
// import sharp from 'sharp';
// import { S3 } from 'aws-sdk';
// import dotenv from 'dotenv';

// dotenv.config();

// const s3 = new S3({
//   region: process.env.AWS_REGION,
//   credentials: {
//     accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'undefined',
//     secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'undefined',
//   },
// });

// const resizeAndUploadImage = async (imageUrl: string, targetBucket: string) => {
//   try {
//     // 이미지 다운로드
//     const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
//     const imageBuffer = Buffer.from(response.data, 'binary');

//     // 이미지 리사이징
//     const resizedImageBuffer = await sharp(imageBuffer)
//       .resize({ width: 500, height: 500 }) // 리사이징할 크기 설정
//       .toBuffer();

//     // 업로드할 파일명 생성
//     const timestamp = Date.now().toString();
//     const targetFilename = `maumeum-image-resized/${timestamp}-${path.basename(
//       imageUrl,
//     )}`;

//     // 이미지 업로드
//     const uploadParams = {
//       Bucket: targetBucket,
//       Key: targetFilename,
//       Body: resizedImageBuffer,
//       ACL: 'public-read', // 업로드된 파일의 ACL(Access Control List)
//     };
//     await s3.upload(uploadParams).promise();

//     console.log('이미지 업로드 완료:', targetFilename);
//   } catch (error) {
//     console.error('이미지 업로드 에러:', error);
//   }
// };

// // 사용 예시
// const imageUrl = 'https://example.com/path/to/image.jpg'; // 업로드할 이미지 URL
// const targetBucket = process.env.AWS_S3_RESIZE_BUCKET_NAME; // 리사이징된 이미지를 업로드할 대상 버킷

// resizeAndUploadImage(imageUrl, targetBucket);

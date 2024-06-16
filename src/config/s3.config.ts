import { registerAs } from '@nestjs/config';
import { SafeEnvVar } from '@helpers/safeEnvVar';

export default registerAs('s3', () => ({
  bucketName: SafeEnvVar('S3_BUCKET_NAME'),
  accessKeyId: SafeEnvVar('S3_ACCESS_KEY_ID'),
  secretAccessKey: SafeEnvVar('S3_SECRET_ACCESS_KEY'),
  region: SafeEnvVar('S3_REGION'),
  signExpires: SafeEnvVar('S3_SIGN_EXPIRES'),
}));

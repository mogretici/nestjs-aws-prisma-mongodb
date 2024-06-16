import { registerAs } from '@nestjs/config';
import { SafeEnvVar } from '@helpers/safeEnvVar';

export default registerAs('jwt', () => ({
  secret: SafeEnvVar('JWT_SECRET'),
  accessToken: SafeEnvVar('ACCESS_TOKEN'),
  refreshToken: SafeEnvVar('REFRESH_TOKEN'),
  jwtExpAccessToken: Number(SafeEnvVar('ACCESS_TOKEN_EXP')),
  jwtExpRefreshToken: Number(SafeEnvVar('REFRESH_TOKEN_EXP')),
  jwtLinkExpAccessToken: Number(SafeEnvVar('LINK_TOKEN_EXP')),
}));

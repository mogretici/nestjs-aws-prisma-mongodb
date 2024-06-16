import { registerAs } from '@nestjs/config';
import { SafeEnvVar } from '@helpers/safeEnvVar';

export default registerAs('swagger', () => ({
  password: SafeEnvVar('SWAGGER_PASSWORD'),
}));

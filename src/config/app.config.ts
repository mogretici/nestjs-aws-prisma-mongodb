import { registerAs } from '@nestjs/config';
import * as path from 'path';
import { SafeEnvVar } from '@helpers/safeEnvVar';

function parseLogLevel(level: string | undefined): string[] {
  if (!level) {
    return ['log', 'error', 'warn', 'debug', 'verbose'];
  }

  if (level === 'none') {
    return [];
  }

  return level.split(',');
}

export default registerAs('app', () => ({
  port: SafeEnvVar('APP_PORT'),
  baseUrl: SafeEnvVar('BASE_URL'),
  loggerLevel: parseLogLevel(SafeEnvVar('APP_LOGGER_LEVEL')),
  env: SafeEnvVar('NODE_ENV'),
  // eslint-disable-next-line global-require,@typescript-eslint/no-var-requires
  version: require(path.join(process.cwd(), 'package.json')).version,
}));

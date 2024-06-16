import * as dotenv from 'dotenv';

dotenv.config();

export function SafeEnvVar(varName: keyof NodeJS.ProcessEnv) {
  const value = process.env[varName];
  if (value === undefined) {
    throw new Error(`Environment variable ${varName} is not set.`);
  }
  return value;
}

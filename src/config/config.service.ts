import * as dotenv from 'dotenv';
import * as fs from 'fs';

export class ConfigService {
  JWT_SECRET: string;
  public readonly envConfig: { [key: string]: string };

  constructor() {
    this.envConfig = {
      ...process.env,
      ...(process.env.NODE_ENV === 'production'
        ? {}
        : dotenv.parse(fs.readFileSync('.env'))),
    };
  }

  get(key: string, throwError = true): any {
    if (!this.envConfig[key] && throwError) {
      throw new Error(key + ' - Config value is invalid.');
    } else {
      const configVal = this.envConfig[key];
      if (
        configVal === 'true' ||
        (typeof configVal === 'boolean' && configVal === true)
      ) {
        return true;
      }
      if (
        configVal === 'false' ||
        (typeof configVal === 'boolean' && configVal === false)
      ) {
        return false;
      }

      return configVal === '' ? undefined : configVal;
    }
  }
}

import * as dotenv from 'dotenv';
import * as fs from 'fs';

export class ConfigService {
  JWT_SECRET: string;
  private readonly env: { [key: string]: string };

  constructor() {
    this.env = {
      ...process.env,
      ...(process.env.NODE_ENV === 'production'
        ? {}
        : dotenv.parse(fs.readFileSync('.env'))),
    };
  }

  get(key: string, throwError = true): any {
    if (!this.env[key] && throwError) {
      throw new Error(`${key} - Config value is invalid.`);
    } else {
      const value = this.env[key];
      if (value === 'true' || (typeof value === 'boolean' && value === true)) {
        return true;
      }
      if (
        value === 'false' ||
        (typeof value === 'boolean' && value === false)
      ) {
        return false;
      }

      return value === '' ? undefined : value;
    }
  }

  allowedHeaders() {
    const clientOrigins: string = this.get('CLIENT_ORIGINS');
    return clientOrigins
      .split(',')
      .filter(Boolean)
      .map((origin) => origin.trim());
  }
}

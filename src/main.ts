import { NestFactory } from '@nestjs/core';
import * as cookieParser from 'cookie-parser';
import { Logger, LoggerErrorInterceptor } from 'nestjs-pino';
import { AppModule } from './app.module';
import { ConfigService } from './config/config.service';
import { PrismaClientExceptionFilter } from './common/filters/prisma-client-exception-filter';

async function bootstrap() {
  const config = new ConfigService();
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  app.useGlobalInterceptors(new LoggerErrorInterceptor());
  app.useLogger(app.get(Logger));
  app.use(cookieParser());
  app.enableCors({
    origin: config.allowedHeaders(),
    allowedHeaders:
      'X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept, Observe',
    methods: 'GET,PUT,POST,DELETE,UPDATE,OPTIONS',
    credentials: true,
  });

  app.useGlobalFilters(new PrismaClientExceptionFilter());

  const PORT = +config.get('PORT');
  await app.listen(PORT, () => console.log('Server running on :' + PORT));
}

bootstrap();

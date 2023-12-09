import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from './config/config.service';
import { PrismaClientExceptionFilter } from './common/filters/prisma-client-exception-filter';

async function bootstrap() {
  const config = new ConfigService();
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  app.useGlobalFilters(new PrismaClientExceptionFilter());

  const PORT = +config.get('PORT');
  await app.listen(PORT, () => console.log('Server running on :' + PORT));
}

bootstrap();

import 'reflect-metadata';
import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { applicationConfiguration } from './config/application.config';
import { ApiExceptionFilter } from './common/api-exception.filter';
async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const config = applicationConfiguration();
  app.use(helmet());
  app.enableCors({ origin: config.corsOrigins, credentials: false });
  app.setGlobalPrefix(config.apiPrefix);
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }));
  app.useGlobalFilters(new ApiExceptionFilter());
  app.enableShutdownHooks();
  const document = new DocumentBuilder().setTitle('Jewelry Commerce API').setVersion('1.0').addBearerAuth().build();
  SwaggerModule.setup('api-reference', app, SwaggerModule.createDocument(app, document));
  await app.listen(config.port, '127.0.0.1');
}
void bootstrap().catch((error: unknown) => {
  Logger.error(error instanceof Error ? error.stack : 'Application failed to start', 'Bootstrap');
  process.exitCode = 1;
});

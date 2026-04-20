import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CORS 配置：允许 Vercel 前端访问
  app.enableCors({
    origin: (origin, callback) => {
      // 允许无 origin 的请求（如 curl、移动端）
      if (!origin) return callback(null, true);
      
      // 允许 Vercel 部署域名
      if (
        origin === 'https://kiwidiscover-frontend.vercel.app' ||
        origin.match(/^https:\/\/kiwidiscover-frontend-[\w-]+\.vercel\.app$/)
      ) {
        return callback(null, true);
      }
      
      // 开发环境
      if (origin.startsWith('http://localhost:')) {
        return callback(null, true);
      }
      
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`🚀 KidWeekend API running on http://localhost:${port}`);
}
bootstrap();

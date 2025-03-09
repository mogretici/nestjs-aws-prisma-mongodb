import { Module } from '@nestjs/common';
import appConfig from '@config/app.config';
import { ConfigModule } from '@nestjs/config';
import swaggerConfig from '@config/swagger.config';
import HealthModule from '@modules/health/health.module';
import { AuthModule } from '@modules/auth/auth.module';
import jwtConfig from '@config/jwt.config';
import { APP_GUARD } from '@nestjs/core';
import { AuthGuard } from '@modules/auth/auth.guard';
import { JwtModule, JwtService } from '@nestjs/jwt';
import s3Config from '@config/s3.config';
import { TokenService } from '@modules/auth/token.service';
import { TokenRepository } from '@modules/auth/token.repository';
import { BackendPrismaModule } from 'src/providers/prisma/backend-prisma';
import S3Module from '@providers/s3/s3.module';
import { UserRepository } from '@modules/user/user.repository';

@Module({
	controllers: [],
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
			load: [appConfig, swaggerConfig, jwtConfig, s3Config],
		}),
		JwtModule.register({
			global: true,
		}),
		S3Module,
		BackendPrismaModule,
		HealthModule,
		AuthModule,
	],
	providers: [
		TokenService,
		JwtService,
		TokenRepository,
		UserRepository,
		{
			provide: APP_GUARD,
			useClass: AuthGuard,
		},
	],
})
export class AppModule {}

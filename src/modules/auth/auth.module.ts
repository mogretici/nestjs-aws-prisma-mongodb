import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UserRepository } from '@modules/user/user.repository';
import { TokenRepository } from '@modules/auth/token.repository';
import { TokenService } from '@modules/auth/token.service';

@Module({
  controllers: [AuthController],
  providers: [AuthService, TokenService, UserRepository, TokenRepository],
})
export class AuthModule {}

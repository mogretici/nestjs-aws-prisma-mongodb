import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import ApiBaseResponses from '@decorators/api-base-response.decorator';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthService } from '@modules/auth/auth.service';
import { SkipAuth } from '@modules/auth/skip-auth.guard';
import { SignInDto } from '@modules/auth/dto/sign-in.dto';
import RefreshTokenDto from '@modules/auth/dto/refresh-token.dto';
import { Request, Response } from 'express';

@ApiTags('AUTH')
@ApiBaseResponses()
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiBody({ type: SignInDto })
  @SkipAuth()
  @ApiOperation({
    summary: 'Sign In',
    description: 'Sign In with email and password',
  })
  @Post('login')
  signIn(@Body() signInDto: SignInDto): Promise<Auth.AccessRefreshTokens> {
    return this.authService.signIn(signInDto);
  }

  @ApiBody({ type: RefreshTokenDto })
  @SkipAuth()
  @ApiOperation({
    summary: 'Refresh Token',
    description: 'Refresh Token with refresh token',
  })
  @Post('token/refresh')
  refreshToken(
    @Body() refreshTokenDto: RefreshTokenDto,
  ): Promise<Auth.AccessRefreshTokens | void> {
    return this.authService.refreshTokens(refreshTokenDto.refreshToken);
  }

  @Post('logout')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Logout',
    description: 'Logout user',
  })
  @HttpCode(204)
  async logout(@Req() req: Request) {
    const accessToken = req['user']._meta.accessToken;
    const userId = req['user'].id;
    return this.authService.logout(userId, accessToken);
  }
}

import { Injectable } from '@nestjs/common';
import { BackendPrismaService } from 'src/providers/prisma/backend-prisma';
import { ConfigService } from '@nestjs/config';
import { TokenWhiteList } from '@backendPrisma';

@Injectable()
export class TokenRepository {
  constructor(
    private readonly prisma: BackendPrismaService,
    private readonly configService: ConfigService,
  ) {}

  getAccessTokenFromWhitelist(accessToken: string): Promise<TokenWhiteList> {
    return this.prisma.tokenWhiteList.findFirst({
      where: {
        accessToken,
      },
    });
  }

  getUserAccessTokenFromWhitelist(
    userId: string,
    accessToken: string,
  ): Promise<TokenWhiteList> {
    return this.prisma.tokenWhiteList.findFirst({
      where: {
        userId,
        accessToken,
      },
    });
  }

  deleteAccessTokenFromWhitelist(
    accessTokenId: string,
  ): Promise<TokenWhiteList> {
    return this.prisma.tokenWhiteList.delete({
      where: {
        id: accessTokenId,
      },
    });
  }

  deleteRefreshTokenFromWhitelist(
    refreshTokenId: string,
  ): Promise<TokenWhiteList> {
    return this.prisma.tokenWhiteList.delete({
      where: {
        id: refreshTokenId,
      },
    });
  }

  getRefreshTokenFromWhitelist(refreshToken: string): Promise<TokenWhiteList> {
    return this.prisma.tokenWhiteList.findFirst({
      where: {
        refreshToken,
      },
    });
  }

  async saveAccessTokenToWhitelist(
    userId: string,
    refreshTokenId: string,
    accessToken: string,
  ): Promise<TokenWhiteList> {
    const jwtConfig = this.configService.get('jwt');
    let expiredAt = new Date(Date.now() + jwtConfig.jwtExpAccessToken);
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
    });
    return this.prisma.tokenWhiteList.create({
      data: {
        userId: userId,
        userEmail: user.email,
        refreshTokenId,
        accessToken,
        refreshToken: null,
        expiredAt,
      },
    });
  }

  async saveRefreshTokenToWhitelist(
    userId: string,
    refreshToken: string,
  ): Promise<TokenWhiteList> {
    const jwtConfig = this.configService.get('jwt');
    const expiredAt = new Date(Date.now() + jwtConfig.jwtExpRefreshToken);
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
    });
    return this.prisma.tokenWhiteList.create({
      data: {
        userId: userId,
        userEmail: user.email,
        accessToken: null,
        refreshTokenId: null,
        refreshToken,
        expiredAt,
      },
    });
  }

  removeExpiredTokens(): Promise<{ count: number }> {
    return this.prisma.tokenWhiteList.deleteMany({
      where: {
        expiredAt: {
          lt: new Date(),
        },
      },
    });
  }

  removeUserTokens(userId: string): Promise<{ count: number }> {
    return this.prisma.tokenWhiteList.deleteMany({
      where: {
        userId,
      },
    });
  }
}

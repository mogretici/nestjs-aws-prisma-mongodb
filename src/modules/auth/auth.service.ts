import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { TokenService } from '@modules/auth/token.service';
import { User } from '@backendPrisma';
import { SignInDto } from '@modules/auth/dto/sign-in.dto';
import {
  INVALID_CREDENTIALS,
  NOT_FOUND,
  UNAUTHORIZED_RESOURCE,
} from '@constants/errors.constants';
import { UserRepository } from '@modules/user/user.repository';

@Injectable()
export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly tokenService: TokenService,
  ) {}
  async signIn(signInDto: SignInDto): Promise<Auth.AccessRefreshTokens> {
    const testUser: User = await this.userRepository.findFirst({
      where: {
        email: signInDto.email,
      },
      select: {
        id: true,
        email: true,
        password: true,
      },
    });

    if (!testUser) {
      // 404001: User not found
      throw new NotFoundException(NOT_FOUND);
    }

    if (
      !(await this.tokenService.isPasswordCorrect(
        signInDto.password,
        testUser.password,
      ))
    ) {
      // 401001: Invalid credentials
      throw new UnauthorizedException(INVALID_CREDENTIALS);
    }

    return this.tokenService.sign({
      id: testUser.id,
      email: testUser.email,
    });
  }

  refreshTokens(
    refreshToken: string,
  ): Promise<Auth.AccessRefreshTokens | void> {
    return this.tokenService.refreshTokens(refreshToken);
  }

  logout(userId: string, accessToken: string): Promise<void> {
    return this.tokenService.logout(userId, accessToken);
  }
}

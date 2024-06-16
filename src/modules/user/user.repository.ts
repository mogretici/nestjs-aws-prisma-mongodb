import { Injectable } from '@nestjs/common';
import { BackendPrismaService } from '@prismaService/backend-prisma';
import { User, Prisma as backendPrisma } from '@backendPrisma';
@Injectable()
export class UserRepository {
  constructor(private backendPrisma: BackendPrismaService) {}
  /**
   * @desc Find first user by params
   * @param params Prisma.UserFindFirstArgs
   * @returns Promise<User | null>
   *       If the user is not found, return null
   */
  async findFirst(
    params: backendPrisma.UserFindFirstArgs,
  ): Promise<User | null> {
    return this.backendPrisma.user.findFirst(params);
  }
}

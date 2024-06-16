import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@backendPrisma';

@Injectable()
export class BackendPrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    super();
  }

  async onModuleInit() {
    await this.$connect();
  }
}

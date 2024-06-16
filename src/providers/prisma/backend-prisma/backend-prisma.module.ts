import { Global, Module } from '@nestjs/common';

import { BackendPrismaService } from './backend-prisma.service';

@Global()
@Module({
  providers: [BackendPrismaService],
  exports: [BackendPrismaService],
})
export class BackendPrismaModule {}

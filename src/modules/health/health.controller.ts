import { Controller, Get } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
  MemoryHealthIndicator,
  DiskHealthIndicator,
  HealthCheckResult,
} from '@nestjs/terminus';
import { SkipAuth } from '@modules/auth/skip-auth.guard';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@Controller('health')
@ApiTags('HEALTH')
export default class HealthController {
  constructor(
    private health: HealthCheckService,
    private memory: MemoryHealthIndicator,
    private readonly disk: DiskHealthIndicator,
  ) {}

  @Get('system')
  @SkipAuth()
  @HealthCheck()
  @ApiOperation({
    summary: 'System Health',
    description: 'Check system health',
  })
  check(): Promise<HealthCheckResult> {
    return this.health.check([
      () => ({ info: { status: 'up', message: 'Everything is fine' } }), // Custom health check
    ]);
  }

  @Get('memory')
  @SkipAuth()
  @HealthCheck()
  @ApiOperation({
    summary: 'Memory Health',
    description: 'Check memory health',
  })
  checkMemory(): Promise<HealthCheckResult> {
    return this.health.check([
      () => this.memory.checkHeap('memory_heap', 1400 * 1024 * 1024), // 1400MB threshold
    ]);
  }

  @Get('disk')
  @SkipAuth()
  @HealthCheck()
  @ApiOperation({
    summary: 'Disk Health',
    description: 'Check disk health',
  })
  checkDisk(): Promise<HealthCheckResult> {
    return this.health.check([
      () =>
        this.disk.checkStorage('storage', { path: '/', thresholdPercent: 0.8 }), // 80% threshold
    ]);
  }
}

import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
@ApiTags('Health')
@Controller('health')
export class HealthController {
  @Get()
  @ApiOperation({ summary: 'Process health; does not claim database readiness' })
  getHealth(): { status: string; service: string } {
    return { status: 'ok', service: 'jewelry-commerce-be' };
  }
}

import { BadRequestException,Body,Controller,Post,UseGuards } from '@nestjs/common';
import { ApiBearerAuth,ApiBody,ApiTags } from '@nestjs/swagger';
import { AdminGuard } from '../../auth/adapters/admin.guard';
import { BannerService } from '../application/banner.service';
import { bannerCommandSchema } from '../domain/banner.schema';
@ApiTags('Banner administration')
@ApiBearerAuth()
@UseGuards(AdminGuard)
@Controller('admin/banner')
export class BannerController {
  constructor(private readonly banners:BannerService) {}
  @Post('command')
  @ApiBody({schema:{type:'object',required:['operation'],properties:{operation:{type:'string'},data:{type:'object',additionalProperties:true}}}})
  command(@Body() body:unknown):Promise<unknown> {
    const result=bannerCommandSchema.safeParse(body);
    if(!result.success) throw new BadRequestException({code:'BANNER_VALIDATION_FAILED',message:'Cấu hình banner không hợp lệ.',fieldErrors:result.error.issues});
    return this.banners.command(result.data);
  }
}

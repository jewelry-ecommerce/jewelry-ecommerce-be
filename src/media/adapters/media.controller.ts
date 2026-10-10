import { BadRequestException,Controller,Get,Param,Post,StreamableFile,UploadedFile,UseGuards,UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth,ApiBody,ApiConsumes,ApiTags } from '@nestjs/swagger';
import { AdminGuard } from '../../auth/adapters/admin.guard';
import { MediaService } from '../application/media.service';
import { MEDIA_POLICY } from '../domain/media.config';
@ApiTags('Media')
@Controller('media')
export class MediaController {
  constructor(private readonly media:MediaService) {}
  @Post('upload')
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiBody({schema:{type:'object',properties:{file:{type:'string',format:'binary'}}}})
  @UseInterceptors(FileInterceptor('file',{limits:{fileSize:MEDIA_POLICY.maximumBytes,files:1}}))
  upload(@UploadedFile() file:Express.Multer.File|undefined):Promise<{asset:{id:number;publicUrl:string}}> {
    if(!file) throw new BadRequestException({code:'UPLOAD_FILE_REQUIRED',message:'Vui lòng chọn ảnh.'});
    return this.media.upload(file);
  }
  @Get('files/:key')
  async file(@Param('key') key:string):Promise<StreamableFile> {
    const asset=await this.media.file(key);
    return new StreamableFile(asset.stream,{type:asset.mime,length:asset.length});
  }
}

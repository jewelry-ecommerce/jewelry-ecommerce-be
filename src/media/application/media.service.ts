import { Injectable,NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'node:crypto';
import { MediaRepository } from '../infrastructure/media.repository';
import { LocalMediaStorage } from '../infrastructure/local-media.storage';
import { imageType } from '../domain/media.validation';
import { MEDIA_POLICY } from '../domain/media.config';
import { applicationConfiguration } from '../../config/application.config';
@Injectable()
export class MediaService {
  constructor(private readonly repository:MediaRepository,private readonly storage:LocalMediaStorage,private readonly config:ConfigService) {}
  async upload(file:{buffer:Buffer;originalname:string}):Promise<{asset:{id:number;publicUrl:string}}> {
    const type=imageType(file.buffer);
    const key=randomBytes(24).toString('hex')+'.'+type.extension;
    const base=this.config.get<string>('PUBLIC_BASE_URL');
    if(!base) throw new Error('PUBLIC_BASE_URL is required for upload');
    const publicUrl=base.replace(/\/$/,'')+'/'+applicationConfiguration().apiPrefix+'/media/files/'+key;
    await this.storage.put(key,file.buffer);
    try {
      const asset=await this.repository.save(key,file.originalname,type.mime,file.buffer.length,publicUrl);
      return {asset:{id:asset.id,publicUrl}};
    } catch(error) {await this.storage.remove(key);throw error;}
  }
  async file(key:string) {
    if(!MEDIA_POLICY.keyPattern.test(key)) throw this.notFound();
    const asset=await this.repository.find(key);
    if(!asset) throw this.notFound();
    return {stream:this.storage.stream(key),mime:asset.mime_type,length:Number(asset.byte_size)};
  }
  private notFound():NotFoundException {return new NotFoundException({code:'MEDIA_NOT_FOUND',message:'Không tìm thấy ảnh.'});}
}

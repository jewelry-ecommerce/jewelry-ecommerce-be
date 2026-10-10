import { Module } from '@nestjs/common';
import { MediaController } from './adapters/media.controller';
import { MediaService } from './application/media.service';
import { MediaRepository } from './infrastructure/media.repository';
import { LocalMediaStorage } from './infrastructure/local-media.storage';
@Module({controllers:[MediaController],providers:[MediaService,MediaRepository,LocalMediaStorage]})
export class MediaModule {}

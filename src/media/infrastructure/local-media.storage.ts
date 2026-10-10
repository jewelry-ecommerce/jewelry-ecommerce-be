import { Injectable } from '@nestjs/common';
import { mkdir,writeFile,unlink } from 'node:fs/promises';
import { createReadStream,type ReadStream } from 'node:fs';
import { resolve,join } from 'node:path';
import { MEDIA_POLICY } from '../domain/media.config';
@Injectable()
export class LocalMediaStorage {
  private readonly directory=resolve(process.cwd(),process.env.UPLOAD_DIRECTORY || MEDIA_POLICY.directory);
  async put(key:string,buffer:Buffer):Promise<void> {
    await mkdir(this.directory,{recursive:true});
    await writeFile(this.path(key),buffer,{flag:'wx'});
  }
  async remove(key:string):Promise<void> {await unlink(this.path(key));}
  stream(key:string):ReadStream {return createReadStream(this.path(key));}
  private path(key:string):string {
    if(!MEDIA_POLICY.keyPattern.test(key)) throw new Error('Invalid storage key');
    return join(this.directory,key);
  }
}

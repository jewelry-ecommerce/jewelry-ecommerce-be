import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
export interface MediaAsset {id:number;storage_key:string;mime_type:string;byte_size:string;public_url:string}
@Injectable()
export class MediaRepository {
  constructor(private readonly source:DataSource) {}
  async save(key:string,name:string,mime:string,size:number,url:string):Promise<MediaAsset> {
    const rows=await this.source.query<MediaAsset[]>('INSERT INTO media_assets(storage_key,original_name,mime_type,byte_size,public_url) VALUES($1,$2,$3,$4,$5) RETURNING *',[key,name,mime,size,url]);
    return rows[0]!;
  }
  async find(key:string):Promise<MediaAsset|null> {
    const rows=await this.source.query<MediaAsset[]>('SELECT * FROM media_assets WHERE storage_key=$1 AND deleted_at IS NULL',[key]);
    return rows[0]??null;
  }
}

import { Type } from 'class-transformer';
import { IsArray,IsBoolean,IsEnum,IsInt,IsObject,IsOptional,IsString,Matches,MaxLength,Min,ValidateNested } from 'class-validator';
import { CmsBlockType,CmsStatus } from '../domain/cms.enum';
export class CmsBlockDto {
  @IsOptional() @IsInt() @Min(1) id?:number;
  @IsEnum(CmsBlockType) blockTypeCode!:CmsBlockType;
  @IsInt() @Min(0) sortOrder!:number;
  @IsBoolean() isVisible!:boolean;
  @IsObject() config!:Record<string,unknown>;
}
export class CmsPageDto {
  @IsString() @MaxLength(160) name!:string;
  @IsString() @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/) slug!:string;
  @IsOptional() @IsString() @MaxLength(20) locale?:string;
  @IsEnum(CmsStatus) status!:CmsStatus;
  @IsBoolean() isActive!:boolean;
  @IsOptional() @IsInt() @Min(1) revision?:number;
  @IsObject() seo!:Record<string,unknown>;
  @IsArray() @ValidateNested({each:true}) @Type(()=>CmsBlockDto) blocks!:CmsBlockDto[];
}

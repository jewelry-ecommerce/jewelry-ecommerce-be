import { Transform,Type } from 'class-transformer';
import { ArrayMaxSize,IsArray,IsEnum,IsInt,IsOptional,IsString,Max,Min } from 'class-validator';
import { SKU_QUERY_POLICY,SkuOrderDirection,SkuOrderField } from '../domain/sku-query.interface';
function scopeIds(value:unknown):unknown {
  return typeof value==='string'?value.split(',').map(Number):value;
}
export class SkuQueryDto {
  @IsOptional() @IsString() search?:string;
  @IsOptional() @Type(()=>Number) @IsInt() @Min(1) page?:number;
  @IsOptional() @Type(()=>Number) @IsInt() @Min(1) @Max(SKU_QUERY_POLICY.maximumTake) take?:number;
  @IsOptional() @IsEnum(SkuOrderField) orderBy?:SkuOrderField;
  @IsOptional() @IsEnum(SkuOrderDirection) orderType?:SkuOrderDirection;
  @IsOptional() @Transform(({value}:{value:unknown})=>scopeIds(value)) @IsArray()
  @ArrayMaxSize(SKU_QUERY_POLICY.maximumScopeIds) @IsInt({each:true}) @Min(1,{each:true}) categoryIds?:number[];
  @IsOptional() @Transform(({value}:{value:unknown})=>scopeIds(value)) @IsArray()
  @ArrayMaxSize(SKU_QUERY_POLICY.maximumScopeIds) @IsInt({each:true}) @Min(1,{each:true}) collectionIds?:number[];
}

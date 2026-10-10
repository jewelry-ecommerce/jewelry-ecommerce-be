
import { Transform, Type } from 'class-transformer';
import { IsArray, IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { ProductStatus } from '../domain/catalog.enum';
import { PRODUCT_QUERY_POLICY } from '../domain/product-query.interface';
function idsFromQuery(input:unknown):unknown {
  return typeof input === 'string' ? input.split(',').map(Number) : input;
}
export class ProductQueryDto {
  @IsOptional() @IsString() search?:string;
  @IsOptional() @IsEnum(ProductStatus) status?:ProductStatus;
  @IsOptional() @Type(()=>Number) @IsInt() @Min(1) categoryId?:number;
  @IsOptional() @Type(()=>Number) @IsInt() @Min(1) page?:number;
  @IsOptional() @Type(()=>Number) @IsInt() @Min(1) @Max(PRODUCT_QUERY_POLICY.maximumTake) take?:number;
  @IsOptional() @Transform(({value}:{value:unknown})=>idsFromQuery(value)) @IsArray() @IsInt({each:true}) @Min(1,{each:true}) productIds?:number[];
}

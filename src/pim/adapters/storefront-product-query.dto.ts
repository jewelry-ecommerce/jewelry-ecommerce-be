
import { Transform,Type } from 'class-transformer';
import { IsArray,IsInt,IsOptional,IsString,Max,Min } from 'class-validator';
import { PRODUCT_QUERY_POLICY } from '../domain/product-query.interface';
export class StorefrontProductQueryDto {
  @IsOptional() @Type(()=>Number) @IsInt() @Min(1) page?:number;
  @IsOptional() @Type(()=>Number) @IsInt() @Min(1) @Max(PRODUCT_QUERY_POLICY.maximumTake) take?:number;
  @IsOptional() @IsString() search?:string;
  @IsOptional() @IsString() collectionSlug?:string;
  @IsOptional() @IsString() categorySlug?:string;
  @IsOptional() @Transform(({value}:{value:unknown})=>typeof value==='string'?value.split(',').map(Number):value)
    @IsArray() @IsInt({each:true}) @Min(1,{each:true}) productIds?:number[];
}

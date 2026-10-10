import { Type } from 'class-transformer';
import { IsArray,IsEnum,IsInt,IsNumber,IsOptional,IsString,Max,MaxLength,Min,ValidateNested,ArrayMinSize,IsUrl } from 'class-validator';
import { ProductStatus,SkuStatus } from '../domain/catalog.enum';
import { PIM_POLICY } from '../domain/product.validation';
import { ProductUnitOfMeasure } from '../domain/product-presentation.interface';
export class ProductAttributeDto {
  @IsInt() @Min(1) attributeId!:number;
  @IsArray() @ArrayMinSize(1) @IsInt({each:true}) @Min(1,{each:true}) valueIds!:number[];
}
export class ProductSkuDto {
  @IsOptional() @IsInt() @Min(1) id?:number;
  @IsOptional() @IsNumber() @Min(0) @Max(100) taxRateOverride?:number|null;
  @IsOptional() @IsInt() @Min(0) @Max(PIM_POLICY.maximumSafeMoney) b2bWholesalePriceAfterTax?:number|null;
  @IsString() @MaxLength(100) skuCode!:string;
  @IsEnum(SkuStatus) status!:SkuStatus;
  @IsArray() @IsInt({each:true}) @Min(1,{each:true}) attributeValueIds!:number[];
  @IsArray() @IsUrl({require_tld:false,protocols:['http','https'],require_protocol:true},{each:true}) medias!:string[];
  @IsInt() @Min(0) @Max(PIM_POLICY.maximumSafeMoney) sellingPriceAfterTaxMinor!:number;
  @IsOptional() @IsInt() @Min(0) @Max(PIM_POLICY.maximumSafeMoney) compareAtPriceAfterTaxMinor?:number|null;
  @IsOptional() @IsInt() @Min(0) @Max(PIM_POLICY.maximumSafeMoney) costPriceAfterTaxMinor?:number|null;
  @IsOptional() @IsInt() @Min(0) onHand?:number;
  @IsOptional() @IsNumber() @Min(0) weight?:number;
  @IsOptional() @IsNumber() @Min(0) length?:number;
  @IsOptional() @IsNumber() @Min(0) width?:number;
  @IsOptional() @IsNumber() @Min(0) height?:number;
}
export class ProductInfoDto {
  @IsOptional() @IsString() title?:string;
  @IsString() description!:string;
  @IsInt() @Min(0) sortOrder!:number;
}
export class ProductWriteDto {
  @IsOptional() @IsEnum(ProductUnitOfMeasure) unitOfMeasure?:ProductUnitOfMeasure;
  @IsOptional() @IsNumber() @Min(0) @Max(100) taxRateOverride?:number|null;
  @IsOptional() @IsNumber() @Min(0) weight?:number;
  @IsOptional() @IsNumber() @Min(0) length?:number;
  @IsOptional() @IsNumber() @Min(0) width?:number;
  @IsOptional() @IsNumber() @Min(0) height?:number;
  @IsOptional() @IsArray() @IsInt({each:true}) @Min(1,{each:true}) productMixMatch?:number[];
  @IsString() @MaxLength(100) spuCode!:string;
  @IsString() @MaxLength(255) name!:string;
  @IsInt() @Min(1) categoryId!:number;
  @IsOptional() @IsString() @MaxLength(255) slug?:string;
  @IsOptional() @IsString() description?:string;
  @IsString() @MaxLength(100) defaultSkuCode!:string;
  @IsArray() @ValidateNested({each:true}) @Type(()=>ProductAttributeDto) attributes!:ProductAttributeDto[];
  @IsArray() @ArrayMinSize(PIM_POLICY.minimumVariants) @ValidateNested({each:true}) @Type(()=>ProductSkuDto) skus!:ProductSkuDto[];
  @IsOptional() @IsArray() @ValidateNested({each:true}) @Type(()=>ProductInfoDto) productInfos?:ProductInfoDto[];
  @IsOptional() @IsString() metaTitle?:string;
  @IsOptional() @IsString() metaDescription?:string;
  @IsOptional() @IsString() metaKeywords?:string;
}
export class ProductStatusDto { @IsEnum(ProductStatus) status!:ProductStatus }

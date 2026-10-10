import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsEnum, IsInt, IsOptional, IsString, Max, MaxLength, Min, ValidateNested, IsNumber } from 'class-validator';
import { AttributeDisplayType, CatalogStatus } from '../domain/catalog.enum';
export class AttributeValueDto {
  @IsString() @MaxLength(255) value!: string;
  @IsString() @MaxLength(100) code!: string;
  @IsOptional() @IsString() image?: string;
}
export class CatalogWriteDto {
  @IsString() @MaxLength(255) name!: string;
  @IsOptional() @IsString() @MaxLength(100) code?: string;
  @IsOptional() @IsString() @MaxLength(255) slug?: string;
  @IsEnum(CatalogStatus) status!: CatalogStatus;
  @IsOptional() @IsEnum(AttributeDisplayType) displayType?: AttributeDisplayType;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) parentId?: number | null;
  @IsOptional() @IsBoolean() isDisplay?: boolean;
  @IsOptional() @IsNumber() @Min(0) @Max(100) taxRate?: number;
  @IsOptional() @IsString() logo?: string;
  @IsOptional() @IsString() image?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsBoolean() isVariantAxis?: boolean;
  @IsOptional() @IsArray() @IsInt({ each: true }) @Min(1,{ each: true }) directAttributeIds?: number[];
  @IsOptional() @IsArray() @IsInt({ each: true }) @Min(1,{ each: true }) productIds?: number[];
  @IsOptional() @IsString() metaTitle?: string;
  @IsOptional() @IsString() metaDescription?: string;
  @IsOptional() @IsString() metaKeywords?: string;
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => AttributeValueDto) values?: AttributeValueDto[];
}
export class CatalogQueryDto {
  @IsOptional() @IsString() search?: string;
  @IsOptional() @IsEnum(CatalogStatus) status?: CatalogStatus;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) take?: number;
}

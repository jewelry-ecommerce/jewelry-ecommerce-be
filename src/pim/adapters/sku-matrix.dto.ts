
import { Type } from 'class-transformer';
import { ArrayMaxSize,ArrayMinSize,IsArray,IsInt,Min,ValidateNested } from 'class-validator';
import { MATRIX_POLICY } from '../domain/sku-matrix.interface';
export class MatrixAxisDto {
  @IsInt() @Min(1) attributeId!:number;
  @IsArray() @ArrayMinSize(1) @IsInt({each:true}) @Min(1,{each:true}) valueIds!:number[];
}
export class MatrixDto {
  @IsArray() @ArrayMinSize(1) @ArrayMaxSize(MATRIX_POLICY.maximumAxes) @ValidateNested({each:true}) @Type(()=>MatrixAxisDto) attributes!:MatrixAxisDto[];
}


import { BadRequestException } from '@nestjs/common';
import { MATRIX_POLICY, type MatrixInput, type MatrixNode, type MatrixAttribute, type MatrixValue, type MatrixView } from './sku-matrix.interface';
export function validateMatrixInput(input:MatrixInput):void {
  const axes=input.attributes;
  if(!axes.length || axes.length>MATRIX_POLICY.maximumAxes) throw invalid('SKU_MATRIX_AXES_INVALID','Số thuộc tính ma trận không hợp lệ.');
  if(new Set(axes.map(axis=>axis.attributeId)).size!==axes.length) throw invalid('SKU_MATRIX_AXIS_DUPLICATE','Thuộc tính ma trận bị trùng.');
  let combinations=1;
  for(const axis of axes) {
    if(!axis.valueIds.length || new Set(axis.valueIds).size!==axis.valueIds.length) throw invalid('SKU_MATRIX_VALUES_INVALID','Giá trị ma trận bị trùng hoặc trống.');
    combinations*=axis.valueIds.length;
  }
  if(combinations>MATRIX_POLICY.maximumCombinations) throw invalid('SKU_MATRIX_TOO_LARGE','Ma trận có quá nhiều tổ hợp biến thể.');
}
export function buildSkuMatrix(input:MatrixInput,attributes:MatrixAttribute[],values:MatrixValue[]):MatrixView {
  validateMatrixInput(input);
  for(const axis of input.attributes) {
    if(!attributes.some(attribute=>attribute.id===axis.attributeId)) throw invalid('SKU_MATRIX_ATTRIBUTE_NOT_FOUND','Thuộc tính không tồn tại hoặc đã bị tắt.');
    if(axis.valueIds.some(id=>!values.some(value=>value.id===id && value.attributeId===axis.attributeId))) {
      throw invalid('SKU_MATRIX_VALUE_NOT_OWNED','Giá trị không thuộc thuộc tính đã chọn.');
    }
  }
  return {attributeOrder:input.attributes.map(axis=>axis.attributeId),
    attributes:Object.fromEntries(attributes.map(attribute=>[String(attribute.id),attribute])),
    values:Object.fromEntries(values.map(value=>[String(value.id),value])),matrix:matrixLevel(input,0,[])};
}
function matrixLevel(input:MatrixInput,depth:number,path:string[]):MatrixNode[] {
  const axis=input.attributes[depth];
  if(!axis) return [];
  return axis.valueIds.map(valueId=>{
    const next=[...path,axis.attributeId+':'+valueId],leaf=depth===input.attributes.length-1;
    return {valueId,children:leaf?[]:matrixLevel(input,depth+1,next),canonicalKey:leaf?next.join('|'):null};
  });
}
function invalid(code:string,message:string):BadRequestException {return new BadRequestException({code,message});}

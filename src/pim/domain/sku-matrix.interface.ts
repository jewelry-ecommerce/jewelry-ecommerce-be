
export interface MatrixAttributeInput {attributeId:number;valueIds:number[]}
export interface MatrixInput {attributes:MatrixAttributeInput[]}
export interface MatrixAttribute {id:number;name:string;code:string}
export interface MatrixValue {id:number;attributeId:number;name:string;code:string;image?:string}
export interface MatrixNode {valueId:number;children:MatrixNode[];canonicalKey:string|null}
export interface MatrixView {
  attributeOrder:number[];attributes:Record<string,MatrixAttribute>;values:Record<string,MatrixValue>;matrix:MatrixNode[];
}
export const MATRIX_POLICY = {maximumAxes:8,maximumCombinations:256} as const;

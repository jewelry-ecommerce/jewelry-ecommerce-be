import { BadRequestException } from '@nestjs/common';
import type { ProductWriteInput } from './product.interface';
import { SkuStatus } from './catalog.enum';
export const PIM_POLICY = { maximumSafeMoney: Number.MAX_SAFE_INTEGER, minimumVariants: 1 } as const;
export function validateProduct(input: ProductWriteInput): void {
  if (!input.skus.length) throw invalid('PRODUCT_SKU_REQUIRED','Sản phẩm phải có ít nhất một SKU.');
  const codes = input.skus.map(sku => sku.skuCode.trim().toUpperCase());
  if (new Set(codes).size !== codes.length) throw invalid('PRODUCT_SKU_DUPLICATE','Mã SKU bị trùng.');
  if (!codes.includes(input.defaultSkuCode.trim().toUpperCase())) throw invalid('PRODUCT_DEFAULT_SKU_INVALID','SKU mặc định không thuộc sản phẩm.');
  const axisIds = input.attributes.map(attribute => attribute.attributeId);
  if (new Set(axisIds).size !== axisIds.length) throw invalid('PRODUCT_ATTRIBUTE_DUPLICATE','Thuộc tính bị trùng.');
  const allowed = new Set(input.attributes.flatMap(attribute => attribute.valueIds));
  for (const sku of input.skus) {
    if (sku.attributeValueIds.some(id => !allowed.has(id))) throw invalid('SKU_VALUE_NOT_SELECTED','SKU dùng giá trị chưa được chọn cho sản phẩm.');
    if (new Set(sku.attributeValueIds).size !== sku.attributeValueIds.length) throw invalid('SKU_VALUE_DUPLICATE','Giá trị thuộc tính SKU bị trùng.');
    if (sku.compareAtPriceAfterTaxMinor !== null && sku.compareAtPriceAfterTaxMinor !== undefined && sku.compareAtPriceAfterTaxMinor < sku.sellingPriceAfterTaxMinor) {
      throw invalid('SKU_COMPARE_PRICE_INVALID','Giá so sánh không được nhỏ hơn giá bán.');
    }
  }
  validateSkuAxes(input);
}
export function validatePublish(skus: { status: SkuStatus; hasMedia: boolean; isDefault: boolean }[]): void {
  const representative = skus.find(sku => sku.isDefault);
  if (!representative || representative.status !== SkuStatus.ACTIVE || !representative.hasMedia) {
    throw invalid('PRODUCT_DEFAULT_SKU_NOT_READY','SKU mặc định phải đang hoạt động và có ảnh.');
  }
}
function invalid(code: string, message: string): BadRequestException { return new BadRequestException({code,message}); }

function validateSkuAxes(input:ProductWriteInput):void {
  if(!input.name.trim() || !input.spuCode.trim()) throw invalid("PRODUCT_NAME_CODE_REQUIRED","Tên và mã sản phẩm không được trống.");
  const combinations=new Set<string>();
  for(const attribute of input.attributes) {
    if(!attribute.valueIds.length || new Set(attribute.valueIds).size!==attribute.valueIds.length) {
      throw invalid("PRODUCT_ATTRIBUTE_VALUES_INVALID","Giá trị thuộc tính phải đầy đủ và không trùng.");
    }
  }
  for(const sku of input.skus) {
    if(!sku.skuCode.trim()) throw invalid("PRODUCT_SKU_CODE_REQUIRED","Mã SKU không được trống.");
    if(input.attributes.some(attribute=>sku.attributeValueIds.filter(id=>attribute.valueIds.includes(id)).length!==1)) {
      throw invalid("PRODUCT_SKU_COMBINATION_INVALID","Mỗi SKU cần một giá trị cho mỗi thuộc tính.");
    }
    const key=[...sku.attributeValueIds].sort((left,right)=>left-right).join(":");
    if(combinations.has(key)) throw invalid("PRODUCT_SKU_COMBINATION_DUPLICATE","Hai SKU không được có cùng tổ hợp thuộc tính.");
    combinations.add(key);
  }
}

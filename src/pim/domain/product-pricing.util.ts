
import type { ProductAggregate, VariationRow } from './product.interface';
export function skuTaxPricing(aggregate:ProductAggregate,sku:VariationRow) {
  const categoryRate=aggregate.category?.taxRate??0;
  const productRate=aggregate.product.tax_rate_override===null?null:Number(aggregate.product.tax_rate_override);
  const skuRate=sku.metadata.taxRateOverride??null;
  const effectiveRate=skuRate??productRate??categoryRate;
  const beforeTax=(amount:string|null):number|null=>amount===null?null:Math.round(Number(amount)/(1+effectiveRate/100));
  return {categoryTaxRate:categoryRate,productTaxRateOverride:productRate,skuTaxRateOverride:skuRate,
    taxRateOverride:skuRate,effectiveTaxRate:effectiveRate,taxSource:skuRate!==null?'SKU':productRate!==null?'PRODUCT':'CATEGORY',
    sellingPriceBeforeTaxMinor:beforeTax(sku.selling_price_minor),compareAtPriceBeforeTaxMinor:beforeTax(sku.compare_at_price_minor),
    costPriceBeforeTaxMinor:beforeTax(sku.cost_price_minor),b2bWholesalePriceAfterTax:sku.metadata.b2bWholesalePriceAfterTax??null};
}

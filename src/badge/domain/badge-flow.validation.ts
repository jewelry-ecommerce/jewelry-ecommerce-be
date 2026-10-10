import { BadRequestException } from '@nestjs/common';
import { BadgeRuleType,type BadgeFlowInput } from './badge-flow.schema';
export function validateBadgeFlow(input:BadgeFlowInput):void {
  const {ruleType,ruleConfig}=input;
  if(input.activeFrom&&input.activeTo&&Date.parse(input.activeTo)<=Date.parse(input.activeFrom)) fail('Thời gian kết thúc phải sau thời gian bắt đầu.');
  if(ruleType===BadgeRuleType.PROMOTION) fail('Khuyến mãi chưa nằm trong bản demo hiện tại.');
  if(ruleType===BadgeRuleType.MANUAL&&!ruleConfig.targets?.length) fail('Cần chọn sản phẩm/SKU áp dụng.');
  if(ruleType===BadgeRuleType.CATEGORY&&!ruleConfig.categories?.length&&!ruleConfig.categoryIds?.length) fail('Cần chọn danh mục áp dụng.');
  if(ruleType===BadgeRuleType.COLLECTION&&!ruleConfig.collections?.length&&!ruleConfig.collectionIds?.length) fail('Cần chọn bộ sưu tập áp dụng.');
}
function fail(message:string):never {throw new BadRequestException({code:'BADGE_SCOPE_INVALID',message});}

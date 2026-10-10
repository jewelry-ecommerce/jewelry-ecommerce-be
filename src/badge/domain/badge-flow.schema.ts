import { z } from 'zod';
import { BadgeStatus } from './badge.enum';
export enum BadgeRuleType { ALL='ALL',MANUAL='MANUAL',CATEGORY='CATEGORY',COLLECTION='COLLECTION',PROMOTION='PROMOTION',OUT_OF_STOCK='OUT_OF_STOCK' }
export enum BadgeChannel { ALL='ALL',WEB='WEB',MOBILE_WEB='MOBILE_WEB',APP='APP' }
export const BADGE_FLOW_POLICY={maximumTemplates:1,maximumSkus:100,outOfStockThreshold:1,priority:{PRE_ORDER:3,OUT_OF_STOCK:2,CAMPAIGN:1}} as const;
const id=z.number().int().positive();
const metadata={name:z.string().optional(),imageUrl:z.string().optional()};
export const badgeRuleConfigSchema=z.object({
  categories:z.array(z.object({categoryId:id,...metadata}).strict()).optional(),categoryIds:z.array(id).optional(),
  collections:z.array(z.object({collectionId:id,...metadata}).strict()).optional(),collectionIds:z.array(id).optional(),
  targets:z.array(z.object({productId:id,productVariantId:id,skuCode:z.string().optional(),
    productVariantName:z.string().optional(),productVariantImageUrl:z.string().optional()}).strict()).optional(),
  minStock:z.literal(BADGE_FLOW_POLICY.outOfStockThreshold).optional(),
}).strict();
const date=z.iso.datetime({offset:true}).nullable().optional();
export const badgeFlowSchema=z.object({
  name:z.string().trim().min(1).max(160),description:z.string().nullable().optional(),
  ruleType:z.enum(BadgeRuleType),ruleConfig:badgeRuleConfigSchema.default({}),
  channel:z.enum(BadgeChannel).default(BadgeChannel.ALL),
  status:z.enum([BadgeStatus.DRAFT,BadgeStatus.ACTIVE,BadgeStatus.INACTIVE]).default(BadgeStatus.DRAFT),
  activeFrom:date,activeTo:date,
  templates:z.array(z.object({badgeTemplateId:id,priorityWeight:z.number().int().default(0),isPinned:z.boolean().default(false)}).strict())
    .min(1).max(BADGE_FLOW_POLICY.maximumTemplates),
}).strict();
export const badgeFlowPatchSchema=badgeFlowSchema.partial().extend({
  ruleConfig:badgeRuleConfigSchema.optional(),channel:z.enum(BadgeChannel).optional(),
  status:z.enum([BadgeStatus.DRAFT,BadgeStatus.ACTIVE,BadgeStatus.INACTIVE]).optional(),
});
export type BadgeFlowInput=z.infer<typeof badgeFlowSchema>;
export type BadgeRuleConfig=z.infer<typeof badgeRuleConfigSchema>;
export interface BadgeFlowRow extends Omit<BadgeFlowInput,'templates'> {id:number;createdAt:string;updatedAt:string}
export interface BadgeFlowLink {id:number;flowId:number;badgeTemplateId:number;priorityWeight:number;isPinned:boolean}

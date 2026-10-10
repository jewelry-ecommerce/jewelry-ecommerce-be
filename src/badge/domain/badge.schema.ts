import { z } from 'zod';
import { BadgeType,BadgeStatus,BadgePosition,BadgePurpose } from './badge.enum';
export const BADGE_POLICY={defaultPosition:BadgePosition.TOP_LEFT,defaultPriority:0,firstPage:1,defaultTake:20,maximumTake:100,maximumId:2147483647} as const;
const optionalAsset=z.string().nullable().optional();
export const badgeTemplateSchema=z.object({
  name:z.string().trim().min(1).max(160),code:z.string().trim().min(1).max(100),type:z.enum(BadgeType),
  badgeType:z.enum(BadgePurpose),status:z.enum(BadgeStatus).default(BadgeStatus.DRAFT),
  defaultPosition:z.enum(BadgePosition).default(BADGE_POLICY.defaultPosition),
  displayText:z.string().max(120).nullable().optional(),description:z.string().nullable().optional(),
  styleConfig:z.record(z.string(),z.unknown()).nullable().optional(),icon:optionalAsset,image:optionalAsset,
  iconMobile:optionalAsset,imageMobile:optionalAsset,assetMeta:z.record(z.string(),z.unknown()).optional(),
  defaultPriorityWeight:z.number().int().default(BADGE_POLICY.defaultPriority),
}).strict();
export const badgePatchSchema=badgeTemplateSchema.partial().extend({
  status:z.enum(BadgeStatus).optional(),defaultPosition:z.enum(BadgePosition).optional(),defaultPriorityWeight:z.number().int().optional(),
});
export const badgeStatusSchema=z.object({status:z.enum(BadgeStatus)}).strict();
export const badgeQuerySchema=z.object({
  search:z.string().optional(),status:z.enum(BadgeStatus).optional(),type:z.enum(BadgeType).optional(),
  badgeType:z.enum(BadgePurpose).optional(),defaultPosition:z.enum(BadgePosition).optional(),
  page:z.coerce.number().int().min(1).default(BADGE_POLICY.firstPage),
  take:z.coerce.number().int().min(1).max(BADGE_POLICY.maximumTake).default(BADGE_POLICY.defaultTake),
}).strict();
export type BadgeTemplateInput=z.infer<typeof badgeTemplateSchema>;
export type BadgeTemplateQuery=z.infer<typeof badgeQuerySchema>;
export interface BadgeTemplateView extends BadgeTemplateInput {
  id:number;createdAt:string;updatedAt:string;isSystem:boolean;assignments:unknown[];rules:unknown[];
}

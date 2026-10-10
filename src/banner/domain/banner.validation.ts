import { BadRequestException } from '@nestjs/common';
import type { BannerDemoStore,BannerDemoCommand } from './banner.schema';
type CreateLayout=Extract<BannerDemoCommand,{operation:'postPlacementLayout'}>;
export function validateLayout(store:BannerDemoStore,command:CreateLayout):void {
  const placement=store.placements.find(value=>value.id===command.placementId);
  if(!placement) throw invalid('PLACEMENT_NOT_FOUND','Vị trí banner không tồn tại.');
  if(new Set(command.data.items.map(entry=>entry.slotKey)).size!==command.data.items.length) {
    throw invalid('DUPLICATE_SLOT','Vị trí ô banner bị trùng.');
  }
  if(placement.displayType==='DOUBLE_BANNER' && command.data.items.length!==2) throw invalid('DOUBLE_SLOT_REQUIRED','Banner hai khung phải có đúng hai ô.');
  for(const entry of command.data.items) {
    if(!store.banners.some(value=>value.id===entry.bannerId)) throw invalid('BANNER_NOT_FOUND','Ảnh banner không tồn tại.');
    const position=entry.displayMetadata;
    if(position && (position.x<0 || position.y<0 || ![position.x,position.y,position.width,position.height].every(Number.isInteger))) {
      throw invalid('BANNER_SLOT_INVALID','Tọa độ và kích thước ô phải là số nguyên hợp lệ.');
    }
  }
}
function invalid(code:string,message:string):BadRequestException {return new BadRequestException({code,message});}

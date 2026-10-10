import { BadRequestException,ConflictException,Injectable,NotFoundException } from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { BannerRepository } from '../infrastructure/banner.repository';
import { bannerRecordSchema,placementRecordSchema,layoutItemRecordSchema,layoutRecordSchema,type BannerDemoStore,type BannerDemoCommand,type DemoLayout } from '../domain/banner.schema';
import { BANNER_DEFAULTS } from '../domain/banner.config';
import { placementView } from '../domain/banner.mapper';
import { validateLayout } from '../domain/banner.validation';
@Injectable()
export class BannerService {
  constructor(private readonly repository:BannerRepository) {}
  async command(command:BannerDemoCommand):Promise<unknown> {
    const store=await this.store();
    try {
      switch(command.operation) {
        case 'getPlacementList':return this.listPlacements(store,command);
        case 'postPlacement':return this.createPlacement(command);
        case 'patchPlacement':this.requireId(store.placements,command.id);return this.savePlacement(command);
        case 'deletePlacement':this.requireId(store.placements,command.id);await this.repository.deletePlacement(command.id);return {success:true};
        case 'getPlacementLayoutList':this.requireId(store.placements,command.placementId);return store.layouts.filter(value=>value.placementId===command.placementId).map(value=>this.enrich(store,value));
        case 'getPlacementLayoutDetail':return this.enrich(store,this.layout(store,command.placementId,command.layoutId));
        case 'postPlacementLayout':validateLayout(store,command);return this.savedLayout(command.placementId,await this.repository.saveLayout(command));
        case 'patchPlacementLayoutItem':return this.saveItem(store,command);
        case 'postBanner':return this.createBanner(command);
        case 'patchBanner':this.requireId(store.banners,command.id);return this.saveBanner(command);
      }
    } catch(error) {
      if(typeof error==='object' && error!==null && 'code'in error && error.code==='23505') throw new ConflictException({code:'BANNER_DUPLICATE',message:'Mã hoặc slot banner bị trùng.'});
      throw error;
    }
  }
  async render(code:string):Promise<Record<string,unknown>> {
    const placement=placementView(await this.store(),code);
    if(!placement) throw new NotFoundException({code:'PLACEMENT_NOT_FOUND',message:'Vị trí banner không tồn tại hoặc chưa hoạt động.'});
    return placement;
  }
  private async store():Promise<BannerDemoStore> {
    const [banners,placements,layouts,items]=await Promise.all([
      this.repository.rows('banners'),this.repository.rows('banner_placements'),
      this.repository.rows('banner_placement_layouts'),this.repository.rows('banner_layout_items'),
    ]);
    const parsedItems=items.map(value=>layoutItemRecordSchema.parse(value));
    return {
      banners:banners.map(value=>bannerRecordSchema.parse({...value,overlayOpacity:Number(value.overlayOpacity)})),
      placements:placements.map(value=>placementRecordSchema.parse(value)),
      layouts:layouts.map(value=>layoutRecordSchema.parse({...value,items:parsedItems.filter(entry=>entry.placementLayoutId===value.id)})),
    };
  }
  private requireId<T extends {id:number}>(values:T[],id:number):T {
    const value=values.find(entry=>entry.id===id);
    if(!value) throw new NotFoundException({code:'BANNER_RESOURCE_NOT_FOUND',message:'Không tìm thấy cấu hình banner.'});
    return value;
  }
  private layout(store:BannerDemoStore,placementId:number,layoutId:number):DemoLayout {
    const layout=this.requireId(store.layouts,layoutId);
    if(layout.placementId!==placementId) throw new NotFoundException({code:'LAYOUT_NOT_OWNED',message:'Cấu hình không thuộc vị trí này.'});
    return layout;
  }
  private enrich(store:BannerDemoStore,layout:DemoLayout):Record<string,unknown> {
    return {...layout,placement:this.requireId(store.placements,layout.placementId),
      items:layout.items.map(entry=>({...entry,layout:{id:layout.id,name:layout.name},banner:this.requireId(store.banners,entry.bannerId)}))};
  }
  private async savedLayout(placementId:number,layoutId:number):Promise<unknown> {
    const store=await this.store();return this.enrich(store,this.layout(store,placementId,layoutId));
  }
  private listPlacements(store:BannerDemoStore,command:Extract<BannerDemoCommand,{operation:'getPlacementList'}>) {
    const query=command.query;
    const list=store.placements.filter(value=>(!query?.status || value.status===query.status)
      && (!query?.code || value.code===query.code) && (!query?.search || value.name.toLowerCase().includes(query.search.toLowerCase())));
    return {total:list.length,list};
  }
  private async createPlacement(command:Extract<BannerDemoCommand,{operation:'postPlacement'}>) {
    const id=await this.repository.save('banner_placements',{...command.data,code:command.data.code??BANNER_DEFAULTS.codePrefix+'-'+randomBytes(6).toString('hex').toUpperCase(),
      platform:command.data.platform??BANNER_DEFAULTS.platform,status:command.data.status??BANNER_DEFAULTS.placementStatus});
    return this.requireId((await this.store()).placements,id);
  }
  private async savePlacement(command:Extract<BannerDemoCommand,{operation:'patchPlacement'}>) {
    await this.repository.save('banner_placements',command.data,command.id);
    return this.requireId((await this.store()).placements,command.id);
  }
  private async createBanner(command:Extract<BannerDemoCommand,{operation:'postBanner'}>) {
    const id=await this.repository.save('banners',{...command.data,status:command.data.status??BANNER_DEFAULTS.bannerStatus});
    return this.requireId((await this.store()).banners,id);
  }
  private async saveBanner(command:Extract<BannerDemoCommand,{operation:'patchBanner'}>) {
    await this.repository.save('banners',command.data,command.id);
    return this.requireId((await this.store()).banners,command.id);
  }
  private async saveItem(store:BannerDemoStore,command:Extract<BannerDemoCommand,{operation:'patchPlacementLayoutItem'}>) {
    const layout=this.layout(store,command.placementId,command.layoutId);
    this.requireId(layout.items,command.itemId);
    if(command.data.bannerId!==undefined) this.requireId(store.banners,command.data.bannerId);
    if(command.data.slotKey && layout.items.some(value=>value.id!==command.itemId && value.slotKey===command.data.slotKey)) {
      throw new BadRequestException({code:'DUPLICATE_SLOT',message:'Slot banner bị trùng.'});
    }
    await this.repository.save('banner_layout_items',command.data,command.itemId);
    const saved=await this.store();
    return this.requireId(this.layout(saved,command.placementId,command.layoutId).items,command.itemId);
  }
}

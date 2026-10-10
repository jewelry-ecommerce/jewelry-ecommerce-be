import type { BannerDemoStore,DemoBanner } from './banner.schema';
import { BANNER_DEFAULTS } from './banner.config';
function bannerView(banner:DemoBanner):Record<string,unknown> {
  return {
    id:banner.id,internal_name:banner.internalName,media_type:banner.mediaType,media_url:banner.mediaUrl??'',
    media_mobile_url:banner.mediaMobileUrl??'',media_poster_url:banner.mediaPosterUrl,media_mobile_poster_url:banner.mediaMobilePosterUrl,
    media_link_url:banner.mediaLinkUrl,overlay_opacity:banner.overlayOpacity,status:banner.status,title:banner.title,
    subtitle:banner.subtitle,title_color:banner.titleColor,layout:banner.layout,actions_layout:banner.actionsLayout,
    actions:(banner.actions??[]).map(action=>({action_type:action.actionType??'URL',action_target:action.actionTarget,
      cta_text:action.ctaText??'',cta_bg:action.ctaBg??BANNER_DEFAULTS.ctaBackground,cta_color:action.ctaColor??BANNER_DEFAULTS.ctaColor})),
  };
}
export function placementView(store:BannerDemoStore,code:string):Record<string,unknown>|null {
  const placement=store.placements.find(value=>value.code===code && value.status==='ACTIVE');
  if(!placement) return null;
  const now=Date.now();
  const layout=store.layouts.filter(value=>value.placementId===placement.id && value.status==='ACTIVE'
    && (!value.activeFrom || Date.parse(value.activeFrom)<=now) && (!value.activeTo || Date.parse(value.activeTo)>now))
    .sort((left,right)=>right.revision-left.revision)[0];
  if(!layout) return null;
  const slots=layout.items.filter(value=>value.isActive).flatMap(entry=>{
    const banner=store.banners.find(value=>value.id===entry.bannerId && value.status==='ACTIVE');
    if(!banner?.mediaUrl?.trim()) return [];
    const position=entry.displayMetadata??{x:0,y:0,width:1,height:1,order:0};
    return [{id:entry.id,slot_key:entry.slotKey,slot_type:'SINGLE_IMAGE',layout_metadata:position,
      banners:[{order_index:position.order??0,banner:bannerView(banner)}]}];
  });
  return {id:placement.id,code:placement.code,name:placement.name,type:placement.displayType,
    settings:{columns:BANNER_DEFAULTS.columns,rows:BANNER_DEFAULTS.rows,gap:BANNER_DEFAULTS.gap,...placement.settings},slots};
}

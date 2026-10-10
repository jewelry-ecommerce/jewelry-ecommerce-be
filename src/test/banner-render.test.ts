import { test } from 'node:test';
import assert from 'node:assert/strict';
import { placementView } from '../banner/domain/banner.mapper';
import { bannerRecordSchema,placementRecordSchema,layoutRecordSchema,type BannerDemoStore } from '../banner/domain/banner.schema';
import { validateLayout } from '../banner/domain/banner.validation';
function fixture(type:'GRID'|'SLIDER'|'DOUBLE_BANNER'):BannerDemoStore {
  const metadata={createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()};
  const banners=[1,2].map(id=>bannerRecordSchema.parse({
    ...metadata,id,internalName:'Banner '+id,mediaUrl:'http://localhost/banner-'+id+'.png',mediaMobileUrl:'http://localhost/mobile-'+id+'.png',
    mediaType:'IMAGE',layout:'CENTER',actionsLayout:'STACK',mediaFit:'cover',overlayOpacity:0,status:'ACTIVE',
  }));
  const placements=[placementRecordSchema.parse({...metadata,id:1,code:'TEST',name:'Test',displayType:type,platform:'ALL',status:'ACTIVE'})];
  const layouts=[layoutRecordSchema.parse({...metadata,id:1,placementId:1,name:'Layout',revision:1,status:'ACTIVE',
    items:banners.map((banner,index)=>({...metadata,id:index+1,placementLayoutId:1,slotKey:String(index),bannerId:banner.id,
      isActive:true,priority:0,displayMetadata:{x:index,y:0,width:1,height:1,order:index}})),
  })];
  return {banners,placements,layouts};
}
test('double banner keeps two independent slots and numeric entity IDs',()=>{
  const rendered=placementView(fixture('DOUBLE_BANNER'),'TEST');
  assert.ok(rendered);
  const slots=rendered.slots as {id:number;banners:{banner:{id:number}}[]}[];
  assert.equal(slots.length,2);
  assert.equal(slots[0]!.banners[0]!.banner.id,1);
  assert.equal(slots[1]!.banners[0]!.banner.id,2);
  assert.equal(typeof rendered.id,'number');
});
test('grid returns per-slot coordinates rather than one synthetic slot',()=>{
  const rendered=placementView(fixture('GRID'),'TEST');
  const slots=rendered?.slots as {layout_metadata:{x:number}}[];
  assert.deepEqual(slots.map(slot=>slot.layout_metadata.x),[0,1]);
});
test('inactive placement cannot leak to storefront',()=>{
  const store=fixture('SLIDER');store.placements[0]!.status='INACTIVE';
  assert.equal(placementView(store,'TEST'),null);
});
test('double banner configuration requires two items',()=>{
  const store=fixture('DOUBLE_BANNER');
  assert.throws(()=>validateLayout(store,{operation:'postPlacementLayout',placementId:1,
    data:{name:'Invalid',items:[{slotKey:'only',bannerId:1}]}}),/hai ô/);
});

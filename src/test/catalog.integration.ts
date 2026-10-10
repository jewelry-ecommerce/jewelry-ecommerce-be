import 'reflect-metadata';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { DataSource } from 'typeorm';
import { Test } from '@nestjs/testing';
import { ValidationPipe, type INestApplication } from '@nestjs/common';
import { AppModule } from '../app.module';
import { databaseOptions } from '../database/database.options';
import { applicationConfiguration } from '../config/application.config';
import { ApiExceptionFilter } from '../common/api-exception.filter';
import { AccountRole } from '../auth/domain/auth.constants';
import { hashPassword } from '../auth/domain/password.util';
import { exerciseBadgeResolution } from './badge.integration.helper';
import { exerciseSkuPicker } from './sku-picker.integration.helper';

const TEST_DATABASE = 'jewelry_commerce_test';
async function testDatabase(): Promise<DataSource> {
  const config = applicationConfiguration();
  assert.equal(config.database.host,'127.0.0.1');
  assert.equal(config.database.port,5433);
  assert.equal(config.database.name,'jewelry_commerce');
  const administrator = await new DataSource(databaseOptions()).initialize();
  try {
    const existing = await administrator.query<{datname:string}[]>('SELECT datname FROM pg_database WHERE datname=$1',[TEST_DATABASE]);
    if (!existing.length) await administrator.query('CREATE DATABASE jewelry_commerce_test');
  } finally { await administrator.destroy(); }
  const source = await new DataSource(databaseOptions({...process.env,DB_NAME:TEST_DATABASE})).initialize();
  await source.runMigrations({transaction:'all'});
  return source;
}
async function exerciseCatalogDeleteRules(base:string,token:string,catalog:{categoryId:number;attributeId:number}):Promise<void> {
  for(const [resource,id] of [['categories',catalog.categoryId],['attributes',catalog.attributeId]] as const) {
    const response=await fetch(base+'/api/v1/admin/catalog/'+resource+'/'+id,{method:'DELETE',headers:{Authorization:'Bearer '+token}});
    assert.equal(response.status,409,await response.clone().text());
    const error=await response.json() as {code:string;dependencies:{module:string}[]};
    assert.equal(error.dependencies[0]!.module,'PIM');
    const unchanged=await fetch(base+'/api/v1/admin/catalog/'+resource+'/'+id,{headers:{Authorization:'Bearer '+token}});
    assert.equal(unchanged.status,200);
  }
  const valuesRemoved=await fetch(base+'/api/v1/admin/catalog/attributes/'+catalog.attributeId,{
    method:'PUT',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},
    body:JSON.stringify({name:'Integration size',code:'SIZE',displayType:'TEXT',status:'ACTIVE',values:[]}),
  });
  assert.equal(valuesRemoved.status,409);
  const error=await valuesRemoved.json() as {code:string};
  assert.equal(error.code,'ATTRIBUTE_VALUE_IN_USE');
}
async function exerciseProductFlow(base:string,token:string,tag:string,source:DataSource):Promise<void> {
  const catalog=await createCatalog(base,token,tag);
  const product=await send(base,'admin/catalog/products',{
    spuCode:'SP-'+tag,name:'Integration ring',categoryId:catalog.categoryId,defaultSkuCode:'SKU-'+tag,
    attributes:[{attributeId:catalog.attributeId,valueIds:[catalog.valueId]}],
    skus:[{skuCode:'SKU-'+tag,status:'ACTIVE',attributeValueIds:[catalog.valueId],
      medias:['http://localhost:8083/uploads/test-only.png'],sellingPriceAfterTaxMinor:150000,onHand:5}],
  },token);
  assert.equal(product.status,201);
  assert.equal(typeof product.body.id,'number');
  assert.equal(product.body.status,'DRAFT');
  await assertPublicProduct(base,product.body.id,0);
  await assertPublicDetail(base,String(product.body.slug),404);
  const publish=await fetch(base+'/api/v1/admin/catalog/products/'+product.body.id+'/status',{
    method:'PATCH',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify({status:'PUBLISHED'}),
  });
  assert.equal(publish.status,200);
  const published=await publish.json() as Record<string,unknown>;
  assert.equal(published.status,'PUBLISHED');
  assert.equal(published.image,'http://localhost:8083/uploads/test-only.png');
  await assertPublicDetail(base,String(published.slug),200);
  const collection=await send(base,'admin/catalog/collections',{name:'Integration collection',slug:'collection-'+tag,status:'ACTIVE',productIds:[product.body.id]},token);
  assert.equal(collection.status,201);
  assert.deepEqual(collection.body.productIds,[product.body.id]);
  await exerciseSkuPicker(base,token,Number(product.body.id),Number((product.body.variations as {id:number}[])[0]!.id),catalog.categoryId,Number(collection.body.id));
  await assertPublicProduct(base,product.body.id,1,'collection-'+tag);
  await assertPublicProduct(base,product.body.id,0,'collection-not-found-'+tag);
  await exerciseBadgeResolution(base,token,tag,Number(product.body.id),Number((product.body.variations as {id:number}[])[0]!.id),source);
  await exerciseProductUpdate(base,token,product.body,catalog);
  await exerciseCatalogDeleteRules(base,token,catalog);
}

async function assertPublicDetail(base:string,slug:string,status:number):Promise<void> {
  const response=await fetch(base+'/api/v1/storefront/product/'+encodeURIComponent(slug));
  assert.equal(response.status,status,await response.clone().text());
  if(status!==200) return;
  const body=await response.json() as {id:number;defaultVariantId:number;variants:{id:number;stock:number;attributeValues:{id:number;attribute:{id:number}}[]}[];variantSelectors:{options:{variationIds:number[]}[]}[]};
  assert.equal(typeof body.id,'number');
  const variant=body.variants.find(sku=>sku.id===body.defaultVariantId)!;
  assert.equal(variant.stock,5);
  assert.equal(typeof variant.attributeValues[0]!.attribute.id,'number');
  assert.ok(body.variantSelectors[0]!.options[0]!.variationIds.includes(body.defaultVariantId));
  assert.ok(!JSON.stringify(body).includes('costPrice'));
}
async function assertPublicProduct(base:string,id:unknown,total:number,collectionSlug?:string):Promise<void> {
  const query=new URLSearchParams({productIds:String(id),...(collectionSlug?{collectionSlug}:{})});
  const response=await fetch(base+'/api/v1/storefront/product?'+query);
  assert.equal(response.status,200,await response.clone().text());
  const body=await response.json() as {total:number;list:{productId:number;selectedSku:{id:number;customerDisplayPrice:{sellingPriceAfterTaxMinor:number}}}[]};
  assert.equal(body.total,total);
  if(!total) {assert.equal(body.list.length,0);return;}
  assert.equal(body.list[0]!.productId,id);
  assert.equal(typeof body.list[0]!.selectedSku.id,'number');
  assert.equal(body.list[0]!.selectedSku.customerDisplayPrice.sellingPriceAfterTaxMinor,150000);
  assert.ok(!JSON.stringify(body).includes('costPrice'));
}
async function exerciseProductUpdate(base:string,token:string,product:Record<string,unknown>,catalog:{categoryId:number;attributeId:number;valueId:number}):Promise<void> {
  const variations=product.variations as {id:number;medias:{id:number;url:string}[]}[];
  const sku=variations[0]!;
  const body={spuCode:product.spuCode,name:'Updated integration ring',categoryId:catalog.categoryId,defaultSkuCode:'SKU-'+String(product.spuCode).slice(3),
    attributes:[{attributeId:catalog.attributeId,valueIds:[catalog.valueId]}],
    skus:[{id:sku.id,skuCode:'SKU-'+String(product.spuCode).slice(3),status:'ACTIVE',attributeValueIds:[catalog.valueId],
      medias:['http://localhost:8083/uploads/test-updated.png'],sellingPriceAfterTaxMinor:170000}]};
  const url=base+'/api/v1/admin/catalog/products/'+product.id;
  const response=await fetch(url,{method:'PUT',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify(body)});
  assert.equal(response.status,200,await response.clone().text());
  const saved=await response.json() as {variations:{id:number;onHand:number;medias:{id:number;url:string}[]}[]};
  assert.equal(saved.variations[0]!.id,sku.id);
  assert.equal(saved.variations[0]!.onHand,5);
  assert.equal(saved.variations[0]!.medias[0]!.id,sku.medias[0]!.id);
  const invalid={...body,skus:body.skus.map(entry=>({...entry,id:sku.id+100000}))};
  const rejected=await fetch(url,{method:'PUT',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify(invalid)});
  assert.equal(rejected.status,400);
  const after=await (await fetch(url,{headers:{Authorization:'Bearer '+token}})).json() as {variations:{id:number}[]};
  assert.equal(after.variations[0]!.id,sku.id);
}
async function testApplication(source:DataSource):Promise<INestApplication> {
  const module = await Test.createTestingModule({imports:[AppModule]}).overrideProvider(DataSource).useValue(source).compile();
  const app = module.createNestApplication();
  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(new ValidationPipe({transform:true,whitelist:true,forbidNonWhitelisted:true}));
  app.useGlobalFilters(new ApiExceptionFilter());
  await app.listen(0,'127.0.0.1');
  return app;
}
async function send(base:string,path:string,body:unknown,token?:string):Promise<{status:number;body:Record<string,unknown>}> {
  const response = await fetch(base+'/api/v1/'+path,{
    method:'POST',headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},
    body:JSON.stringify(body),
  });
  return {status:response.status,body:await response.json() as Record<string,unknown>};
}
async function cleanup(source:DataSource,tag:string):Promise<void> {
  await source.transaction(async manager=>{
    const purposes=['CAMPAIGN','OUT_OF_STOCK','PRE_ORDER'];
    const flowNames=purposes.map(purpose=>'Flow '+tag+' '+purpose);
    await manager.query('DELETE FROM badge_flow_templates WHERE flow_id IN(SELECT id FROM badge_flows WHERE name=ANY($1::varchar[]))',[flowNames]);
    await manager.query('DELETE FROM badge_flows WHERE name=ANY($1::varchar[])',[flowNames]);
    await manager.query('DELETE FROM badge_templates WHERE code=ANY($1::varchar[])',[purposes.map(purpose=>'BADGE_'+tag+'_'+purpose)]);
    await manager.query('DELETE FROM badge_templates WHERE code=$1',['TEMPLATE_'+tag]);
    const products = await manager.query<{id:number}[]>('SELECT id FROM products WHERE spu_code=$1',['SP-'+tag]);
    await manager.query('DELETE FROM cms_blocks WHERE page_id IN(SELECT id FROM cms_pages WHERE name=$1)',['CMS '+tag]);
    await manager.query('DELETE FROM cms_pages WHERE name=$1',['CMS '+tag]);
    await manager.query('DELETE FROM banner_layout_items WHERE placement_layout_id IN(SELECT id FROM banner_placement_layouts WHERE placement_id IN(SELECT id FROM banner_placements WHERE code=$1))',['BANNER_TEST_'+tag]);
    await manager.query('DELETE FROM banner_placement_layouts WHERE placement_id IN(SELECT id FROM banner_placements WHERE code=$1)',['BANNER_TEST_'+tag]);
    await manager.query('DELETE FROM banner_placements WHERE code=$1',['BANNER_TEST_'+tag]);
    await manager.query('DELETE FROM banners WHERE internal_name=ANY($1::varchar[])',[[tag+'-banner-0',tag+'-banner-1']]);
    for(const product of products) {
      const skus = await manager.query<{id:number}[]>('SELECT id FROM product_variations WHERE product_id=$1',[product.id]);
      await manager.query('UPDATE products SET default_variation_id=NULL WHERE id=$1',[product.id]);
      await manager.query('DELETE FROM product_collections WHERE product_id=$1',[product.id]);
      await manager.query('DELETE FROM variation_media WHERE variation_id=ANY($1::int[])',[skus.map(sku=>sku.id)]);
      await manager.query('DELETE FROM variation_values WHERE variation_id=ANY($1::int[])',[skus.map(sku=>sku.id)]);
      await manager.query('DELETE FROM product_variations WHERE product_id=$1',[product.id]);
      await manager.query('DELETE FROM product_attribute_values WHERE product_id=$1',[product.id]);
      await manager.query('DELETE FROM product_attributes WHERE product_id=$1',[product.id]);
      await manager.query('DELETE FROM products WHERE id=$1',[product.id]);
    }
    await manager.query('DELETE FROM collections WHERE slug=$1',['collection-'+tag]);
    await manager.query('DELETE FROM categories WHERE code=$1',['CAT-'+tag]);
    await manager.query('DELETE FROM attribute_values WHERE attribute_id IN(SELECT id FROM attributes WHERE code=$1)',['ATTR-'+tag]);
    await manager.query('DELETE FROM attributes WHERE code=$1',['ATTR-'+tag]);
    await manager.query('DELETE FROM accounts WHERE email=$1',[tag+'@integration.invalid']);
  });
}
async function createCatalog(base:string,token:string,tag:string):Promise<{categoryId:number;attributeId:number;valueId:number}> {
  const attribute=await send(base,'admin/catalog/attributes',{
    name:'Integration attribute',code:'ATTR-'+tag,displayType:'TEXT',status:'ACTIVE',
    values:[{code:'VALUE-'+tag,value:'Test value'}],
  },token);
  assert.equal(attribute.status,201);
  const values=attribute.body.values as {id:number}[];
  const category=await send(base,'admin/catalog/categories',{name:'Integration category',code:'CAT-'+tag,status:'ACTIVE'},token);
  assert.equal(category.status,201);
  const update = await fetch(base + "/api/v1/admin/catalog/categories/" + category.body.id, {
    method: "PUT", headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
    body: JSON.stringify({ name: "Updated category", code: "CAT-" + tag, status: "ACTIVE" }),
  });
  assert.equal(update.status, 200, await update.clone().text());
  assert.equal((await update.json() as {id:number}).id, category.body.id);
  return {categoryId:Number(category.body.id),attributeId:Number(attribute.body.id),valueId:values[0]!.id};
}
test('HTTP admin auth → PIM publish/collection → banner slots → CMS publish persists on PostgreSQL',async()=>{
  const source=await testDatabase();
  const tag='integration-'+randomBytes(6).toString('hex');
  let app:INestApplication|undefined;
  try {
    const password=randomBytes(20).toString('hex');
    await source.query('INSERT INTO accounts(email,name,password_hash,role,status) VALUES($1,$2,$3,$4,$5)',[tag+'@integration.invalid','Integration owner',hashPassword(password),AccountRole.ADMIN,'ACTIVE']);
    app=await testApplication(source);
    const base=await app.getUrl();
    const denied=await send(base,'admin/catalog/categories',{name:'Blocked',code:'Blocked',status:'ACTIVE'});
    assert.equal(denied.status,401);
    const login=await send(base,'admin/auth/login',{email:tag+'@integration.invalid',password});
    assert.equal(login.status,201);
    const token=String(login.body.accessToken);
    await exerciseProductFlow(base,token,tag,source);
    await exerciseCmsAndBanner(base,token,tag);
    await exerciseBadgeTemplate(base,token,tag);
  } finally {
    await cleanup(source,tag);
    if(app) await app.close();
    if(source.isInitialized) await source.destroy();
  }
});
async function exerciseBadgeTemplate(base:string,token:string,tag:string):Promise<void> {
  const input={name:'Badge '+tag,code:'TEMPLATE_'+tag,type:'TEXT',badgeType:'CAMPAIGN',status:'ACTIVE',displayText:'Mới',defaultPosition:'TOP_LEFT',styleConfig:{textColor:'#171717',backgroundColor:'#FFFFFF'}};
  const created=await send(base,'admin/badge-templates',input,token);
  assert.equal(created.status,201,JSON.stringify(created.body));
  assert.equal(typeof created.body.id,'number');
  const url=base+'/api/v1/admin/badge-templates/'+created.body.id;
  const headers={'Content-Type':'application/json',Authorization:'Bearer '+token};
  const update=await fetch(url,{method:'PUT',headers,body:JSON.stringify({name:'Updated badge',defaultPosition:'BOTTOM_RIGHT'})});
  assert.equal(update.status,200,await update.clone().text());
  const saved=await update.json() as {id:number;status:string;displayText:string;defaultPosition:string;styleConfig:Record<string,string>};
  assert.equal(saved.id,created.body.id);assert.equal(saved.displayText,'Mới');
  assert.equal(saved.status,'ACTIVE');
  assert.equal(saved.defaultPosition,'BOTTOM_RIGHT');assert.equal(saved.styleConfig.textColor,'#171717');
  const rejected=await fetch(url,{method:'PATCH',headers,body:JSON.stringify({type:'IMAGE',image:null})});
  assert.equal(rejected.status,400);
  const unchanged=await (await fetch(url,{headers})).json() as {type:string};
  assert.equal(unchanged.type,'TEXT');
  assert.equal((await fetch(url,{method:'DELETE',headers})).status,200);
  assert.equal((await fetch(url,{headers})).status,404);
}
async function createDoubleBanner(base:string,token:string,tag:string):Promise<string> {
  const code='BANNER_TEST_'+tag;
  const placement=await send(base,'admin/banner/command',{operation:'postPlacement',
    data:{name:'Placement '+tag,code,displayType:'DOUBLE_BANNER',status:'ACTIVE'}},token);
  assert.equal(placement.status,201);
  const ids:number[]=[];
  for(const index of [0,1]) {
    const banner=await send(base,'admin/banner/command',{operation:'postBanner',
      data:{internalName:tag+'-banner-'+index,status:'ACTIVE',mediaUrl:'http://localhost/banner-'+index+'.png',mediaMobileUrl:'http://localhost/mobile-'+index+'.png'}},token);
    assert.equal(banner.status,201);
    ids.push(Number(banner.body.id));
    const patched = await send(base, "admin/banner/command", { operation: "patchBanner", id: banner.body.id, data: { internalName: tag + "-banner-" + index } }, token);
    assert.equal(patched.status, 201, JSON.stringify(patched.body));
    assert.equal(patched.body.id, banner.body.id);
  }
  const layout=await send(base,'admin/banner/command',{operation:'postPlacementLayout',placementId:placement.body.id,
    data:{name:'Configuration',status:'ACTIVE',items:ids.map((bannerId,index)=>({
      slotKey:String(index),bannerId,displayMetadata:{x:index,y:0,width:1,height:1,order:index},
    }))}},token);
  assert.equal(layout.status,201);
  const render=await fetch(base+'/api/v1/storefront/banner/placements/code/'+code+'/render');
  assert.equal(render.status,200);
  const body=await render.json() as {slots:{banners:{banner:{id:number}}[]}[]};
  assert.equal(body.slots.length,2);
  assert.deepEqual(body.slots.map(slot=>slot.banners[0]!.banner.id),ids);
  return code;
}
async function putPage(base:string,token:string,id:number,body:unknown):Promise<Response> {
  return fetch(base+'/api/v1/admin/cms/pages/'+id,{
    method:'PUT',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify(body),
  });
}
async function exerciseCmsAndBanner(base:string,token:string,tag:string):Promise<void> {
  const code=await createDoubleBanner(base,token,tag);
  const input={name:'CMS '+tag,slug:'cms-'+tag,status:'DRAFT',isActive:true,seo:{title:'SEO title'},blocks:[]};
  const draft=await send(base,'admin/cms/pages',input,token);
  assert.equal(draft.status,201);
  assert.deepEqual(draft.body.blocks,[]);
  const publicUrl=base+'/api/v1/storefront/cms/pages/'+input.slug;
  assert.equal((await fetch(publicUrl)).status,404);
  const configured={...input,status:'PUBLISHED',revision:draft.body.revision,blocks:[
    {blockTypeCode:'BANNER',sortOrder:0,isVisible:true,config:{placementCode:code}},
    {blockTypeCode:'INFO_CARDS',sortOrder:1,isVisible:true,config:{header:{title:'Cards'},items:[{title:'Test card',imageUrl:'http://localhost/card.png'}]}},
  ]};
  const published=await putPage(base,token,Number(draft.body.id),configured);
  assert.equal(published.status,200,await published.clone().text());
  const saved=await published.json() as {revision:number;blocks:{id:number;isVisible:boolean}[]};
  const rendered=await (await fetch(publicUrl)).json() as {page:{seo:{title:string}};blocks:unknown[]};
  assert.equal(rendered.page.seo.title,'SEO title');
  assert.equal(rendered.blocks.length,2);
  const hidden={...configured,revision:saved.revision,blocks:configured.blocks.map((block,index)=>({
    ...block,id:saved.blocks[index]!.id,isVisible:index===0,
  }))};
  assert.equal((await putPage(base,token,Number(draft.body.id),hidden)).status,200);
  const visible=await (await fetch(publicUrl)).json() as {blocks:unknown[]};
  assert.equal(visible.blocks.length,1);
  assert.equal((await putPage(base,token,Number(draft.body.id),hidden)).status,409);
}

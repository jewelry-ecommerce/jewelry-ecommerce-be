import assert from 'node:assert/strict';
export async function exerciseSkuPicker(base:string,token:string,productId:number,skuId:number,categoryId:number,collectionId:number):Promise<void> {
  const headers={Authorization:'Bearer '+token};
  const scope=new URLSearchParams({categoryIds:String(categoryId),collectionIds:String(collectionId),take:'1',orderBy:'skuCode',orderType:'ASC'});
  const response=await fetch(base+'/api/v1/admin/catalog/skus?'+scope,{headers});
  assert.equal(response.status,200,await response.clone().text());
  const result=await response.json() as {total:number;list:{id:number;product:{id:number};image:string}[];pagination:{take:number}};
  assert.equal(result.total,1);assert.equal(result.list[0]!.id,skuId);assert.equal(result.list[0]!.product.id,productId);
  assert.equal(result.pagination.take,1);assert.ok(result.list[0]!.image);
  for(const query of ['categoryIds=bad','take=101','orderBy=unknown','collectionIds=0']) {
    const invalid=await fetch(base+'/api/v1/admin/catalog/skus?'+query,{headers});
    assert.equal(invalid.status,400);
  }
  const anonymous=await fetch(base+'/api/v1/admin/catalog/skus');
  assert.equal(anonymous.status,401);
}

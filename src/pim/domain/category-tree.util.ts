
import { BadRequestException } from '@nestjs/common';
import type { CatalogRecord } from './catalog.interface';
export interface CategoryView extends CatalogRecord {
  level:number; children:CategoryView[]; directAttributes:CatalogRecord[];
  inheritedAttributes:CatalogRecord[]; effectiveAttributes:CatalogRecord[];
}
function parentChain(category:CatalogRecord,categories:CatalogRecord[]):CatalogRecord[] {
  const ancestors:CatalogRecord[]=[];const visited=new Set([category.id]);
  let parentId=category.parentId;
  while(parentId) {
    if(visited.has(parentId)) throw new BadRequestException({code:'CATEGORY_CYCLE',message:'Danh mục có vòng lặp.'});
    visited.add(parentId);
    const parent=categories.find(record=>record.id===parentId);
    if(!parent) break;
    ancestors.push(parent);parentId=parent.parentId;
  }
  return ancestors;
}
export function buildCategoryViews(categories:CatalogRecord[],attributes:CatalogRecord[]):CategoryView[] {
  return categories.map(category=>{
    const ancestors=parentChain(category,categories);
    const direct=new Set(category.directAttributeIds??[]);
    const inherited=new Set(ancestors.flatMap(parent=>parent.directAttributeIds??[]));
    return {...category,level:ancestors.length+1,children:[],
      directAttributes:attributes.filter(attribute=>direct.has(attribute.id)),
      inheritedAttributes:attributes.filter(attribute=>inherited.has(attribute.id)&&!direct.has(attribute.id)),
      effectiveAttributes:attributes.filter(attribute=>direct.has(attribute.id)||inherited.has(attribute.id))};
  });
}
export function categoryRoots(categories:CategoryView[]):CategoryView[] {
  const nodes=new Map(categories.map(category=>[category.id,{...category,children:[] as CategoryView[]}]));
  const roots:CategoryView[]=[];
  for(const category of nodes.values()) {
    const parent=category.parentId ? nodes.get(category.parentId) : undefined;
    if(parent) parent.children.push(category); else roots.push(category);
  }
  return roots;
}

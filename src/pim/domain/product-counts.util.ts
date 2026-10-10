
import { ProductStatus } from './catalog.enum';
export interface ProductCounts {
  all:number; draft:number; unpublished:number; published:number; discontinued:number; archived:number;
  hasPendingApproval:number; approvalApproved:number; approvalRejected:number; approvalCancelled:number;
}
export function productCounts(products:readonly {status:ProductStatus}[]):ProductCounts {
  const count=(status:ProductStatus):number=>products.filter(product=>product.status===status).length;
  return {
    all:products.length,draft:count(ProductStatus.DRAFT),unpublished:count(ProductStatus.UNPUBLISHED),
    published:count(ProductStatus.PUBLISHED),discontinued:count(ProductStatus.DISCONTINUED),archived:count(ProductStatus.ARCHIVED),
    // Approval workflow is excluded from the owner-only demo scope.
    hasPendingApproval:0,approvalApproved:0,approvalRejected:0,approvalCancelled:0,
  };
}

import { BadRequestException } from '@nestjs/common';
import { MEDIA_POLICY } from './media.config';
export function imageType(buffer:Buffer):{extension:string;mime:string} {
  if(!buffer.length || buffer.length>MEDIA_POLICY.maximumBytes) throw invalid('UPLOAD_SIZE_INVALID','Ảnh vượt giới hạn dung lượng.');
  for(const signature of MEDIA_POLICY.signatures) {
    if(signature.prefix.every((value,index)=>buffer[index]===value)) return signature;
  }
  if(buffer.subarray(0,4).toString()==='RIFF' && buffer.subarray(8,12).toString()==='WEBP') {
    return {extension:'webp',mime:'image/webp'};
  }
  throw invalid('UPLOAD_TYPE_INVALID','Hiện hỗ trợ PNG, JPEG, GIF và WebP.');
}
function invalid(code:string,message:string):BadRequestException {return new BadRequestException({code,message});}

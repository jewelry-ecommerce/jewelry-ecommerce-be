export const MEDIA_POLICY = {
  maximumBytes:10*1024*1024, directory:'uploads', keyPattern:/^[a-f0-9]{48}\.(png|jpg|gif|webp)$/,
  signatures:[
    {extension:'png',mime:'image/png',prefix:[137,80,78,71,13,10,26,10]},
    {extension:'jpg',mime:'image/jpeg',prefix:[255,216,255]},
    {extension:'gif',mime:'image/gif',prefix:[71,73,70,56]},
  ],
} as const;

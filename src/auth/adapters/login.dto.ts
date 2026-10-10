import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
export class AdminLoginDto {
  @ApiProperty()
  @IsEmail()
  @MaxLength(254)
  email!: string;
  @ApiProperty()
  @IsString()
  @MinLength(8)
  @MaxLength(200)
  password!: string;
}

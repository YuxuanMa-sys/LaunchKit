import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, MaxLength } from 'class-validator';

export class CreateApiKeyDto {
  @ApiProperty({ example: 'Production API Key', description: 'Human-readable name for the key' })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name!: string;

  @ApiProperty({ example: 'cmgo97fl50007f7xbyc18lwn2', description: 'Organization ID (CUID format)' })
  @IsString()
  @MinLength(20)
  @MaxLength(30)
  orgId!: string;
}

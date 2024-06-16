import { File } from '@backendPrisma';
import { IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class FileDto implements File {
  /**
   * @description File ID (This is the name of the file in the S3 bucket)
   */
  @ApiProperty({
    description: 'File ID (This is the name of the file in the S3 bucket)',
    required: false,
    type: 'string',
  })
  @IsOptional()
  id: string | null;

  @ApiProperty({
    description: 'File name',
    required: false,
    type: 'string',
  })
  @IsOptional()
  filename: string | null;

  @ApiProperty({
    description: 'File url',
    required: false,
    type: 'string',
  })
  @IsOptional()
  url: string | null;

  @ApiProperty({
    description: 'File thumb url',
    required: false,
    type: 'string',
  })
  @IsOptional()
  thumbUrl: string | null;
}

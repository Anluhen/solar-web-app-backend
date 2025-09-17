import { ApiProperty } from "@nestjs/swagger";
import { IsDate, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

export default class MaterialEntity {
  @ApiProperty({ required: true })
  @IsNumber()
  @IsNotEmpty()
  id!: number;

  @ApiProperty({ required: false, description: "Envio id (if any)" })
  @IsOptional()
  @IsNumber()
  envio_id?: number;

  @ApiProperty({ required: true })
  @IsNumber()
  sap!: number;

  @ApiProperty({ required: true })
  @IsString()
  @IsNotEmpty()
  descricao!: string;

  @ApiProperty({ required: true })
  @IsInt()
  quantidade!: number;

  @ApiProperty({ required: true })
  @IsDate()
  created_at!: Date;

  @ApiProperty({ required: true })
  @IsDate()
  updated_at!: Date;
}

import { IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateMaterialDto {
  @IsOptional()
  envio_id?: string; // bigint as string

  @IsOptional()
  sap?: string; // bigint, defaults to nextval seq in DB

  @IsString()
  @IsNotEmpty()
  descricao!: string;

  @IsInt()
  quantidade!: number;
}
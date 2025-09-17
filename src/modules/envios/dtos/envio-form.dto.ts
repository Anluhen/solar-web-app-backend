import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { StatusEnvio } from '../entities/envio.entity';

export default class EnvioFormDto {
  @ApiProperty({
    required: true,
  })
    
  @IsString()
  @IsNotEmpty()
  pep!: string;

  @IsString()
  @IsNotEmpty()
  zvgp!: string;

  @IsString()
  @IsNotEmpty()
  gerador!: string;

  @IsString()
  @IsOptional()
  observacoes?: string;

  @IsEnum(StatusEnvio)
  @IsOptional()
  status?: StatusEnvio; // default: RASCUNHO

  // separacao has default CURRENT_DATE in DB
  @IsOptional()
  @IsString()
  separacao?: string;
}

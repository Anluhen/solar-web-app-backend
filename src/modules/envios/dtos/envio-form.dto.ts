import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { StatusEnvio } from "../rules/status.rules";

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

    @ApiProperty({
        required: true,
        description: "Nome da UFV",
        default: "SEM NOME",
    })
    @IsString()
    @IsNotEmpty()
    ufv: string = "SEM NOME";

    @IsString()
    @IsOptional()
    observacoes?: string;

    @IsEnum(StatusEnvio)
    @IsOptional()
    status?: StatusEnvio;

    // separacao has default CURRENT_DATE in DB
    @IsOptional()
    @IsString()
    separacao?: string;

    @IsOptional()
    @IsString()
    data_enviado?: string | null;

    @IsOptional()
    @IsString()
    data_entregue?: string | null;

    @IsOptional()
    @IsString()
    previsao_chegada?: string | null;

    /** When true, skip email notification on status transition (for backfilling historical records) */
    @IsOptional()
    @IsBoolean()
    skip_email?: boolean;
}

import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsNotEmpty, IsOptional, IsString } from "class-validator";
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
}

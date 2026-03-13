import { ApiProperty } from "@nestjs/swagger";
import {
    IsBoolean,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsString,
} from "class-validator";

export default class ProjetoPepFormDto {
    @ApiProperty({
        description: "Nome descritivo desta lista (opcional)",
        required: false,
        nullable: true,
    })
    @IsString()
    @IsOptional()
    nome?: string | null;

    @ApiProperty({ description: "Sufixo do PEP (ex: -001)" })
    @IsString()
    @IsNotEmpty()
    pep_suffix!: string;

    @ApiProperty({
        description: "Código ZVGP desta lista",
        required: false,
        nullable: true,
    })
    @IsString()
    @IsOptional()
    zvgp?: string | null;

    @ApiProperty({
        description: "Código ZRGP desta lista",
        required: false,
        nullable: true,
    })
    @IsString()
    @IsOptional()
    zrgp?: string | null;

    @ApiProperty({
        description: "Código Gerador desta lista",
        required: false,
        nullable: true,
    })
    @IsString()
    @IsOptional()
    gerador?: string | null;

    @ApiProperty({
        description: "Data de preparação (Solar por PEP, YYYY-MM-DD)",
        required: false,
        nullable: true,
    })
    @IsString()
    @IsOptional()
    data_preparacao?: string | null;

    @ApiProperty({
        description: "ML (Solar por PEP)",
        required: false,
        nullable: true,
        type: Number,
    })
    @IsNumber()
    @IsOptional()
    ml?: number | null;

    @ApiProperty({
        description: "CPC (Solar por PEP)",
        required: false,
        nullable: true,
    })
    @IsBoolean()
    @IsOptional()
    is_cpc?: boolean | null;
}

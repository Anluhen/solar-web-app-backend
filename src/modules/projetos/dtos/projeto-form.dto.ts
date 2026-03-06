import { ApiProperty } from "@nestjs/swagger";
import {
    IsBoolean,
    IsNotEmpty,
    IsOptional,
    IsString,
    ValidateNested,
    IsArray,
} from "class-validator";
import { Type } from "class-transformer";

export class CreatePepInlineDto {
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

    @ApiProperty({ description: "Código ZVGP" })
    @IsString()
    @IsNotEmpty()
    zvgp!: string;

    @ApiProperty({ description: "Código Gerador" })
    @IsString()
    @IsNotEmpty()
    gerador!: string;
}

export default class ProjetoFormDto {
    @ApiProperty({ description: "Nome do projeto / UFV" })
    @IsString()
    @IsNotEmpty()
    nome!: string;

    @ApiProperty({ description: "Prefixo do PEP (XXX-XXXXXX)" })
    @IsString()
    @IsNotEmpty()
    pep_prefix!: string;

    @ApiProperty({ description: "Gerente de Projeto" })
    @IsString()
    @IsNotEmpty()
    pm!: string;

    @ApiProperty({ description: "Analista responsável" })
    @IsString()
    @IsNotEmpty()
    analista!: string;

    @ApiProperty({ required: false, default: false })
    @IsBoolean()
    @IsOptional()
    already_started?: boolean;

    @ApiProperty({
        required: false,
        type: () => [CreatePepInlineDto],
        description: "PEPs criados junto com o projeto",
    })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreatePepInlineDto)
    @IsOptional()
    peps?: CreatePepInlineDto[];
}

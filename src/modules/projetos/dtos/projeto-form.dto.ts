import { ApiProperty } from "@nestjs/swagger";
import {
    IsBoolean,
    IsNotEmpty,
    IsNumber,
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

    @ApiProperty({
        description: "Código ZVGP",
        required: false,
        nullable: true,
    })
    @IsString()
    @IsOptional()
    zvgp?: string | null;

    @ApiProperty({
        description: "Código ZRGP",
        required: false,
        nullable: true,
    })
    @IsString()
    @IsOptional()
    zrgp?: string | null;

    @ApiProperty({
        description: "Código Gerador",
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

export default class ProjetoFormDto {
    @ApiProperty({
        description: "Seção: Solar | Acionamentos/Sistemas",
        required: false,
        nullable: true,
    })
    @IsString()
    @IsOptional()
    secao?: string | null;

    @ApiProperty({ description: "Nome do projeto / UFV" })
    @IsString()
    @IsNotEmpty()
    nome!: string;

    @ApiProperty({ description: "Cliente", required: false, nullable: true })
    @IsString()
    @IsOptional()
    cliente?: string | null;

    @ApiProperty({
        description: "Produto (Solar: Tipo1 / Sistemas: Linha de Produto)",
        required: false,
        nullable: true,
    })
    @IsString()
    @IsOptional()
    produto?: string | null;

    @ApiProperty({ description: "Prefixo do PEP (XXX-XXXXXX)" })
    @IsString()
    @IsNotEmpty()
    pep_prefix!: string;

    @ApiProperty({ description: "Gerente de Projeto" })
    @IsString()
    @IsNotEmpty()
    pm!: string;

    @ApiProperty({
        description: "Analista responsável (legado)",
        required: false,
        nullable: true,
    })
    @IsString()
    @IsOptional()
    analista?: string | null;

    @ApiProperty({ required: false, default: false })
    @IsBoolean()
    @IsOptional()
    already_started?: boolean;

    // ─── Solar only ────────────────────────────────────────────────────────────

    @ApiProperty({ required: false, nullable: true })
    @IsString()
    @IsOptional()
    zvgp_projeto?: string | null;

    @ApiProperty({ required: false, nullable: true })
    @IsString()
    @IsOptional()
    zrgp?: string | null;

    @ApiProperty({ required: false, nullable: true, description: "YYYY-MM-DD" })
    @IsString()
    @IsOptional()
    data_preparacao?: string | null;

    @ApiProperty({ required: false, nullable: true })
    @IsString()
    @IsOptional()
    pep_faturavel?: string | null;

    @ApiProperty({ required: false, nullable: true })
    @IsString()
    @IsOptional()
    cns_ano?: string | null;

    @ApiProperty({ required: false, nullable: true })
    @IsString()
    @IsOptional()
    gerador_projeto?: string | null;

    // ─── Sistemas only ─────────────────────────────────────────────────────────

    @ApiProperty({ required: false, nullable: true })
    @IsString()
    @IsOptional()
    ordem_venda?: string | null;

    @ApiProperty({ required: false, nullable: true, description: "YYYY-MM-DD" })
    @IsString()
    @IsOptional()
    data_primeiro_envio?: string | null;

    @ApiProperty({ required: false, nullable: true })
    @IsString()
    @IsOptional()
    ordem_pedido_compra?: string | null;

    @ApiProperty({ required: false, nullable: true, type: Number })
    @IsNumber()
    @IsOptional()
    valor_total_liq?: number | null;

    // ─── Shared ────────────────────────────────────────────────────────────────

    @ApiProperty({ required: false, nullable: true, type: Number })
    @IsNumber()
    @IsOptional()
    ml?: number | null;

    @ApiProperty({ required: false, nullable: true })
    @IsBoolean()
    @IsOptional()
    is_cpc?: boolean | null;

    @ApiProperty({ required: false, nullable: true })
    @IsBoolean()
    @IsOptional()
    is_cpc47?: boolean | null;

    @ApiProperty({ required: false, nullable: true })
    @IsString()
    @IsOptional()
    claim?: string | null;

    @ApiProperty({ required: false, nullable: true, description: "YYYY-MM-DD" })
    @IsString()
    @IsOptional()
    data_claim?: string | null;

    @ApiProperty({ required: false, nullable: true })
    @IsString()
    @IsOptional()
    observacoes_chefe?: string | null;

    @ApiProperty({ required: false, nullable: true, description: "YYYY-MM-DD" })
    @IsString()
    @IsOptional()
    data_criacao_pep?: string | null;

    @ApiProperty({ required: false, nullable: true })
    @IsString()
    @IsOptional()
    idioma?: string | null;

    @ApiProperty({ required: false, nullable: true })
    @IsString()
    @IsOptional()
    empresa?: string | null;

    @ApiProperty({ required: false, nullable: true })
    @IsString()
    @IsOptional()
    contatos_cliente?: string | null;

    @ApiProperty({ required: false, nullable: true })
    @IsString()
    @IsOptional()
    contatos_weg?: string | null;

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

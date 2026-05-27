import { ApiProperty } from "@nestjs/swagger";
import {
    IsBoolean,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsString,
} from "class-validator";

export default class ProjetoFormDto {
    @ApiProperty({ required: false, nullable: true, description: "Seção: Solar | Acionamentos | Sistemas" })
    @IsString()
    @IsOptional()
    secao?: string | null;

    @ApiProperty({ required: false, nullable: true, description: "Nome do projeto / UFV" })
    @IsString()
    @IsOptional()
    nome?: string | null;

    @ApiProperty({ required: false, nullable: true })
    @IsString()
    @IsOptional()
    cliente?: string | null;

    @ApiProperty({ required: false, nullable: true })
    @IsString()
    @IsOptional()
    produto?: string | null;

    @ApiProperty({ description: "Prefixo do PEP (XXX-XXXXXX)" })
    @IsString()
    @IsNotEmpty()
    pep_prefix!: string;

    @ApiProperty({ required: false, nullable: true, description: "Sufixo do PEP (ex: 001)" })
    @IsString()
    @IsOptional()
    pep_suffix?: string | null;

    @ApiProperty({ required: false, nullable: true, description: "Gerente de Projeto" })
    @IsString()
    @IsOptional()
    pm?: string | null;

    @ApiProperty({ required: false, nullable: true })
    @IsString()
    @IsOptional()
    analista?: string | null;

    @ApiProperty({ required: false, default: false })
    @IsBoolean()
    @IsOptional()
    already_started?: boolean;

    // ─── Sub-project fields (merged from projeto_peps) ────────────────────────

    @ApiProperty({ required: false, nullable: true, description: "Nome descritivo desta entrada" })
    @IsString()
    @IsOptional()
    nome_pep?: string | null;

    @ApiProperty({ required: false, nullable: true, description: "Código ZVGP (OV)" })
    @IsString()
    @IsOptional()
    zvgp?: string | null;

    @ApiProperty({ required: false, nullable: true, description: "Código ZRGP (OV interno)" })
    @IsString()
    @IsOptional()
    zrgp?: string | null;

    @ApiProperty({ required: false, nullable: true, description: "Código Gerador" })
    @IsString()
    @IsOptional()
    gerador?: string | null;

    @ApiProperty({ required: false, nullable: true, description: "Data de preparação (YYYY-MM-DD)" })
    @IsString()
    @IsOptional()
    data_preparacao?: string | null;

    // ─── Solar only ────────────────────────────────────────────────────────────

    @ApiProperty({ required: false, nullable: true })
    @IsString()
    @IsOptional()
    cns_ano?: string | null;

    // ─── Sistemas/Acionamentos only ────────────────────────────────────────────

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

    @ApiProperty({ required: false, nullable: true, description: "Moeda do Valor Total Líquido: BRL | USD | EUR" })
    @IsString()
    @IsOptional()
    moeda_total_liq?: string | null;

    // ─── Shared ────────────────────────────────────────────────────────────────

    @ApiProperty({ required: false, nullable: true, type: Number })
    @IsNumber()
    @IsOptional()
    ml?: number | null;

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
    observacoes_admin?: string | null;

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
    contato_cliente_para?: string | null;

    @ApiProperty({ required: false, nullable: true })
    @IsString()
    @IsOptional()
    contato_cliente_cc?: string | null;

    @ApiProperty({ required: false, nullable: true })
    @IsString()
    @IsOptional()
    contato_weg_para?: string | null;

    @ApiProperty({ required: false, nullable: true })
    @IsString()
    @IsOptional()
    contato_weg_cc?: string | null;

    @ApiProperty({ required: false, nullable: true })
    @IsBoolean()
    @IsOptional()
    custos_ipex?: boolean | null;

    @ApiProperty({ required: false, nullable: true })
    @IsString()
    @IsOptional()
    workflow_status?: string;

    @ApiProperty({ required: false, nullable: true })
    @IsString()
    @IsOptional()
    anexo_ov?: string | null;

    @ApiProperty({ required: false, nullable: true })
    @IsString()
    @IsOptional()
    anexo_outro?: string | null;
}

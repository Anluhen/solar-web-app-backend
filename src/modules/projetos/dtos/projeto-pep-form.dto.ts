import { ApiProperty } from "@nestjs/swagger";
import {
    IsBoolean,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsString,
} from "class-validator";

export default class ProjetoPepFormDto {
    @ApiProperty({ required: false, nullable: true })
    @IsString()
    @IsOptional()
    nome?: string | null;

    @ApiProperty({ description: "Sufixo do PEP (ex: -001)" })
    @IsString()
    @IsNotEmpty()
    pep_suffix!: string;

    @ApiProperty({ required: false, nullable: true })
    @IsString()
    @IsOptional()
    zvgp?: string | null;

    @ApiProperty({ required: false, nullable: true })
    @IsString()
    @IsOptional()
    zrgp?: string | null;

    @ApiProperty({ required: false, nullable: true })
    @IsString()
    @IsOptional()
    gerador?: string | null;

    @ApiProperty({ required: false, nullable: true })
    @IsString()
    @IsOptional()
    data_preparacao?: string | null;

    @ApiProperty({ required: false, nullable: true, type: Number })
    @IsNumber()
    @IsOptional()
    ml?: number | null;

    @ApiProperty({ required: false, nullable: true })
    @IsBoolean()
    @IsOptional()
    is_cpc47?: boolean | null;

    // ── Per-OV Sistemas/Acionamentos fields ──────────────────────────────────

    @ApiProperty({ required: false, nullable: true })
    @IsString()
    @IsOptional()
    pm?: string | null;

    @ApiProperty({ required: false, nullable: true })
    @IsString()
    @IsOptional()
    produto?: string | null;

    @ApiProperty({ required: false, nullable: true })
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

    @ApiProperty({ required: false, nullable: true })
    @IsString()
    @IsOptional()
    claim?: string | null;

    @ApiProperty({ required: false, nullable: true })
    @IsString()
    @IsOptional()
    data_claim?: string | null;

    @ApiProperty({ required: false, nullable: true })
    @IsBoolean()
    @IsOptional()
    custos_ipex?: boolean | null;

    // ── Per-OV workflow & communication fields ───────────────────────────────

    @ApiProperty({ required: false, nullable: true })
    @IsString()
    @IsOptional()
    workflow_status?: string | null;

    @ApiProperty({ required: false, nullable: true })
    @IsString()
    @IsOptional()
    observacoes_admin?: string | null;

    @ApiProperty({ required: false, nullable: true })
    @IsString()
    @IsOptional()
    observacoes_chefe?: string | null;

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
    @IsString()
    @IsOptional()
    anexo_ov?: string | null;

    @ApiProperty({ required: false, nullable: true })
    @IsString()
    @IsOptional()
    anexo_outro?: string | null;
}

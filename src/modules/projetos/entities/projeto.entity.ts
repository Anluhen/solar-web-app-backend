import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    OneToMany,
    Index,
} from "typeorm";
import { ApiProperty } from "@nestjs/swagger";
import ProjetoItem from "./projeto-item.entity";

@Entity("projetos")
@Index("projetos_pep_prefix_idx", ["pep_prefix"])
@Index("projetos_zvgp_idx", ["zvgp"])
@Index("projetos_gerador_idx", ["gerador"])
export default class Projeto {
    @ApiProperty({ required: true, type: String, description: "Projeto id (bigint as string)" })
    @PrimaryGeneratedColumn({ type: "bigint" })
    id!: string;

    @ApiProperty({ required: false, nullable: true, description: "Seção: Solar | Acionamentos | Sistemas" })
    @Column({ type: "text", nullable: true })
    secao?: string | null;

    @ApiProperty({ required: false, nullable: true, description: "Nome do projeto / UFV" })
    @Column({ type: "text", nullable: true })
    nome?: string | null;

    @ApiProperty({ required: false, nullable: true })
    @Column({ type: "text", nullable: true })
    cliente?: string | null;

    @ApiProperty({ required: false, nullable: true, description: "Tipo do produto / Linha de Produto" })
    @Column({ type: "text", nullable: true })
    produto?: string | null;

    @ApiProperty({ required: true, description: "Prefixo do PEP (XXX-XXXXXX)" })
    @Column({ type: "text" })
    pep_prefix!: string;

    @ApiProperty({ required: false, nullable: true, description: "Sufixo do PEP (ex: 001)" })
    @Column({ type: "text", nullable: true })
    pep_suffix?: string | null;

    @ApiProperty({ required: false, nullable: true, description: "Gerente de Projeto" })
    @Column({ type: "text", nullable: true })
    pm?: string | null;

    @ApiProperty({ required: false, nullable: true, description: "Analista responsável (legado)" })
    @Column({ type: "text", nullable: true })
    analista?: string | null;

    @ApiProperty({ required: true, default: false })
    @Column({ type: "boolean", default: false })
    already_started!: boolean;

    // ─── Sub-project fields (merged from projeto_peps) ────────────────────────

    @ApiProperty({ required: false, nullable: true, description: "Nome descritivo desta entrada (ex: nome da UFV)" })
    @Column({ type: "text", nullable: true })
    nome_pep?: string | null;

    @ApiProperty({ required: false, nullable: true, description: "Código ZVGP (OV)" })
    @Column({ type: "text", nullable: true })
    zvgp?: string | null;

    @ApiProperty({ required: false, nullable: true, description: "Código ZRGP (OV interno)" })
    @Column({ type: "text", nullable: true })
    zrgp?: string | null;

    @ApiProperty({ required: false, nullable: true, description: "Código Gerador" })
    @Column({ type: "text", nullable: true })
    gerador?: string | null;

    @ApiProperty({ required: false, nullable: true, description: "Data de preparação (YYYY-MM-DD)", type: String })
    @Column({ type: "date", nullable: true })
    data_preparacao?: string | null;

    // ─── Solar only ────────────────────────────────────────────────────────────

    @ApiProperty({ required: false, nullable: true, description: "CNS_Ano (ex: DNES 0702/2022) — Solar" })
    @Column({ type: "text", nullable: true })
    cns_ano?: string | null;

    // ─── Sistemas/Acionamentos only ────────────────────────────────────────────

    @ApiProperty({ required: false, nullable: true, description: "Data Primeiro Envio — Sistemas/Acionamentos", type: String })
    @Column({ type: "date", nullable: true })
    data_primeiro_envio?: string | null;

    @ApiProperty({ required: false, nullable: true, description: "Pedido de Compra — Sistemas/Acionamentos" })
    @Column({ type: "text", nullable: true })
    ordem_pedido_compra?: string | null;

    @ApiProperty({ required: false, nullable: true, description: "Valor Total Líquido — Sistemas/Acionamentos", type: Number })
    @Column({ type: "numeric", nullable: true })
    valor_total_liq?: number | null;

    @ApiProperty({ required: false, nullable: true, description: "Moeda do Valor Total Líquido: BRL | USD | EUR" })
    @Column({ type: "text", nullable: true, default: "BRL" })
    moeda_total_liq?: string | null;

    // ─── Shared ────────────────────────────────────────────────────────────────

    @ApiProperty({ required: false, nullable: true, type: Number })
    @Column({ type: "numeric", nullable: true })
    ml?: number | null;

    @ApiProperty({ required: false, nullable: true, description: "CPC 47 (used for all secoes)" })
    @Column({ type: "boolean", nullable: true })
    is_cpc47?: boolean | null;

    @ApiProperty({ required: false, nullable: true })
    @Column({ type: "text", nullable: true })
    claim?: string | null;

    @ApiProperty({ required: false, nullable: true, type: String })
    @Column({ type: "date", nullable: true })
    data_claim?: string | null;

    @ApiProperty({ required: false, nullable: true })
    @Column({ type: "text", nullable: true })
    observacoes_admin?: string | null;

    @ApiProperty({ required: false, nullable: true })
    @Column({ type: "text", nullable: true })
    observacoes_chefe?: string | null;

    @ApiProperty({ required: false, nullable: true, type: String })
    @Column({ type: "date", nullable: true })
    data_criacao_pep?: string | null;

    @ApiProperty({ required: false, nullable: true })
    @Column({ type: "text", nullable: true })
    idioma?: string | null;

    @ApiProperty({ required: false, nullable: true })
    @Column({ type: "text", nullable: true })
    contato_cliente_para?: string | null;

    @ApiProperty({ required: false, nullable: true })
    @Column({ type: "text", nullable: true })
    contato_cliente_cc?: string | null;

    @ApiProperty({ required: false, nullable: true })
    @Column({ type: "text", nullable: true })
    contato_weg_para?: string | null;

    @ApiProperty({ required: false, nullable: true })
    @Column({ type: "text", nullable: true })
    contato_weg_cc?: string | null;

    @ApiProperty({ required: false, nullable: true })
    @Column({ type: "boolean", nullable: true })
    custos_ipex?: boolean | null;

    // ─── Workflow ───────────────────────────────────────────────────────────────

    @ApiProperty({ required: true, default: "RASCUNHO" })
    @Column({ type: "text", default: "RASCUNHO" })
    workflow_status!: string;

    @ApiProperty({ required: false, nullable: true })
    @Column({ type: "text", nullable: true })
    anexo_ov?: string | null;

    @ApiProperty({ required: false, nullable: true })
    @Column({ type: "text", nullable: true })
    anexo_outro?: string | null;

    // ─── Timestamps ────────────────────────────────────────────────────────────

    @ApiProperty({ required: true, type: String })
    @CreateDateColumn({ type: "timestamptz", default: () => "now()" })
    created_at!: Date;

    @ApiProperty({ required: true, type: String })
    @UpdateDateColumn({ type: "timestamptz", default: () => "now()" })
    updated_at!: Date;

    @ApiProperty({ required: false, type: () => [ProjetoItem] })
    @OneToMany(() => ProjetoItem, (i) => i.projeto)
    items?: ProjetoItem[];
}

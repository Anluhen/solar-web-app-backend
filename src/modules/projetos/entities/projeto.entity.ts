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
import ProjetoPep from "./projeto-pep.entity";

@Entity("projetos")
@Index("projetos_pep_prefix_idx", ["pep_prefix"])
export default class Projeto {
    @ApiProperty({
        required: true,
        type: String,
        description: "Projeto id (bigint as string)",
    })
    @PrimaryGeneratedColumn({ type: "bigint" })
    id!: string;

    @ApiProperty({
        required: false,
        nullable: true,
        description: "Seção: Solar | Acionamentos/Sistemas",
    })
    @Column({ type: "text", nullable: true })
    secao?: string | null;

    @ApiProperty({ required: true, description: "Nome do projeto / UFV" })
    @Column({ type: "text" })
    nome!: string;

    @ApiProperty({ required: false, nullable: true, description: "Cliente" })
    @Column({ type: "text", nullable: true })
    cliente?: string | null;

    @ApiProperty({
        required: false,
        nullable: true,
        description:
            "Tipo do produto (Solar: Tipo1 / Sistemas: Linha de Produto)",
    })
    @Column({ type: "text", nullable: true })
    produto?: string | null;

    @ApiProperty({ required: true, description: "Prefixo do PEP (XXX-XXXXXX)" })
    @Column({ type: "text" })
    pep_prefix!: string;

    @ApiProperty({ required: true, description: "Gerente de Projeto" })
    @Column({ type: "text" })
    pm!: string;

    @ApiProperty({
        required: false,
        nullable: true,
        description: "Analista responsável (legado)",
    })
    @Column({ type: "text", nullable: true })
    analista?: string | null;

    @ApiProperty({
        required: true,
        default: false,
        description:
            "Projeto já iniciado (permite editar quantidades entregues)",
    })
    @Column({ type: "boolean", default: false })
    already_started!: boolean;

    // ─── Solar only ────────────────────────────────────────────────────────────

    @ApiProperty({
        required: false,
        nullable: true,
        description: "ZVGP (OV) nível projeto — Solar",
    })
    @Column({ type: "text", nullable: true })
    zvgp_projeto?: string | null;

    @ApiProperty({
        required: false,
        nullable: true,
        description: "ZRGP (OV interno) — Solar",
    })
    @Column({ type: "text", nullable: true })
    zrgp?: string | null;

    @ApiProperty({
        required: false,
        nullable: true,
        description: "Data de preparação — Solar",
        type: String,
    })
    @Column({ type: "date", nullable: true })
    data_preparacao?: string | null;

    @ApiProperty({
        required: false,
        nullable: true,
        description: "PEP Faturável (sufixo, ex: -11) — Solar",
    })
    @Column({ type: "text", nullable: true })
    pep_faturavel?: string | null;

    @ApiProperty({
        required: false,
        nullable: true,
        description: "CNS_Ano (ex: DNES 0702/2022) — Solar",
    })
    @Column({ type: "text", nullable: true })
    cns_ano?: string | null;

    @ApiProperty({
        required: false,
        nullable: true,
        description: "Gerador nível projeto — Solar",
    })
    @Column({ type: "text", nullable: true })
    gerador_projeto?: string | null;

    // ─── Sistemas only ─────────────────────────────────────────────────────────

    @ApiProperty({
        required: false,
        nullable: true,
        description: "Ordem de Venda (OV) — Sistemas",
    })
    @Column({ type: "text", nullable: true })
    ordem_venda?: string | null;

    @ApiProperty({
        required: false,
        nullable: true,
        description: "Data Primeiro Envio — Sistemas",
        type: String,
    })
    @Column({ type: "date", nullable: true })
    data_primeiro_envio?: string | null;

    @ApiProperty({
        required: false,
        nullable: true,
        description: "Ordem / Pedido de Compra — Sistemas",
    })
    @Column({ type: "text", nullable: true })
    ordem_pedido_compra?: string | null;

    @ApiProperty({
        required: false,
        nullable: true,
        description: "Valor Total Líquido — Sistemas",
        type: Number,
    })
    @Column({ type: "numeric", nullable: true })
    valor_total_liq?: number | null;

    // ─── Shared ────────────────────────────────────────────────────────────────

    @ApiProperty({
        required: false,
        nullable: true,
        description: "ML",
        type: Number,
    })
    @Column({ type: "numeric", nullable: true })
    ml?: number | null;

    @ApiProperty({
        required: false,
        nullable: true,
        description: "O projeto deve ser CPC?",
    })
    @Column({ type: "boolean", nullable: true })
    is_cpc?: boolean | null;

    @ApiProperty({
        required: false,
        nullable: true,
        description: "Confirma que o projeto é CPC 47?",
    })
    @Column({ type: "boolean", nullable: true })
    is_cpc47?: boolean | null;

    @ApiProperty({
        required: false,
        nullable: true,
        description: "Número CLAIM",
    })
    @Column({ type: "text", nullable: true })
    claim?: string | null;

    @ApiProperty({
        required: false,
        nullable: true,
        description: "Data CLAIM",
        type: String,
    })
    @Column({ type: "date", nullable: true })
    data_claim?: string | null;

    @ApiProperty({
        required: false,
        nullable: true,
        description: "Observações Chefe",
    })
    @Column({ type: "text", nullable: true })
    observacoes_chefe?: string | null;

    @ApiProperty({
        required: false,
        nullable: true,
        description: "Data Criação do PEP",
        type: String,
    })
    @Column({ type: "date", nullable: true })
    data_criacao_pep?: string | null;

    @ApiProperty({
        required: false,
        nullable: true,
        description: "Idioma (padrão: Português)",
    })
    @Column({ type: "text", nullable: true })
    idioma?: string | null;

    @ApiProperty({
        required: false,
        nullable: true,
        description: "Empresa (padrão: 1007)",
    })
    @Column({ type: "text", nullable: true })
    empresa?: string | null;

    @ApiProperty({
        required: false,
        nullable: true,
        description: "Contatos do cliente (separados por ;)",
    })
    @Column({ type: "text", nullable: true })
    contatos_cliente?: string | null;

    @ApiProperty({
        required: false,
        nullable: true,
        description: "Contatos WEG (separados por ;)",
    })
    @Column({ type: "text", nullable: true })
    contatos_weg?: string | null;

    // ─── Timestamps ────────────────────────────────────────────────────────────

    @ApiProperty({ required: true, type: String, description: "ISO date-time" })
    @CreateDateColumn({ type: "timestamptz", default: () => "now()" })
    created_at!: Date;

    @ApiProperty({ required: true, type: String, description: "ISO date-time" })
    @UpdateDateColumn({ type: "timestamptz", default: () => "now()" })
    updated_at!: Date;

    @ApiProperty({
        required: false,
        type: () => [ProjetoPep],
        description: "Listas de materiais (PEPs) do projeto",
    })
    @OneToMany(() => ProjetoPep, (p) => p.projeto)
    peps?: ProjetoPep[];
}

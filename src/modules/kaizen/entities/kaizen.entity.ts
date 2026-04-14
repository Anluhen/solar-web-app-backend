import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm";
import { ApiProperty } from "@nestjs/swagger";

@Entity("kaizens")
export default class KaizenEntity {
    @ApiProperty({ required: true, type: String, description: "Kaizen id (bigint as string)" })
    @PrimaryGeneratedColumn({ type: "bigint" })
    id!: string;

    // ─── Autor ───────────────────────────────────────────────────────────────

    @ApiProperty({ required: true, description: "Nome do colaborador (autor do registro)" })
    @Column({ type: "text" })
    nome!: string;

    @ApiProperty({ required: true, description: "Seção do colaborador: Acionamentos | Sistemas | Solar" })
    @Column({ type: "text" })
    secao!: string;

    @ApiProperty({ required: true, description: "O colaborador é o autor da ideia?" })
    @Column({ type: "boolean", default: true })
    e_autor!: boolean;

    @ApiProperty({ required: false, nullable: true, description: "Nome do autor (quando e_autor = false)" })
    @Column({ type: "text", nullable: true })
    autor_nome?: string | null;

    // ─── Área responsável ────────────────────────────────────────────────────

    @ApiProperty({ required: true, description: "A área responsável é a mesma do autor?" })
    @Column({ type: "boolean", default: true })
    area_responsavel_mesma!: boolean;

    @ApiProperty({ required: false, nullable: true, description: "Seção da área responsável" })
    @Column({ type: "text", nullable: true })
    area_responsavel_secao?: string | null;

    // ─── Área impactada ──────────────────────────────────────────────────────

    @ApiProperty({ required: true, description: "O kaizen será implantado na área do autor?" })
    @Column({ type: "boolean", default: true })
    area_impactada_mesma!: boolean;

    @ApiProperty({ required: false, nullable: true, description: "Seções da área impactada (comma-separated)" })
    @Column({ type: "text", nullable: true })
    area_impactada_secao?: string | null;

    @ApiProperty({ required: false, nullable: true, description: "Local detalhado da área impactada" })
    @Column({ type: "text", nullable: true })
    local_detalhado?: string | null;

    // ─── Detalhamento ────────────────────────────────────────────────────────

    @ApiProperty({ required: true, description: "Classificação do kaizen" })
    @Column({ type: "text", default: "Quick Kaizen" })
    classificacao!: string;

    @ApiProperty({ required: true, description: "Título do kaizen" })
    @Column({ type: "text" })
    titulo!: string;

    @ApiProperty({ required: true, description: "Descrição do problema (situação atual)" })
    @Column({ type: "text" })
    problema!: string;

    @ApiProperty({ required: true, description: "Descrição da melhoria proposta" })
    @Column({ type: "text" })
    melhoria!: string;

    // ─── Workflow ────────────────────────────────────────────────────────────

    @ApiProperty({ required: true, description: "Status: Não cadastrado | Cadastrado", default: "Não cadastrado" })
    @Column({ type: "text", default: "Não cadastrado" })
    status!: string;

    @ApiProperty({ required: false, nullable: true, description: "ID do kaizen no sistema externo" })
    @Column({ type: "text", nullable: true })
    id_kaizen?: string | null;

    // ─── Timestamp ───────────────────────────────────────────────────────────

    @ApiProperty({ required: true, type: String, description: "ISO date-time" })
    @CreateDateColumn({ type: "timestamptz", default: () => "now()" })
    created_at!: Date;
}

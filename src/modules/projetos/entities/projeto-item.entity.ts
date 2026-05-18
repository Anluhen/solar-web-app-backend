import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
    UpdateDateColumn,
    RelationId,
} from "typeorm";
import { ApiProperty } from "@nestjs/swagger";
import Projeto from "./projeto.entity";

@Entity("projeto_items")
export default class ProjetoItem {
    @ApiProperty({ required: true, type: String, description: "ProjetoItem id (bigint as string)" })
    @PrimaryGeneratedColumn({ type: "bigint" })
    id!: string;

    @ApiProperty({ required: true, type: () => Projeto })
    @ManyToOne(() => Projeto, (p) => p.items, {
        onDelete: "CASCADE",
        nullable: false,
    })
    @JoinColumn({ name: "projeto_id" })
    projeto!: Projeto;

    @ApiProperty({ required: true, type: String, description: "Projeto id (bigint as string)" })
    @RelationId((i: ProjetoItem) => i.projeto)
    projeto_id!: string;

    @ApiProperty({ required: true, type: String, description: "Código SAP (bigint as string)" })
    @Column({ type: "bigint" })
    sap!: string;

    @ApiProperty({ required: true })
    @Column({ type: "text" })
    descricao!: string;

    @ApiProperty({ required: true })
    @Column({ type: "integer" })
    quantidade_necessaria!: number;

    @ApiProperty({ required: false, nullable: true })
    @Column({ type: "integer", nullable: true })
    quantidade_entregue_manual?: number | null;

    @ApiProperty({ required: false, nullable: true })
    @Column({ type: "text", nullable: true })
    grupo?: string | null;

    @ApiProperty({ required: true, type: String })
    @CreateDateColumn({ type: "timestamptz", default: () => "now()" })
    created_at!: Date;

    @ApiProperty({ required: true, type: String })
    @UpdateDateColumn({ type: "timestamptz", default: () => "now()" })
    updated_at!: Date;
}

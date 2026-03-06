import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
    UpdateDateColumn,
    OneToMany,
    Index,
    RelationId,
} from "typeorm";
import { ApiProperty } from "@nestjs/swagger";
import Projeto from "./projeto.entity";
import ProjetoItem from "./projeto-item.entity";

@Entity("projeto_peps")
@Index("projeto_peps_zvgp_idx", ["zvgp"])
@Index("projeto_peps_gerador_idx", ["gerador"])
export default class ProjetoPep {
    @ApiProperty({
        required: true,
        type: String,
        description: "ProjetoPep id (bigint as string)",
    })
    @PrimaryGeneratedColumn({ type: "bigint" })
    id!: string;

    @ApiProperty({
        required: true,
        type: () => Projeto,
        description: "Projeto ao qual este PEP pertence",
    })
    @ManyToOne(() => Projeto, (p) => p.peps, {
        onDelete: "CASCADE",
        nullable: false,
    })
    @JoinColumn({ name: "projeto_id" })
    projeto!: Projeto;

    @ApiProperty({
        required: true,
        type: String,
        description: "Projeto id (bigint as string)",
    })
    @RelationId((p: ProjetoPep) => p.projeto)
    projeto_id!: string;

    @ApiProperty({
        required: false,
        nullable: true,
        description: "Nome descritivo desta lista de materiais (opcional)",
    })
    @Column({ type: "text", nullable: true })
    nome?: string | null;

    @ApiProperty({
        required: true,
        description: "Sufixo do PEP (ex: -001)",
    })
    @Column({ type: "text" })
    pep_suffix!: string;

    @ApiProperty({ required: true, description: "Código ZVGP desta lista" })
    @Column({ type: "text" })
    zvgp!: string;

    @ApiProperty({ required: true, description: "Código Gerador desta lista" })
    @Column({ type: "text" })
    gerador!: string;

    @ApiProperty({ required: true, type: String, description: "ISO date-time" })
    @CreateDateColumn({ type: "timestamptz", default: () => "now()" })
    created_at!: Date;

    @ApiProperty({ required: true, type: String, description: "ISO date-time" })
    @UpdateDateColumn({ type: "timestamptz", default: () => "now()" })
    updated_at!: Date;

    @ApiProperty({
        required: false,
        type: () => [ProjetoItem],
        description: "Itens desta lista de materiais",
    })
    @OneToMany(() => ProjetoItem, (i) => i.projeto_pep)
    items?: ProjetoItem[];
}

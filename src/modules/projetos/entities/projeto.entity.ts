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

    @ApiProperty({ required: true, description: "Nome do projeto / UFV" })
    @Column({ type: "text" })
    nome!: string;

    @ApiProperty({ required: true, description: "Prefixo do PEP (XXX-XXXXXX)" })
    @Column({ type: "text" })
    pep_prefix!: string;

    @ApiProperty({ required: true, description: "Gerente de Projeto" })
    @Column({ type: "text" })
    pm!: string;

    @ApiProperty({ required: true, description: "Analista responsável" })
    @Column({ type: "text" })
    analista!: string;

    @ApiProperty({
        required: true,
        default: false,
        description: "Projeto já iniciado (permite editar quantidades entregues)",
    })
    @Column({ type: "boolean", default: false })
    already_started!: boolean;

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

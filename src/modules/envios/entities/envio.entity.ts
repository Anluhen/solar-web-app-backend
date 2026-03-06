import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    OneToMany,
    Check,
    Index,
} from "typeorm";
import MaterialEntity from "../../materiais/entities/material.entity";
import { ApiProperty } from "@nestjs/swagger";
import { StatusEnvio } from "../rules/status.rules";

@Entity("envios")
@Check(`"status" IN ('RASCUNHO','SEPARACAO','ENVIADO','ENTREGUE','CANCELADO')`)
@Index("envios_gerador_idx", ["gerador"])
@Index("envios_pep_idx", ["pep"])
@Index("envios_zvgp_idx", ["zvgp"])
@Index("envios_ufv_idx", ["ufv"])
export default class Envio {
    // bigint -> prefer string in TS to avoid precision loss
    @ApiProperty({
        required: true,
        type: String,
        description: "Envio id (bigint as string)",
    })
    @PrimaryGeneratedColumn({ type: "bigint" })
    id!: string;

    @ApiProperty({ required: true })
    @Column({ type: "text" })
    pep!: string;

    @ApiProperty({ required: true })
    @Column({ type: "text" })
    zvgp!: string;

    @ApiProperty({ required: true })
    @Column({ type: "text" })
    gerador!: string;

    @ApiProperty({ required: true, description: "Nome da UFV" })
    @Column({ type: "text" })
    ufv!: string;

    @ApiProperty({ required: false, nullable: true })
    @Column({ type: "text", nullable: true })
    observacoes?: string | null;

    @ApiProperty({
        required: true,
        enum: StatusEnvio,
        default: StatusEnvio.RASCUNHO,
    })
    @Column({ type: "text", default: StatusEnvio.RASCUNHO })
    status!: StatusEnvio;

    @ApiProperty({ required: true, type: String, description: "ISO date-time" })
    @CreateDateColumn({ type: "timestamptz", default: () => "now()" })
    created_at!: Date;

    @ApiProperty({ required: true, type: String, description: "ISO date-time" })
    @UpdateDateColumn({ type: "timestamptz", default: () => "now()" })
    updated_at!: Date;

    @ApiProperty({ required: true, type: String, description: "YYYY-MM-DD" })
    @Column({ type: "date", default: () => "CURRENT_DATE" })
    separacao!: string;

    @ApiProperty({ required: false, nullable: true, type: String, description: "YYYY-MM-DD — date when shipment was dispatched" })
    @Column({ type: "date", nullable: true })
    data_enviado?: string | null;

    @ApiProperty({ required: false, nullable: true, type: String, description: "YYYY-MM-DD — date when delivery was confirmed" })
    @Column({ type: "date", nullable: true })
    data_entregue?: string | null;

    @ApiProperty({ required: false, nullable: true, type: String, description: "YYYY-MM-DD — estimated arrival date" })
    @Column({ type: "date", nullable: true })
    previsao_chegada?: string | null;

    @ApiProperty({
        required: false,
        type: () => [MaterialEntity],
        description: "Related materials (when included)",
    })
    @OneToMany(() => MaterialEntity, (m) => m.envio)
    materiais?: MaterialEntity[];
}

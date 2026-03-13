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
import { IsDate, IsInt, IsNotEmpty, IsString } from "class-validator";
import Envio from "../../envios/entities/envio.entity";

@Entity("materiais")
export default class Material {
    // bigint in DB -> string in TS
    @ApiProperty({
        required: true,
        type: String,
        description: "Material id (bigint as string)",
    })
    @PrimaryGeneratedColumn({ type: "bigint" })
    id!: string;

    // IMPORTANT: Every Material must belong to an Envio.
    // This relation/column is NOT NULL at the DB level.
    // The `envio` relation may not be serialized unless included, but
    // the foreign key `envio_id` is always required.
    @ApiProperty({
        required: true,
        description: "Envio relation (included when requested)",
        type: () => Envio,
    })
    @ManyToOne(() => Envio, (e) => e.materiais, {
        onDelete: "CASCADE",
        nullable: false,
    })
    @JoinColumn({ name: "envio_id" })
    envio!: Envio;

    // expose FK id to match DB/API shape
    @ApiProperty({
        required: true,
        type: String,
        description: "Envio id (bigint as string)",
    })
    @IsString()
    @RelationId((m: Material) => m.envio)
    envio_id!: string;

    @ApiProperty({
        required: true,
        type: String,
        description: "SAP code (bigint as string)",
    })
    @IsString()
    @Column({ type: "bigint" })
    sap!: string;

    @ApiProperty({ required: true })
    @IsString()
    @IsNotEmpty()
    @Column({ type: "text" })
    descricao!: string;

    @ApiProperty({ required: true })
    @IsInt()
    @Column({ type: "integer" })
    quantidade!: number;

    @ApiProperty({ required: true })
    @IsDate()
    @CreateDateColumn({ type: "timestamptz", default: () => "now()" })
    created_at!: Date;

    @ApiProperty({ required: true })
    @IsDate()
    @UpdateDateColumn({ type: "timestamptz", default: () => "now()" })
    updated_at!: Date;
}

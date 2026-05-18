import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
} from "typeorm";
import { ApiProperty } from "@nestjs/swagger";

@Entity("project_bosses")
export default class ProjectBoss {
    @ApiProperty({ type: String, description: "ProjectBoss id (bigint as string)" })
    @PrimaryGeneratedColumn({ type: "bigint" })
    id!: string;

    @ApiProperty({ description: "Nome do chefe" })
    @Column({ type: "text" })
    name!: string;

    @ApiProperty({ description: "E-mail do chefe" })
    @Column({ type: "text" })
    email!: string;

    @ApiProperty({ description: "Seção: Manager | Solar | Acionamentos | Sistemas" })
    @Column({ type: "text" })
    secao!: string;
}

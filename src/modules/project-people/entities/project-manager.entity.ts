import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
} from "typeorm";
import { ApiProperty } from "@nestjs/swagger";

@Entity("project_managers")
export default class ProjectManager {
    @ApiProperty({ type: String, description: "ProjectManager id (bigint as string)" })
    @PrimaryGeneratedColumn({ type: "bigint" })
    id!: string;

    @ApiProperty({ description: "Nome do PM" })
    @Column({ type: "text" })
    name!: string;

    @ApiProperty({ description: "E-mail do PM" })
    @Column({ type: "text" })
    email!: string;

    @ApiProperty({ description: "Seção: Solar | Acionamentos | Sistemas" })
    @Column({ type: "text" })
    secao!: string;
}

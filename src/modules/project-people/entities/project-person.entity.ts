import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
} from "typeorm";
import { ApiProperty } from "@nestjs/swagger";

@Entity("project_people")
export default class ProjectPerson {
    @ApiProperty({ type: String, description: "ProjectPerson id (bigint as string)" })
    @PrimaryGeneratedColumn({ type: "bigint" })
    id!: string;

    @ApiProperty({ description: "Nome" })
    @Column({ type: "text" })
    name!: string;

    @ApiProperty({ description: "E-mail" })
    @Column({ type: "text" })
    email!: string;

    @ApiProperty({ description: "Seção: Solar | Acionamentos | Sistemas | wau" })
    @Column({ type: "text" })
    secao!: string;

    @ApiProperty({ description: "Position: dev | admin | boss | pm | finance | controller" })
    @Column({ type: "text" })
    position!: string;
}

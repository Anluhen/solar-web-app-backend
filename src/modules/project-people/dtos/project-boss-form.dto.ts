import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export default class ProjectBossFormDto {
    @ApiProperty({ description: "Nome do chefe" })
    @IsString()
    @IsNotEmpty()
    name!: string;

    @ApiProperty({ description: "E-mail do chefe" })
    @IsString()
    @IsNotEmpty()
    email!: string;

    @ApiProperty({ description: "Seção: Manager | Solar | Acionamentos | Sistemas" })
    @IsString()
    @IsNotEmpty()
    secao!: string;
}

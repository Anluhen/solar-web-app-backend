import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export default class ProjectManagerFormDto {
    @ApiProperty({ description: "Nome do PM" })
    @IsString()
    @IsNotEmpty()
    name!: string;

    @ApiProperty({ description: "E-mail do PM" })
    @IsString()
    @IsNotEmpty()
    email!: string;

    @ApiProperty({ description: "Seção: Solar | Acionamentos | Sistemas" })
    @IsString()
    @IsNotEmpty()
    secao!: string;
}

import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export default class ProjectPersonFormDto {
    @ApiProperty({ description: "Nome" })
    @IsString()
    @IsNotEmpty()
    name!: string;

    @ApiProperty({ description: "E-mail" })
    @IsString()
    @IsNotEmpty()
    email!: string;

    @ApiProperty({ description: "Seção: Solar | Acionamentos | Sistemas | wau" })
    @IsString()
    @IsNotEmpty()
    secao!: string;

    @ApiProperty({ description: "Position: dev | admin | boss | pm | finance | controller" })
    @IsString()
    @IsNotEmpty()
    position!: string;
}

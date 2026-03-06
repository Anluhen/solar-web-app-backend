import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export default class ProjetoPepFormDto {
    @ApiProperty({
        description: "Nome descritivo desta lista (opcional)",
        required: false,
        nullable: true,
    })
    @IsString()
    @IsOptional()
    nome?: string | null;

    @ApiProperty({ description: "Sufixo do PEP (ex: -001)" })
    @IsString()
    @IsNotEmpty()
    pep_suffix!: string;

    @ApiProperty({ description: "Código ZVGP desta lista" })
    @IsString()
    @IsNotEmpty()
    zvgp!: string;

    @ApiProperty({ description: "Código Gerador desta lista" })
    @IsString()
    @IsNotEmpty()
    gerador!: string;
}

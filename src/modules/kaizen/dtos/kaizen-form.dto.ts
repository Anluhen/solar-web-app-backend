import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsNotEmpty, IsOptional, IsString, MaxLength } from "class-validator";

export default class KaizenFormDto {
    // ─── Autor ───────────────────────────────────────────────────────────────

    @ApiProperty({ required: true })
    @IsString()
    @IsNotEmpty()
    nome!: string;

    @ApiProperty({ required: true, description: "Acionamentos | Sistemas | Solar" })
    @IsString()
    @IsNotEmpty()
    secao!: string;

    @ApiProperty({ required: true })
    @IsBoolean()
    e_autor!: boolean;

    @ApiProperty({ required: false, nullable: true })
    @IsOptional()
    @IsString()
    autor_nome?: string | null;

    // ─── Área responsável ────────────────────────────────────────────────────

    @ApiProperty({ required: true })
    @IsBoolean()
    area_responsavel_mesma!: boolean;

    @ApiProperty({ required: false, nullable: true })
    @IsOptional()
    @IsString()
    area_responsavel_secao?: string | null;

    // ─── Área impactada ──────────────────────────────────────────────────────

    @ApiProperty({ required: true })
    @IsBoolean()
    area_impactada_mesma!: boolean;

    @ApiProperty({ required: false, nullable: true })
    @IsOptional()
    @IsString()
    area_impactada_secao?: string | null;

    @ApiProperty({ required: false, nullable: true, maxLength: 150 })
    @IsOptional()
    @IsString()
    @MaxLength(150)
    local_detalhado?: string | null;

    // ─── Detalhamento ────────────────────────────────────────────────────────

    @ApiProperty({ required: true })
    @IsString()
    @IsNotEmpty()
    classificacao!: string;

    @ApiProperty({ required: true, maxLength: 150 })
    @IsString()
    @IsNotEmpty()
    @MaxLength(150)
    titulo!: string;

    @ApiProperty({ required: true, maxLength: 750 })
    @IsString()
    @IsNotEmpty()
    @MaxLength(750)
    problema!: string;

    @ApiProperty({ required: true, maxLength: 750 })
    @IsString()
    @IsNotEmpty()
    @MaxLength(750)
    melhoria!: string;
}

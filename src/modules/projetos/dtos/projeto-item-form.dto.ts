import { ApiProperty } from "@nestjs/swagger";
import { IsInt, IsNotEmpty, IsOptional, IsString } from "class-validator";

export default class ProjetoItemFormDto {
    @ApiProperty({ type: String, description: "Código SAP (bigint como string)" })
    @IsString()
    @IsNotEmpty()
    sap!: string;

    @ApiProperty({ description: "Descrição do material" })
    @IsString()
    @IsNotEmpty()
    descricao!: string;

    @ApiProperty({ description: "Quantidade necessária" })
    @IsInt()
    quantidade_necessaria!: number;

    @ApiProperty({
        required: false,
        nullable: true,
        description: "Quantidade entregue manualmente (base pré-sistema)",
    })
    @IsInt()
    @IsOptional()
    quantidade_entregue_manual?: number | null;

    @ApiProperty({ required: false, nullable: true })
    @IsString()
    @IsOptional()
    grupo?: string | null;
}

import { ApiProperty } from "@nestjs/swagger";
import { IsInt, IsNotEmpty, IsOptional, IsString } from "class-validator";

export default class MaterialFormDto {
    @ApiProperty({
        required: true,
        description: "Relation envio id (bigint as string)",
    })
    @IsString()
    envio_id!: string;

    @ApiProperty({
        required: false,
        description: "SAP code (bigint as string)",
    })
    @IsOptional()
    @IsString()
    sap?: string;

    @ApiProperty({ required: true })
    @IsString()
    @IsNotEmpty()
    descricao!: string;

    @ApiProperty({ required: true })
    @IsInt()
    quantidade!: number;
}

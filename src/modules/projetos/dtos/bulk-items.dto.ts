import { ApiProperty } from "@nestjs/swagger";
import { IsArray, ValidateNested } from "class-validator";
import { Type } from "class-transformer";
import ProjetoItemFormDto from "./projeto-item-form.dto";

export default class BulkItemsDto {
    @ApiProperty({
        type: () => [ProjetoItemFormDto],
        description:
            "Lista de itens a substituir (substitui todos os existentes)",
    })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ProjetoItemFormDto)
    items!: ProjetoItemFormDto[];
}

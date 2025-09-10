import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export default class ItemFormDto {
    @ApiProperty({
        required: true,
    })
    @IsString()
    @IsNotEmpty()
    public name: string;

    @ApiProperty({
        required: true,
    })
    @IsString()
    @IsNotEmpty()
    public description: string;
}

import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsString } from "class-validator";

export default class ItemEntity {
    @ApiProperty({
        required: true,
    })
    @IsNumber()
    @IsNotEmpty()
    public id: number;

    @ApiProperty({
        required: true,
    })
    @IsString()
    @IsNotEmpty()
    public description: string;
}

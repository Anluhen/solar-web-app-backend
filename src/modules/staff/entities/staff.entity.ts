import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsString } from "class-validator";
import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("staff")
export default class StaffEntity {
    @ApiProperty({
        required: true,
    })
    @IsNumber()
    @IsNotEmpty()
    @PrimaryGeneratedColumn("increment")
    public id: number;

    @ApiProperty({
        required: true,
    })
    @IsString()
    @IsNotEmpty()
    @Column()
    public name: string;

    @ApiProperty({
        required: true,
    })
    @IsString()
    @IsNotEmpty()
    @Column()
    public description: string;
}

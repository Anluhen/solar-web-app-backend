import { IsNotEmpty, IsString } from "class-validator";

export class FileFormDto {
    @IsString()
    @IsNotEmpty()
    fileName: string;
}

import { IsString } from "class-validator";

export class DeleteFileResponseDto {
    @IsString()
    message: string;

    @IsString()
    fileName: string;
}

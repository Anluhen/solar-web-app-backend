import { IsString } from "class-validator";

export class CreateFileResponseDto {
    @IsString()
    message: string;

    @IsString()
    fileName: string;

    @IsString()
    etag: string;
}

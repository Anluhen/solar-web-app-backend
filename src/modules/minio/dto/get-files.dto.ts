import { IsArray, IsString } from "class-validator";

export class GetFilesNamesDto {
    @IsArray()
    @IsString({ each: true })
    files: string[];
}

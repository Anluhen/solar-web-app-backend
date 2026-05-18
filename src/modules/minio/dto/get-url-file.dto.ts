import { IsString } from "class-validator";

export class GetUrlFileDto {
    @IsString()
    url: string;
}

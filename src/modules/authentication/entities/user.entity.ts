import { ApiProperty } from "@nestjs/swagger";

export default class UserEntity {
    @ApiProperty()
    public name: string;

    @ApiProperty()
    public username: string;

    @ApiProperty()
    public token: string;

    @ApiProperty()
    public roles: string[] = [];
}

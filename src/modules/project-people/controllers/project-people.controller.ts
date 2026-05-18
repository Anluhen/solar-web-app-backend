import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Param,
    Body,
    Query,
    Inject,
    Headers,
    UnauthorizedException,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiQuery } from "@nestjs/swagger";
import { IProjectPeopleService } from "../interfaces/project-people.service.interface";
import ProjectPersonFormDto from "../dtos/project-person-form.dto";

@ApiTags("project-people")
@Controller("project-people")
export class ProjectPeopleController {
    constructor(
        @Inject(IProjectPeopleService)
        private readonly service: IProjectPeopleService,
    ) {}

    @Get("me")
    @ApiOperation({ summary: "Get current user entries from people table by email" })
    getMe(@Headers("x-user-email") email?: string) {
        if (!email) throw new UnauthorizedException("x-user-email header required");
        return this.service.getMe(email);
    }

    @Get()
    @ApiOperation({ summary: "List people, optionally filtered by secao and/or position" })
    @ApiQuery({ name: "secao", required: false, type: String })
    @ApiQuery({ name: "position", required: false, type: String })
    getPeople(
        @Query("secao") secao?: string,
        @Query("position") position?: string,
    ) {
        return this.service.getPeople(secao, position);
    }

    @Get(":id")
    @ApiOperation({ summary: "Get a person by id" })
    getPerson(@Param("id") id: string) {
        return this.service.getPerson(id);
    }

    @Post()
    @ApiOperation({ summary: "Create a person" })
    postPerson(@Body() dto: ProjectPersonFormDto) {
        return this.service.postPerson(dto);
    }

    @Put(":id")
    @ApiOperation({ summary: "Update a person" })
    putPerson(@Param("id") id: string, @Body() dto: ProjectPersonFormDto) {
        return this.service.putPerson(id, dto);
    }

    @Delete(":id")
    @ApiOperation({ summary: "Delete a person" })
    deletePerson(@Param("id") id: string) {
        return this.service.deletePerson(id);
    }
}

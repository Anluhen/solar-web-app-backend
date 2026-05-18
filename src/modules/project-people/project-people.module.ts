import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import ProjectPerson from "./entities/project-person.entity";
import projectPeopleServiceProvider from "./services/project-people.service";
import { ProjectPeopleController } from "./controllers/project-people.controller";

@Module({
    imports: [
        TypeOrmModule.forFeature([ProjectPerson], "postgreConnection"),
    ],
    controllers: [ProjectPeopleController],
    providers: [projectPeopleServiceProvider],
    exports: [TypeOrmModule, projectPeopleServiceProvider],
})
export default class ProjectPeopleModule {}

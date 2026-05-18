import ProjectPerson from "../entities/project-person.entity";
import ProjectPersonFormDto from "../dtos/project-person-form.dto";

export abstract class IProjectPeopleService {
    abstract getPeople(secao?: string, position?: string): Promise<ProjectPerson[]>;
    abstract getPerson(id: string): Promise<ProjectPerson>;
    abstract getMe(email: string): Promise<ProjectPerson[]>;
    abstract postPerson(dto: ProjectPersonFormDto): Promise<ProjectPerson>;
    abstract putPerson(id: string, dto: ProjectPersonFormDto): Promise<ProjectPerson>;
    abstract deletePerson(id: string): Promise<void>;
}

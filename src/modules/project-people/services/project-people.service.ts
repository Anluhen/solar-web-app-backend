import { ClassProvider, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { ILike, Repository } from "typeorm";
import ProjectPerson from "../entities/project-person.entity";
import ProjectPersonFormDto from "../dtos/project-person-form.dto";
import { IProjectPeopleService } from "../interfaces/project-people.service.interface";

@Injectable()
class ProjectPeopleService implements IProjectPeopleService {
    constructor(
        @InjectRepository(ProjectPerson, "postgreConnection")
        private readonly repo: Repository<ProjectPerson>,
    ) {}

    async getPeople(secao?: string, position?: string): Promise<ProjectPerson[]> {
        const where: any = {};
        if (secao) where.secao = ILike(secao);
        if (position) where.position = ILike(position);
        return this.repo.find({ where, order: { name: "ASC" } });
    }

    async getPerson(id: string): Promise<ProjectPerson> {
        const p = await this.repo.findOne({ where: { id } });
        if (!p) throw new NotFoundException(`ProjectPerson ${id} not found`);
        return p;
    }

    async getMe(email: string): Promise<ProjectPerson[]> {
        return this.repo.find({ where: { email }, order: { secao: "ASC" } });
    }

    async postPerson(dto: ProjectPersonFormDto): Promise<ProjectPerson> {
        const entity = this.repo.create(dto);
        return this.repo.save(entity);
    }

    async putPerson(id: string, dto: ProjectPersonFormDto): Promise<ProjectPerson> {
        await this.getPerson(id);
        await this.repo.update(id, dto);
        return this.getPerson(id);
    }

    async deletePerson(id: string): Promise<void> {
        await this.getPerson(id);
        await this.repo.delete(id);
    }
}

const projectPeopleServiceProvider: ClassProvider<IProjectPeopleService> = {
    provide: IProjectPeopleService,
    useClass: ProjectPeopleService,
};

export default projectPeopleServiceProvider;

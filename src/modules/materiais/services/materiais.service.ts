import {
    BadRequestException,
    ClassProvider,
    Injectable,
    NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import MaterialEntity from "../entities/material.entity";
import MaterialFormDto from "../dtos/material-form.dto";
import Envio from "../../envios/entities/envio.entity";
import { IMateriaisService } from "../interfaces/materiais.service.interface";

@Injectable()
class MateriaisService implements IMateriaisService {
    constructor(
        @InjectRepository(MaterialEntity, "postgreConnection")
        private readonly repo: Repository<MaterialEntity>,
        @InjectRepository(Envio, "postgreConnection")
        private readonly envioRepo: Repository<Envio>,
    ) {}

    async postMaterial(materialDto: MaterialFormDto): Promise<MaterialEntity> {
        const material = this.repo.create({
            descricao: materialDto.descricao,
            quantidade: materialDto.quantidade,
        });

        // relation is required: every material must belong to an envio
        if (!materialDto.envio_id) {
            throw new BadRequestException("envio_id is required for Material");
        }
        const envio = await this.envioRepo.findOne({
            where: { id: materialDto.envio_id },
        });
        if (!envio)
            throw new NotFoundException(
                `Envio ${materialDto.envio_id} not found`,
            );
        (material as any).envio = envio;

        // sap has DB default via sequence; only set if provided
        if (materialDto.sap) (material as any).sap = materialDto.sap;

        const saved = await this.repo.save(material);
        return saved;
    }

    async getMateriais(): Promise<MaterialEntity[]> {
        const list = await this.repo.find({ order: { id: "DESC" } });
        return list;
    }

    async getMateriaisByEnvio(envioId: string): Promise<MaterialEntity[]> {
        const list = await this.repo.find({
            where: { envio: { id: envioId } as any },
            order: { id: "DESC" },
        });
        return list;
    }

    async getMaterial(
        id: string,
        opts?: { withEnvio?: boolean },
    ): Promise<MaterialEntity> {
        const relations = opts?.withEnvio ? { envio: true } : undefined;
        const material = await this.repo.findOne({ where: { id }, relations });
        if (!material) throw new NotFoundException(`Material ${id} not found`);
        return material;
    }

    async putMaterial(
        id: string,
        newMaterial: MaterialFormDto,
    ): Promise<MaterialEntity> {
        const existing = await this.repo.findOne({
            where: { id },
            relations: { envio: true },
        });
        if (!existing) throw new NotFoundException(`Material ${id} not found`);

        // Update scalar fields
        if (newMaterial.descricao !== undefined)
            existing.descricao = newMaterial.descricao;
        if (newMaterial.quantidade !== undefined)
            existing.quantidade = newMaterial.quantidade;
        if (newMaterial.sap !== undefined)
            (existing as any).sap = newMaterial.sap;

        // Re-point relation if envio_id provided (must be a valid id; cannot be null)
        if (newMaterial.envio_id !== undefined) {
            if ((newMaterial as any).envio_id === null) {
                throw new BadRequestException("envio_id cannot be null");
            }
            const envio = await this.envioRepo.findOne({
                where: { id: newMaterial.envio_id },
            });
            if (!envio)
                throw new NotFoundException(
                    `Envio ${newMaterial.envio_id} not found`,
                );
            (existing as any).envio = envio;
        }

        const saved = await this.repo.save(existing);
        return saved;
    }

    async deleteMaterial(
        id: string,
    ): Promise<{ deleted: boolean; id: string }> {
        const existing = await this.repo.findOne({ where: { id } });
        if (!existing) throw new NotFoundException(`Material ${id} not found`);
        await this.repo.remove(existing);
        return { deleted: true, id };
    }
}

const materiaisServiceProvider: ClassProvider<IMateriaisService> = {
    provide: IMateriaisService,
    useClass: MateriaisService,
};

export default materiaisServiceProvider;

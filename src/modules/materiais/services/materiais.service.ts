import { ClassProvider, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import MaterialEntity from "../entities/material.entity";
import MaterialOrmEntity from "../entities/material.orm-entity";
import MaterialFormDto from "../dtos/material-form.dto";
import Envio from "../../envios/entities/envio.entity";
import { IMateriaisService } from "../interfaces/materiais.service.interface";

@Injectable()
class MateriaisService implements IMateriaisService {
  constructor(
    @InjectRepository(MaterialOrmEntity, "postgreConnection") private readonly repo: Repository<MaterialOrmEntity>,
    @InjectRepository(Envio, "postgreConnection") private readonly envioRepo: Repository<Envio>,
  ) { }

  private toDto(entity: MaterialOrmEntity): MaterialEntity {
    return {
      id: Number(entity.id),
      envio_id: entity.envio ? Number((entity.envio as any).id) : undefined,
      sap: entity.sap !== undefined && entity.sap !== null ? Number(entity.sap) : 0,
      descricao: entity.descricao,
      quantidade: Number(entity.quantidade),
      created_at: entity.created_at,
      updated_at: entity.updated_at,
    };
  }

  async postMaterial(materialDto: MaterialFormDto): Promise<MaterialEntity> {
    const material = this.repo.create({
      descricao: materialDto.descricao,
      quantidade: materialDto.quantidade,
    });

    // optional relation
    if (materialDto.envio_id) {
      const envio = await this.envioRepo.findOne({ where: { id: materialDto.envio_id } });
      if (!envio) throw new NotFoundException(`Envio ${materialDto.envio_id} not found`);
      (material as any).envio = envio;
    }

    // sap has DB default via sequence; only set if provided
    if (materialDto.sap) (material as any).sap = materialDto.sap;

    const saved = await this.repo.save(material);
    return this.toDto(saved);
  }

  async getMateriais(opts?: { withEnvio?: boolean }): Promise<MaterialEntity[]> {
    const relations = opts?.withEnvio ? { envio: true } : undefined;
    const list = await this.repo.find({ order: { id: 'DESC' }, relations });
    return list.map((e) => this.toDto(e));
  }

  async getMateriaisByEnvio(envioId: number): Promise<MaterialEntity[]> {
    const list = await this.repo.find({
      where: { envio: { id: envioId } as any },
      order: { id: 'DESC' },
    });
    return list.map((e) => this.toDto(e));
  }

  async getMaterial(id: string, opts?: { withEnvio?: boolean }): Promise<MaterialEntity> {
    const relations = opts?.withEnvio ? { envio: true } : undefined;
    const material = await this.repo.findOne({ where: { id }, relations });
    if (!material) throw new NotFoundException(`Material ${id} not found`);
    return this.toDto(material);
  }

  async putMaterial(id: string, newMaterial: MaterialFormDto): Promise<MaterialEntity> {
    const existing = await this.repo.findOne({
      where: { id },
      relations: { envio: true },
    });
    if (!existing) throw new NotFoundException(`Material ${id} not found`);

    // Update scalar fields
    if (newMaterial.descricao !== undefined) existing.descricao = newMaterial.descricao;
    if (newMaterial.quantidade !== undefined) existing.quantidade = newMaterial.quantidade;
    if (newMaterial.sap !== undefined) (existing as any).sap = newMaterial.sap;

    // Re-point relation if envio_id provided (can set to null)
    if (newMaterial.envio_id !== undefined) {
      if (newMaterial.envio_id === null || newMaterial.envio_id === (undefined as any)) {
        (existing as any).envio = null;
      } else {
        const envio = await this.envioRepo.findOne({ where: { id: newMaterial.envio_id } });
        if (!envio) throw new NotFoundException(`Envio ${newMaterial.envio_id} not found`);
        (existing as any).envio = envio;
      }
    }

    const saved = await this.repo.save(existing);
    return this.toDto(saved);
  }

  async deleteMaterial(id: string): Promise<{ deleted: boolean; id: string }> {
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

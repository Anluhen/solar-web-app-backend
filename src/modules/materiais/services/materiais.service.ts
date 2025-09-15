import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Material } from '../entities/material.entity';
import { CreateMaterialDto } from '../dtos/create-material.dto';
import { UpdateMaterialDto } from '../dtos/update-material.dto';
import { Envio } from '../../envios/entities/envio.entity';

@Injectable()
export class MateriaisService {
  constructor(
    @InjectRepository(Material, 'postgreConnection') private readonly repo: Repository<Material>,
    @InjectRepository(Envio, 'postgreConnection') private readonly envioRepo: Repository<Envio>,
  ) { }

  async create(dto: CreateMaterialDto) {
    const material = this.repo.create({
      descricao: dto.descricao,
      quantidade: dto.quantidade,
    });

    // optional relation
    if (dto.envio_id) {
      const envio = await this.envioRepo.findOne({ where: { id: dto.envio_id } });
      if (!envio) throw new NotFoundException(`Envio ${dto.envio_id} not found`);
      (material as any).envio = envio;
    }

    // sap has DB default via sequence; only set if provided
    if (dto.sap) (material as any).sap = dto.sap;

    return this.repo.save(material);
  }

  findAll(opts?: { withEnvio?: boolean }) {
    const relations = opts?.withEnvio ? { envio: true } : undefined;
    return this.repo.find({ order: { id: 'DESC' }, relations });
  }

  findByEnvio(envioId: string) {
    return this.repo.find({
      where: { envio: { id: envioId } as any },
      order: { id: 'DESC' },
    });
  }

  async findOne(id: string, opts?: { withEnvio?: boolean }) {
    const relations = opts?.withEnvio ? { envio: true } : undefined;
    const material = await this.repo.findOne({ where: { id }, relations });
    if (!material) throw new NotFoundException(`Material ${id} not found`);
    return material;
  }

  async update(id: string, dto: UpdateMaterialDto) {
    const existing = await this.repo.findOne({
      where: { id },
      relations: { envio: true },
    });
    if (!existing) throw new NotFoundException(`Material ${id} not found`);

    // Update scalar fields
    if (dto.descricao !== undefined) existing.descricao = dto.descricao;
    if (dto.quantidade !== undefined) existing.quantidade = dto.quantidade;
    if (dto.sap !== undefined) (existing as any).sap = dto.sap;

    // Re-point relation if envio_id provided (can set to null)
    if (dto.envio_id !== undefined) {
      if (dto.envio_id === null || dto.envio_id === (undefined as any)) {
        (existing as any).envio = null;
      } else {
        const envio = await this.envioRepo.findOne({ where: { id: dto.envio_id } });
        if (!envio) throw new NotFoundException(`Envio ${dto.envio_id} not found`);
        (existing as any).envio = envio;
      }
    }

    return this.repo.save(existing);
  }

  async remove(id: string) {
    const existing = await this.repo.findOne({ where: { id } });
    if (!existing) throw new NotFoundException(`Material ${id} not found`);
    await this.repo.remove(existing);
    return { deleted: true, id };
  }
}

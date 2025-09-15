import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Envio } from '../entities/envio.entity';
import { CreateEnvioDto } from '../dtos/create-envio.dto';
import { UpdateEnvioDto } from '../dtos/update-envio.dto';
import { Material } from '../../materiais/entities/material.entity';

@Injectable()
export class EnviosService {
  constructor(
    @InjectRepository(Envio, 'postgreConnection') private readonly repo: Repository<Envio>,
    @InjectRepository(Material, 'postgreConnection') private readonly matRepo: Repository<Material>,
  ) { }

  async create(dto: CreateEnvioDto) {
    const envio = this.repo.create(dto);
    return this.repo.save(envio);
  }

  findAll(opts?: {
    withMateriais?: boolean,
    filters?: { id?: string; pep?: string; zvgp?: string; gerador?: string }
  }) {
    const qb = this.repo.createQueryBuilder('envio');

    if (opts?.withMateriais) {
      qb.leftJoinAndSelect('envio.materiais', 'materiais');
    }

    const f = opts?.filters ?? {};

    if (f.id && String(f.id).trim() !== '') {
      qb.andWhere('envio.id = :id', { id: String(f.id).trim() });
    }
    if (f.pep && f.pep.trim() !== '') {
      qb.andWhere('envio.pep ILIKE :pep', { pep: `%${f.pep.trim()}%` });
    }
    if (f.zvgp && f.zvgp.trim() !== '') {
      qb.andWhere('envio.zvgp ILIKE :zvgp', { zvgp: `%${f.zvgp.trim()}%` });
    }
    if (f.gerador && f.gerador.trim() !== '') {
      qb.andWhere('envio.gerador ILIKE :gerador', { gerador: `%${f.gerador.trim()}%` });
    }

    qb.orderBy('envio.id', 'DESC');
    return qb.getMany();
  }

  async findOne(id: string, opts?: { withMateriais?: boolean }) {
    const relations = opts?.withMateriais ? { materiais: true } : undefined;
    const envio = await this.repo.findOne({ where: { id }, relations });
    if (!envio) throw new NotFoundException(`Envio ${id} not found`);
    return envio;
  }

  async update(id: string, dto: UpdateEnvioDto) {
    const entity = await this.repo.preload({ id, ...dto });
    if (!entity) throw new NotFoundException(`Envio ${id} not found`);
    return this.repo.save(entity);
  }

  async remove(id: string) {
    const entity = await this.repo.findOne({ where: { id } });
    if (!entity) throw new NotFoundException(`Envio ${id} not found`);
    // ON DELETE CASCADE will remove materiais automatically
    await this.repo.remove(entity);
    return { deleted: true, id };
  }
}

import { ClassProvider, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import EnvioEntity from "../entities/envio.entity";
import EnvioFormDto from "../dtos/envio-form.dto";
import { IEnviosService } from "../interfaces/envios.service.interface";

@Injectable()
class EnviosService implements IEnviosService {
  constructor(
    @InjectRepository(EnvioEntity, "postgreConnection") private readonly repo: Repository<EnvioEntity>,
  ) { }

  async postEnvio(dto: EnvioFormDto): Promise<EnvioEntity> {
    const payload = { ...dto, ufv: dto.ufv ?? "SEM NOME" };
    const envio = this.repo.create(payload);
    return this.repo.save(envio);
  }

  getEnvios(opts?: {
    filters?: {
      id?: string;
      pep?: string;
      zvgp?: string;
      gerador?: string;
      ufv?: string;
    };
  }): Promise<EnvioEntity[]> {
    const qb = this.repo.createQueryBuilder('envio');

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
    if (f.ufv && f.ufv.trim() !== '') {
      qb.andWhere('envio.ufv ILIKE :ufv', { ufv: `%${f.ufv.trim()}%` });
    }

    // materiais are fetched via a dedicated endpoint; no relation join here

    qb.orderBy('envio.id', 'ASC');
    return qb.getMany();
  }

  async getEnvio(id: string): Promise<EnvioEntity> {
    const envio = await this.repo.findOne({ where: { id: String(id) } });
    if (!envio) throw new NotFoundException(`Envio ${id} not found`);
    return envio;
  }

  async putEnvio(id: string, dto: EnvioFormDto): Promise<EnvioEntity> {
    const payload = { ...dto, ufv: dto.ufv ?? "SEM NOME" };
    const entity = await this.repo.preload({ id: String(id), ...payload });
    if (!entity) throw new NotFoundException(`Envio ${id} not found`);
    return this.repo.save(entity);
  }

  async deleteEnvio(id: string): Promise<EnvioEntity> {
    const entity = await this.repo.findOne({ where: { id: String(id) } });
    if (!entity) throw new NotFoundException(`Envio ${id} not found`);
    await this.repo.remove(entity);
    return entity;
  }
}

const enviosServiceProvider: ClassProvider<IEnviosService> = {
  provide: IEnviosService,
  useClass: EnviosService,
};

export default enviosServiceProvider;

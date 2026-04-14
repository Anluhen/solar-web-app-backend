import { BadRequestException, ClassProvider, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import KaizenEntity from "../entities/kaizen.entity";
import KaizenFormDto from "../dtos/kaizen-form.dto";
import { IKaizenService } from "../interfaces/kaizen.service.interface";

@Injectable()
class KaizenService implements IKaizenService {
    constructor(
        @InjectRepository(KaizenEntity, "postgreConnection")
        private readonly kaizenRepo: Repository<KaizenEntity>,
    ) {}

    async createKaizen(dto: KaizenFormDto): Promise<KaizenEntity> {
        const result = await this.kaizenRepo.insert({
            nome: dto.nome,
            secao: dto.secao,
            e_autor: dto.e_autor,
            autor_nome: dto.autor_nome ?? null,
            area_responsavel_mesma: dto.area_responsavel_mesma,
            area_responsavel_secao: dto.area_responsavel_secao ?? null,
            area_impactada_mesma: dto.area_impactada_mesma,
            area_impactada_secao: dto.area_impactada_secao ?? null,
            local_detalhado: dto.local_detalhado ?? null,
            classificacao: dto.classificacao,
            titulo: dto.titulo,
            problema: dto.problema,
            melhoria: dto.melhoria,
            status: "Não cadastrado",
            id_kaizen: null,
        });

        return this.getKaizen(result.identifiers[0].id);
    }

    async listKaizens(): Promise<KaizenEntity[]> {
        return this.kaizenRepo.find({ order: { created_at: "DESC" } });
    }

    async getKaizen(id: string): Promise<KaizenEntity> {
        const kaizen = await this.kaizenRepo.findOneBy({ id });
        if (!kaizen) throw new NotFoundException(`Kaizen ${id} not found`);
        return kaizen;
    }

    async updateKaizen(id: string, dto: KaizenFormDto): Promise<KaizenEntity> {
        await this.getKaizen(id);

        await this.kaizenRepo.update({ id }, {
            nome: dto.nome,
            secao: dto.secao,
            e_autor: dto.e_autor,
            autor_nome: dto.autor_nome ?? null,
            area_responsavel_mesma: dto.area_responsavel_mesma,
            area_responsavel_secao: dto.area_responsavel_secao ?? null,
            area_impactada_mesma: dto.area_impactada_mesma,
            area_impactada_secao: dto.area_impactada_secao ?? null,
            local_detalhado: dto.local_detalhado ?? null,
            classificacao: dto.classificacao,
            titulo: dto.titulo,
            problema: dto.problema,
            melhoria: dto.melhoria,
        });

        return this.getKaizen(id);
    }

    async cadastrarKaizen(id: string, idKaizen: string): Promise<KaizenEntity> {
        if (!idKaizen?.trim()) {
            throw new BadRequestException("ID Kaizen não pode ser vazio");
        }

        await this.getKaizen(id);
        await this.kaizenRepo.update({ id }, {
            id_kaizen: idKaizen.trim(),
            status: "Cadastrado",
        });

        return this.getKaizen(id);
    }
}

const kaizenServiceProvider: ClassProvider<IKaizenService> = {
    provide: IKaizenService,
    useClass: KaizenService,
};

export default kaizenServiceProvider;

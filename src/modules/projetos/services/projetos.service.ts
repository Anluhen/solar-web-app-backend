import {
    BadRequestException,
    ClassProvider,
    ConflictException,
    Injectable,
    NotFoundException,
} from "@nestjs/common";
import { InjectDataSource, InjectRepository } from "@nestjs/typeorm";
import { DataSource, Repository } from "typeorm";
import Projeto from "../entities/projeto.entity";
import ProjetoPep from "../entities/projeto-pep.entity";
import ProjetoItem from "../entities/projeto-item.entity";
import EnvioEntity from "../../envios/entities/envio.entity";
import ProjetoFormDto from "../dtos/projeto-form.dto";
import ProjetoPepFormDto from "../dtos/projeto-pep-form.dto";
import ProjetoItemFormDto from "../dtos/projeto-item-form.dto";
import BulkItemsDto from "../dtos/bulk-items.dto";
import {
    AggregateRow,
    IProjetosService,
    ProjetoItemEnriched,
    ProjetoPepEnriched,
    ProjetoSummary,
    ProjetoWithStats,
} from "../interfaces/projetos.service.interface";

@Injectable()
class ProjetosService implements IProjetosService {
    constructor(
        @InjectRepository(Projeto, "postgreConnection")
        private readonly projetoRepo: Repository<Projeto>,
        @InjectRepository(ProjetoPep, "postgreConnection")
        private readonly pepRepo: Repository<ProjetoPep>,
        @InjectRepository(ProjetoItem, "postgreConnection")
        private readonly itemRepo: Repository<ProjetoItem>,
        @InjectRepository(EnvioEntity, "postgreConnection")
        private readonly envioRepo: Repository<EnvioEntity>,
        @InjectDataSource("postgreConnection")
        private readonly dataSource: DataSource,
    ) {}

    // ─── helpers ────────────────────────────────────────────────────────────

    private async findProjeto(id: string): Promise<Projeto> {
        const projeto = await this.projetoRepo.findOne({ where: { id } });
        if (!projeto)
            throw new NotFoundException(`Projeto ${id} não encontrado`);
        return projeto;
    }

    private async findPep(
        projetoId: string,
        pepId: string,
    ): Promise<ProjetoPep> {
        const pep = await this.pepRepo.findOne({
            where: { id: pepId, projeto: { id: projetoId } },
        });
        if (!pep)
            throw new NotFoundException(
                `PEP ${pepId} não encontrado no projeto ${projetoId}`,
            );
        return pep;
    }

    /**
     * Returns delivered quantities by status for a given full PEP + SAP combination.
     * Manual base (quantidade_entregue_manual) is added to the ENTREGUE bucket externally.
     */
    private async computeDeliveredByStatus(
        fullPep: string,
        sap: string,
    ): Promise<{ separado: number; enviado: number; entregue: number }> {
        const rows = await this.envioRepo
            .createQueryBuilder("e")
            .innerJoin("e.materiais", "m")
            .select("e.status", "status")
            .addSelect("COALESCE(SUM(m.quantidade), 0)", "total")
            .where("e.pep = :pep", { pep: fullPep })
            .andWhere("m.sap = :sap", { sap })
            .andWhere("e.status != :cancelled", { cancelled: "CANCELADO" })
            .groupBy("e.status")
            .getRawMany<{ status: string; total: string }>();

        const byStatus = Object.fromEntries(
            rows.map((r) => [r.status, Number(r.total)]),
        );
        return {
            separado: byStatus["SEPARACAO"] ?? 0,
            enviado: byStatus["ENVIADO"] ?? 0,
            entregue: byStatus["ENTREGUE"] ?? 0,
        };
    }

    // ─── CRUD Projeto ────────────────────────────────────────────────────────

    async createProjeto(dto: ProjetoFormDto): Promise<Projeto> {
        const existing = await this.projetoRepo.findOne({
            where: { pep_prefix: dto.pep_prefix },
        });
        if (existing) {
            throw new ConflictException(
                `Já existe um projeto com o PEP "${dto.pep_prefix}" (id: ${existing.id})`,
            );
        }

        const projeto = this.projetoRepo.create({
            nome: dto.nome,
            pep_prefix: dto.pep_prefix,
            pm: dto.pm,
            analista: dto.analista ?? null,
            already_started: dto.already_started ?? false,
            secao: dto.secao ?? null,
            cliente: dto.cliente ?? null,
            produto: dto.produto ?? null,
            zvgp_projeto: dto.zvgp_projeto ?? null,
            zrgp: dto.zrgp ?? null,
            data_preparacao: dto.data_preparacao ?? null,
            pep_faturavel: dto.pep_faturavel ?? null,
            cns_ano: dto.cns_ano ?? null,
            gerador_projeto: dto.gerador_projeto ?? null,
            ordem_venda: dto.ordem_venda ?? null,
            data_primeiro_envio: dto.data_primeiro_envio ?? null,
            ordem_pedido_compra: dto.ordem_pedido_compra ?? null,
            valor_total_liq: dto.valor_total_liq ?? null,
            ml: dto.ml ?? null,
            is_cpc: dto.is_cpc ?? null,
            is_cpc47: dto.is_cpc47 ?? null,
            claim: dto.claim ?? null,
            data_claim: dto.data_claim ?? null,
            observacoes_chefe: dto.observacoes_chefe ?? null,
            data_criacao_pep: dto.data_criacao_pep ?? null,
            idioma: dto.idioma ?? null,
            empresa: dto.empresa ?? null,
            contatos_cliente: dto.contatos_cliente ?? null,
            contatos_weg: dto.contatos_weg ?? null,
        });
        const saved = await this.projetoRepo.save(projeto);

        if (dto.peps && dto.peps.length > 0) {
            for (const pepDto of dto.peps) {
                const pep = this.pepRepo.create({
                    projeto: saved,
                    nome: pepDto.nome ?? null,
                    pep_suffix: pepDto.pep_suffix,
                    zvgp: pepDto.zvgp ?? null,
                    zrgp: pepDto.zrgp ?? null,
                    gerador: pepDto.gerador ?? null,
                    data_preparacao: pepDto.data_preparacao ?? null,
                    ml: pepDto.ml ?? null,
                    is_cpc: pepDto.is_cpc ?? null,
                });
                await this.pepRepo.save(pep);
            }
        }

        return this.projetoRepo.findOne({
            where: { id: saved.id },
            relations: { peps: true },
        }) as Promise<Projeto>;
    }

    async listProjetosWithStats(filters?: {
        nome?: string;
        pep_prefix?: string;
        pm?: string;
        analista?: string;
        secao?: string;
    }): Promise<ProjetoWithStats[]> {
        const qb = this.projetoRepo
            .createQueryBuilder("p")
            .leftJoinAndSelect("p.peps", "pep")
            .orderBy("p.created_at", "DESC");

        if (filters?.nome && filters.nome.trim()) {
            qb.andWhere("p.nome ILIKE :nome", {
                nome: `%${filters.nome.trim()}%`,
            });
        }
        if (filters?.pep_prefix && filters.pep_prefix.trim()) {
            qb.andWhere("p.pep_prefix ILIKE :pep_prefix", {
                pep_prefix: `%${filters.pep_prefix.trim()}%`,
            });
        }
        if (filters?.pm && filters.pm.trim()) {
            qb.andWhere("p.pm ILIKE :pm", { pm: `%${filters.pm.trim()}%` });
        }
        if (filters?.analista && filters.analista.trim()) {
            qb.andWhere("p.analista ILIKE :analista", {
                analista: `%${filters.analista.trim()}%`,
            });
        }
        if (filters?.secao && filters.secao.trim()) {
            qb.andWhere("p.secao = :secao", { secao: filters.secao.trim() });
        }

        const projetos = await qb.getMany();
        if (projetos.length === 0) return [];

        // Build a flat map: fullPep -> pepId for all peps across all projects
        const allFullPeps: string[] = [];
        const pepFullToId = new Map<string, string>();
        for (const projeto of projetos) {
            for (const pep of projeto.peps ?? []) {
                const full = projeto.pep_prefix + '-' + pep.pep_suffix;
                allFullPeps.push(full);
                pepFullToId.set(full, pep.id);
            }
        }

        // Batch query: delivery quantities grouped by pep string and status
        const pepDeliveryRows =
            allFullPeps.length > 0
                ? await this.envioRepo
                      .createQueryBuilder("e")
                      .innerJoin("e.materiais", "m")
                      .select("e.pep", "pep")
                      .addSelect("e.status", "status")
                      .addSelect("COALESCE(SUM(m.quantidade), 0)", "total")
                      .where("e.pep IN (:...peps)", { peps: allFullPeps })
                      .andWhere("e.status != :cancelled", {
                          cancelled: "CANCELADO",
                      })
                      .groupBy("e.pep")
                      .addGroupBy("e.status")
                      .getRawMany<{
                          pep: string;
                          status: string;
                          total: string;
                      }>()
                : [];

        // pepId -> { status -> qty }
        const pepDeliveryMap = new Map<string, Record<string, number>>();
        for (const row of pepDeliveryRows) {
            const pepId = pepFullToId.get(row.pep);
            if (!pepId) continue;
            if (!pepDeliveryMap.has(pepId)) pepDeliveryMap.set(pepId, {});
            pepDeliveryMap.get(pepId)![row.status] = Number(row.total);
        }

        // Batch query: necessaria per pep
        const pepNecRows =
            allFullPeps.length > 0
                ? await this.itemRepo
                      .createQueryBuilder("i")
                      .innerJoin("i.projeto_pep", "pep")
                      .select("pep.id", "pepId")
                      .addSelect(
                          "COALESCE(SUM(i.quantidade_necessaria), 0)",
                          "total",
                      )
                      .groupBy("pep.id")
                      .getRawMany<{ pepId: string; total: string }>()
                : [];

        const pepNecMap = new Map(
            pepNecRows.map((r) => [r.pepId, Number(r.total)]),
        );

        // Batch query: manual base per project (for already_started)
        const alreadyStartedIds = projetos
            .filter((p) => p.already_started)
            .map((p) => p.id);

        const manualRows =
            alreadyStartedIds.length > 0
                ? await this.itemRepo
                      .createQueryBuilder("i")
                      .innerJoin("i.projeto_pep", "pep")
                      .innerJoin("pep.projeto", "proj")
                      .where("proj.id IN (:...ids)", { ids: alreadyStartedIds })
                      .andWhere("i.quantidade_entregue_manual IS NOT NULL")
                      .select("proj.id", "projetoId")
                      .addSelect("pep.id", "pepId")
                      .addSelect(
                          "COALESCE(SUM(i.quantidade_entregue_manual), 0)",
                          "total",
                      )
                      .groupBy("proj.id")
                      .addGroupBy("pep.id")
                      .getRawMany<{
                          projetoId: string;
                          pepId: string;
                          total: string;
                      }>()
                : [];

        // pepId -> manual qty
        const pepManualMap = new Map(
            manualRows.map((r) => [r.pepId, Number(r.total)]),
        );

        return projetos.map((p) => {
            const peps = p.peps ?? [];

            let total_necessaria = 0;
            let total_separado = 0;
            let total_enviado = 0;
            let total_entregue = 0;

            const pepsWithStats = peps.map((pep) => {
                const nec = pepNecMap.get(pep.id) ?? 0;
                const delivery = pepDeliveryMap.get(pep.id) ?? {};
                const manual = pepManualMap.get(pep.id) ?? 0;
                const entregue = (delivery["ENTREGUE"] ?? 0) + manual;

                total_necessaria += nec;
                total_separado += delivery["SEPARACAO"] ?? 0;
                total_enviado += delivery["ENVIADO"] ?? 0;
                total_entregue += entregue;

                const pct_entregue =
                    nec > 0 ? Math.round((entregue / nec) * 100) : null;
                return { ...pep, pct_entregue };
            });

            const pct_entregue =
                total_necessaria > 0
                    ? Math.round((total_entregue / total_necessaria) * 100)
                    : null;

            return {
                ...p,
                peps: pepsWithStats,
                total_necessaria,
                total_separado,
                total_enviado,
                total_entregue,
                pct_entregue,
            };
        });
    }

    async getProjeto(id: string): Promise<Projeto> {
        const projeto = await this.projetoRepo.findOne({
            where: { id },
            relations: { peps: true },
        });
        if (!projeto)
            throw new NotFoundException(`Projeto ${id} não encontrado`);
        return projeto;
    }

    async updateProjeto(id: string, dto: ProjetoFormDto): Promise<Projeto> {
        const projeto = await this.findProjeto(id);
        Object.assign(projeto, {
            nome: dto.nome,
            pep_prefix: dto.pep_prefix,
            pm: dto.pm,
            analista: dto.analista ?? projeto.analista,
            already_started: dto.already_started ?? projeto.already_started,
            secao: dto.secao ?? null,
            cliente: dto.cliente ?? null,
            produto: dto.produto ?? null,
            zvgp_projeto: dto.zvgp_projeto ?? null,
            zrgp: dto.zrgp ?? null,
            data_preparacao: dto.data_preparacao ?? null,
            pep_faturavel: dto.pep_faturavel ?? null,
            cns_ano: dto.cns_ano ?? null,
            gerador_projeto: dto.gerador_projeto ?? null,
            ordem_venda: dto.ordem_venda ?? null,
            data_primeiro_envio: dto.data_primeiro_envio ?? null,
            ordem_pedido_compra: dto.ordem_pedido_compra ?? null,
            valor_total_liq: dto.valor_total_liq ?? null,
            ml: dto.ml ?? null,
            is_cpc: dto.is_cpc ?? null,
            is_cpc47: dto.is_cpc47 ?? null,
            claim: dto.claim ?? null,
            data_claim: dto.data_claim ?? null,
            observacoes_chefe: dto.observacoes_chefe ?? null,
            data_criacao_pep: dto.data_criacao_pep ?? null,
            idioma: dto.idioma ?? null,
            empresa: dto.empresa ?? null,
            contatos_cliente: dto.contatos_cliente ?? null,
            contatos_weg: dto.contatos_weg ?? null,
        });
        await this.projetoRepo.save(projeto);
        return this.getProjeto(id);
    }

    // ─── PEPs ────────────────────────────────────────────────────────────────

    async addPep(
        projetoId: string,
        dto: ProjetoPepFormDto,
    ): Promise<ProjetoPep> {
        const projeto = await this.findProjeto(projetoId);
        const pep = this.pepRepo.create({
            projeto,
            nome: dto.nome ?? null,
            pep_suffix: dto.pep_suffix,
            zvgp: dto.zvgp ?? null,
            zrgp: dto.zrgp ?? null,
            gerador: dto.gerador ?? null,
            data_preparacao: dto.data_preparacao ?? null,
            ml: dto.ml ?? null,
            is_cpc: dto.is_cpc ?? null,
        });
        return this.pepRepo.save(pep);
    }

    async updatePep(
        projetoId: string,
        pepId: string,
        dto: ProjetoPepFormDto,
    ): Promise<ProjetoPep> {
        const pep = await this.findPep(projetoId, pepId);
        Object.assign(pep, {
            nome: dto.nome ?? null,
            pep_suffix: dto.pep_suffix,
            zvgp: dto.zvgp ?? null,
            zrgp: dto.zrgp ?? null,
            gerador: dto.gerador ?? null,
            data_preparacao: dto.data_preparacao ?? null,
            ml: dto.ml ?? null,
            is_cpc: dto.is_cpc ?? null,
        });
        return this.pepRepo.save(pep);
    }

    async removePep(projetoId: string, pepId: string): Promise<void> {
        const projeto = await this.findProjeto(projetoId);
        const pep = await this.findPep(projetoId, pepId);
        const fullPep = projeto.pep_prefix + '-' + pep.pep_suffix;

        const enviados = await this.envioRepo.count({
            where: { pep: fullPep, status: "ENVIADO" as any },
        });
        if (enviados > 0) {
            throw new BadRequestException(
                `Não é possível remover o PEP "${fullPep}" pois existem ${enviados} envio(s) com status ENVIADO.`,
            );
        }

        await this.pepRepo.remove(pep);
    }

    // ─── Items ───────────────────────────────────────────────────────────────

    async bulkReplaceItems(
        projetoId: string,
        pepId: string,
        dto: BulkItemsDto,
    ): Promise<ProjetoItem[]> {
        const pepRef = await this.findPep(projetoId, pepId);
        return this.dataSource.transaction(async (manager) => {
            await manager.delete(ProjetoItem, { projeto_pep: { id: pepId } });
            const newItems = dto.items.map((itemDto) =>
                manager.create(ProjetoItem, {
                    projeto_pep: pepRef,
                    sap: itemDto.sap,
                    descricao: itemDto.descricao,
                    quantidade_necessaria: itemDto.quantidade_necessaria,
                    quantidade_entregue_manual:
                        itemDto.quantidade_entregue_manual ?? null,
                    grupo: itemDto.grupo ?? null,
                }),
            );
            return manager.save(ProjetoItem, newItems);
        });
    }

    async updateItem(
        projetoId: string,
        pepId: string,
        itemId: string,
        dto: ProjetoItemFormDto,
    ): Promise<ProjetoItem> {
        const pepRef = await this.findPep(projetoId, pepId);
        const item = await this.itemRepo.findOne({
            where: { id: itemId, projeto_pep: { id: pepRef.id } },
        });
        if (!item)
            throw new NotFoundException(
                `Item ${itemId} não encontrado no PEP ${pepId}`,
            );
        Object.assign(item, {
            sap: dto.sap,
            descricao: dto.descricao,
            quantidade_necessaria: dto.quantidade_necessaria,
            quantidade_entregue_manual: dto.quantidade_entregue_manual ?? null,
        });
        return this.itemRepo.save(item);
    }

    // ─── Summary / Aggregate ─────────────────────────────────────────────────

    async getSummary(id: string): Promise<ProjetoSummary> {
        const projeto = await this.projetoRepo.findOne({
            where: { id },
            relations: { peps: { items: true } },
        });
        if (!projeto)
            throw new NotFoundException(`Projeto ${id} não encontrado`);

        const enrichedPeps: ProjetoPepEnriched[] = await Promise.all(
            (projeto.peps ?? []).map(async (pep) => {
                const fullPep = projeto.pep_prefix + '-' + pep.pep_suffix;

                // Query distinct SAPs that appear in envio materials for this full PEP
                const envioMats = await this.envioRepo
                    .createQueryBuilder("e")
                    .innerJoin("e.materiais", "m")
                    .select("m.sap", "sap")
                    .addSelect("MAX(m.descricao)", "descricao")
                    .where("e.pep = :pep", { pep: fullPep })
                    .andWhere("e.status != :cancelled", {
                        cancelled: "CANCELADO",
                    })
                    .groupBy("m.sap")
                    .getRawMany<{ sap: string; descricao: string }>();

                // Map existing ProjetoItems by SAP (real planned items)
                const itemsBySap = new Map(
                    (pep.items ?? []).map((item) => [item.sap, item]),
                );

                // Virtual SAPs: in envios but not in planned items
                const virtualSaps = envioMats
                    .map((m) => m.sap)
                    .filter((sap) => !itemsBySap.has(sap));

                // Planned items first (preserve DB insertion order), then virtual items
                const orderedSaps = [...itemsBySap.keys(), ...virtualSaps];

                const enrichedItems: ProjetoItemEnriched[] = await Promise.all(
                    orderedSaps.map(async (sap) => {
                        const existingItem = itemsBySap.get(sap);
                        const delivered = await this.computeDeliveredByStatus(
                            fullPep,
                            sap,
                        );
                        const manual =
                            existingItem?.quantidade_entregue_manual ?? 0;

                        if (existingItem) {
                            return {
                                ...existingItem,
                                is_virtual: false,
                                quantidade_separado: delivered.separado,
                                quantidade_enviado: delivered.enviado,
                                quantidade_entregue:
                                    delivered.entregue + manual,
                            } as ProjetoItemEnriched;
                        }

                        // Virtual item: in envios but not in ProjetoItems
                        const envioMat = envioMats.find((m) => m.sap === sap);
                        return {
                            id: `virtual-${sap}`,
                            projeto_pep_id: pep.id,
                            sap,
                            descricao: envioMat?.descricao ?? "",
                            quantidade_necessaria: 0,
                            quantidade_entregue_manual: null,
                            created_at: new Date(),
                            updated_at: new Date(),
                            is_virtual: true,
                            quantidade_separado: delivered.separado,
                            quantidade_enviado: delivered.enviado,
                            quantidade_entregue: delivered.entregue,
                        } as ProjetoItemEnriched;
                    }),
                );

                return { ...pep, items: enrichedItems };
            }),
        );

        return { ...projeto, peps: enrichedPeps };
    }

    async getAggregate(id: string): Promise<AggregateRow[]> {
        const summary = await this.getSummary(id);
        const map = new Map<
            string,
            {
                descricao: string;
                necessaria: number;
                separado: number;
                enviado: number;
                entregue: number;
                hasReal: boolean;
            }
        >();

        for (const pep of summary.peps) {
            for (const item of pep.items) {
                const existing = map.get(item.sap);
                if (existing) {
                    existing.necessaria += item.quantidade_necessaria;
                    existing.separado += item.quantidade_separado;
                    existing.enviado += item.quantidade_enviado;
                    existing.entregue += item.quantidade_entregue;
                    if (!item.is_virtual) existing.hasReal = true;
                } else {
                    map.set(item.sap, {
                        descricao: item.descricao,
                        necessaria: item.quantidade_necessaria,
                        separado: item.quantidade_separado,
                        enviado: item.quantidade_enviado,
                        entregue: item.quantidade_entregue,
                        hasReal: !item.is_virtual,
                    });
                }
            }
        }

        return Array.from(map.entries())
            .map(([sap, data]) => ({
                sap,
                descricao: data.descricao,
                quantidade_necessaria: data.necessaria,
                quantidade_separado: data.separado,
                quantidade_enviado: data.enviado,
                quantidade_entregue: data.entregue,
                saldo:
                    data.necessaria -
                    data.separado -
                    data.enviado -
                    data.entregue,
                is_virtual: !data.hasReal,
            }))
            .sort((a, b) => a.sap.localeCompare(b.sap));
    }

    // ─── Envios by Projeto ────────────────────────────────────────────────────

    async getEnviosByProjeto(id: string): Promise<EnvioEntity[]> {
        const projeto = await this.findProjeto(id);
        const peps = await this.pepRepo.find({
            where: { projeto: { id } },
        });
        if (peps.length === 0) return [];

        const fullPeps = peps.map((pep) => projeto.pep_prefix + '-' + pep.pep_suffix);

        return this.envioRepo.find({
            where: fullPeps.map((pep) => ({ pep })),
            order: { id: "ASC" },
        });
    }

    // ─── Lookup / Import ──────────────────────────────────────────────────────

    async lookupPepSuffixes(prefix: string): Promise<
        Array<{
            pep_suffix: string;
            zvgp: string;
            gerador: string;
            ufv: string;
        }>
    > {
        const [envioRows, pepRows] = await Promise.all([
            this.envioRepo
                .createQueryBuilder("e")
                .select("e.pep", "pep")
                .addSelect("MAX(e.zvgp)", "zvgp")
                .addSelect("MAX(e.gerador)", "gerador")
                .addSelect("MAX(e.ufv)", "ufv")
                .where("e.pep LIKE :pattern", { pattern: `${prefix}-%` })
                .groupBy("e.pep")
                .orderBy("e.pep")
                .getRawMany<{
                    pep: string;
                    zvgp: string;
                    gerador: string;
                    ufv: string;
                }>(),
            this.pepRepo
                .createQueryBuilder("pp")
                .innerJoin("pp.projeto", "proj")
                .select("pp.pep_suffix", "pep_suffix")
                .addSelect("pp.zvgp", "zvgp")
                .addSelect("pp.gerador", "gerador")
                .addSelect("pp.nome", "ufv")
                .where("proj.pep_prefix = :prefix", { prefix })
                .getRawMany<{
                    pep_suffix: string;
                    zvgp: string;
                    gerador: string;
                    ufv: string;
                }>(),
        ]);

        // Build map from suffix → result; projeto_peps first, envios override (richer data)
        const map = new Map<
            string,
            { pep_suffix: string; zvgp: string; gerador: string; ufv: string }
        >();

        for (const row of pepRows) {
            map.set(row.pep_suffix, {
                pep_suffix: row.pep_suffix,
                zvgp: row.zvgp ?? "",
                gerador: row.gerador ?? "",
                ufv: row.ufv ?? "",
            });
        }

        for (const row of envioRows) {
            const rawSuffix = row.pep.slice(prefix.length);
            const suffix = rawSuffix.startsWith('-') ? rawSuffix.slice(1) : rawSuffix;
            map.set(suffix, {
                pep_suffix: suffix,
                zvgp: row.zvgp ?? "",
                gerador: row.gerador ?? "",
                ufv: row.ufv ?? "",
            });
        }

        return [...map.values()].sort((a, b) =>
            a.pep_suffix.localeCompare(b.pep_suffix),
        );
    }

    async getPepItems(fullPep: string): Promise<ProjetoItemEnriched[]> {
        const lastDash = fullPep.lastIndexOf("-");
        if (lastDash <= 0) return [];
        const prefix = fullPep.slice(0, lastDash);
        const suffix = fullPep.slice(lastDash + 1);

        const pep = await this.pepRepo.findOne({
            where: { pep_suffix: suffix, projeto: { pep_prefix: prefix } },
            relations: { items: true, projeto: true },
        });
        if (!pep) return [];

        const projeto = pep.projeto as Projeto;
        const items = pep.items ?? [];

        const enriched: ProjetoItemEnriched[] = await Promise.all(
            items.map(async (item) => {
                const delivered = await this.computeDeliveredByStatus(
                    fullPep,
                    item.sap,
                );
                const entregue =
                    delivered.entregue +
                    (projeto.already_started
                        ? (item.quantidade_entregue_manual ?? 0)
                        : 0);
                return {
                    ...item,
                    quantidade_separado: delivered.separado,
                    quantidade_enviado: delivered.enviado,
                    quantidade_entregue: entregue,
                    is_virtual: false,
                };
            }),
        );
        return enriched;
    }

    async importFromEnvios(): Promise<Projeto[]> {
        const envioRows = await this.envioRepo
            .createQueryBuilder("e")
            .select("e.pep", "pep")
            .addSelect("MAX(e.ufv)", "ufv")
            .addSelect("MAX(e.zvgp)", "zvgp")
            .addSelect("MAX(e.gerador)", "gerador")
            .groupBy("e.pep")
            .orderBy("e.pep")
            .getRawMany<{
                pep: string;
                ufv: string;
                zvgp: string;
                gerador: string;
            }>();

        type GroupEntry = {
            ufv: string;
            suffixes: Map<string, { zvgp: string; gerador: string }>;
        };
        const prefixMap = new Map<string, GroupEntry>();
        for (const row of envioRows) {
            const lastDash = row.pep.lastIndexOf("-");
            if (lastDash <= 0) continue;
            const prefix = row.pep.slice(0, lastDash);
            const suffix = row.pep.slice(lastDash + 1);
            if (!prefixMap.has(prefix)) {
                prefixMap.set(prefix, { ufv: row.ufv, suffixes: new Map() });
            }
            const group = prefixMap.get(prefix)!;
            if (!group.suffixes.has(suffix)) {
                group.suffixes.set(suffix, {
                    zvgp: row.zvgp,
                    gerador: row.gerador,
                });
            }
        }

        const existingProjects = await this.projetoRepo.find({
            relations: { peps: true },
        });
        const existingMap = new Map(
            existingProjects.map((p) => [p.pep_prefix, p]),
        );

        const affected: Projeto[] = [];
        for (const [prefix, group] of prefixMap.entries()) {
            const existingProject = existingMap.get(prefix);

            if (!existingProject) {
                const projeto = this.projetoRepo.create({
                    nome: group.ufv || prefix,
                    pep_prefix: prefix,
                    pm: "",
                    analista: "",
                    already_started: true,
                });
                const saved = await this.projetoRepo.save(projeto);

                for (const [
                    suffix,
                    { zvgp, gerador },
                ] of group.suffixes.entries()) {
                    await this.pepRepo.save(
                        this.pepRepo.create({
                            projeto: saved,
                            pep_suffix: suffix,
                            zvgp,
                            gerador,
                        }),
                    );
                }

                const full = await this.projetoRepo.findOne({
                    where: { id: saved.id },
                    relations: { peps: true },
                });
                if (full) affected.push(full);
            } else {
                const existingSuffixes = new Set(
                    (existingProject.peps ?? []).map((p) => p.pep_suffix),
                );
                let addedAny = false;
                for (const [
                    suffix,
                    { zvgp, gerador },
                ] of group.suffixes.entries()) {
                    if (!existingSuffixes.has(suffix)) {
                        await this.pepRepo.save(
                            this.pepRepo.create({
                                projeto: existingProject,
                                pep_suffix: suffix,
                                zvgp,
                                gerador,
                            }),
                        );
                        addedAny = true;
                    }
                }
                if (addedAny) {
                    const full = await this.projetoRepo.findOne({
                        where: { id: existingProject.id },
                        relations: { peps: true },
                    });
                    if (full) affected.push(full);
                }
            }
        }

        return affected;
    }
}

const projetosServiceProvider: ClassProvider<IProjetosService> = {
    provide: IProjetosService,
    useClass: ProjetosService,
};

export default projetosServiceProvider;

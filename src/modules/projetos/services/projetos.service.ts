import {
    BadRequestException,
    ClassProvider,
    ConflictException,
    Inject,
    Injectable,
    NotFoundException,
} from "@nestjs/common";
import { InjectDataSource, InjectRepository } from "@nestjs/typeorm";
import { DataSource, IsNull, Not, Repository } from "typeorm";
import Projeto from "../entities/projeto.entity";
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
import { IMailService } from "../../mail/interfaces/mail.service.interface";
import ProjectPerson from "../../project-people/entities/project-person.entity";
import ProdutoOption from "../entities/produto-option.entity";

@Injectable()
class ProjetosService implements IProjetosService {
    constructor(
        @InjectRepository(Projeto, "postgreConnection")
        private readonly projetoRepo: Repository<Projeto>,
        @InjectRepository(ProjetoItem, "postgreConnection")
        private readonly itemRepo: Repository<ProjetoItem>,
        @InjectRepository(EnvioEntity, "postgreConnection")
        private readonly envioRepo: Repository<EnvioEntity>,
        @InjectDataSource("postgreConnection")
        private readonly dataSource: DataSource,
        @InjectRepository(ProjectPerson, "postgreConnection")
        private readonly peopleRepo: Repository<ProjectPerson>,
        @InjectRepository(ProdutoOption, "postgreConnection")
        private readonly produtoOptionRepo: Repository<ProdutoOption>,
        @Inject(IMailService)
        private readonly mailService: IMailService,
    ) {}

    // ─── helpers ────────────────────────────────────────────────────────────

    private async findProjeto(id: string): Promise<Projeto> {
        const projeto = await this.projetoRepo.findOne({ where: { id } });
        if (!projeto)
            throw new NotFoundException(`Projeto ${id} não encontrado`);
        return projeto;
    }

    /** Returns all sibling rows for an anchor projeto.
     *  Single-OV (no pep_suffix): only the anchor itself — other rows sharing the same
     *  pep_prefix are unrelated OVs and must not be included.
     *  Multi-OV (has pep_suffix): all rows with the same pep_prefix. */
    private async findSiblings(anchor: Projeto): Promise<Projeto[]> {
        if (!anchor.pep_suffix) return [anchor];
        return this.projetoRepo.find({
            where: { pep_prefix: anchor.pep_prefix },
            order: { created_at: "ASC" },
        });
    }

    /** Full PEP string for a projetos row: prefix + '-' + suffix, or just prefix if no suffix. */
    private fullPep(projeto: Projeto): string {
        return projeto.pep_suffix
            ? `${projeto.pep_prefix}-${projeto.pep_suffix}`
            : projeto.pep_prefix;
    }

    private projetoToPepEntry(p: Projeto): ProjetoPepEnriched {
        return {
            ...p,
            id: p.id,
            projeto_id: p.id,
            nome: p.nome_pep ?? null,
            pep_suffix: p.pep_suffix ?? "",
            zvgp: p.zvgp ?? null,
            zrgp: p.zrgp ?? null,
            gerador: p.gerador ?? null,
            data_preparacao: p.data_preparacao ?? null,
            ml: p.ml ?? null,
            items: [],
        } as unknown as ProjetoPepEnriched;
    }

    private buildProjetoFromDto(dto: ProjetoFormDto, base?: Partial<Projeto>): Partial<Projeto> {
        return {
            nome: dto.nome ?? null,
            pep_prefix: dto.pep_prefix,
            pep_suffix: dto.pep_suffix ?? null,
            pm: dto.pm ?? null,
            analista: dto.analista ?? base?.analista ?? null,
            already_started: dto.already_started ?? base?.already_started ?? false,
            secao: dto.secao ?? null,
            cliente: dto.cliente ?? null,
            produto: dto.produto ?? null,
            nome_pep: dto.nome_pep ?? null,
            zvgp: dto.zvgp ?? null,
            zrgp: dto.zrgp ?? null,
            gerador: dto.gerador ?? null,
            data_preparacao: dto.data_preparacao ?? null,
            cns_ano: dto.cns_ano ?? null,
            data_primeiro_envio: dto.data_primeiro_envio ?? null,
            ordem_pedido_compra: dto.ordem_pedido_compra ?? null,
            valor_total_liq: dto.valor_total_liq ?? null,
            ml: dto.ml ?? null,
            is_cpc47: dto.is_cpc47 ?? null,
            claim: dto.claim ?? null,
            data_claim: dto.data_claim ?? null,
            observacoes_admin: dto.observacoes_admin ?? null,
            observacoes_chefe: dto.observacoes_chefe ?? null,
            data_criacao_pep: dto.data_criacao_pep ?? null,
            idioma: dto.idioma ?? null,
            contato_cliente_para: dto.contato_cliente_para ?? null,
            contato_cliente_cc: dto.contato_cliente_cc ?? null,
            contato_weg_para: dto.contato_weg_para ?? null,
            contato_weg_cc: dto.contato_weg_cc ?? null,
            custos_ipex: dto.custos_ipex ?? null,
            workflow_status: dto.workflow_status ?? base?.workflow_status ?? "RASCUNHO",
            ...(dto.anexo_ov !== undefined && { anexo_ov: dto.anexo_ov }),
            ...(dto.anexo_outro !== undefined && { anexo_outro: dto.anexo_outro }),
        };
    }

    /**
     * Returns delivered quantities by status for a given full PEP + SAP combination.
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
        // Check uniqueness: no duplicate (pep_prefix, pep_suffix, zvgp) combination
        const existing = await this.projetoRepo.findOne({
            where: {
                pep_prefix: dto.pep_prefix,
                pep_suffix: dto.pep_suffix ?? IsNull(),
                zvgp: dto.zvgp ?? IsNull(),
            },
        });
        if (existing) {
            throw new ConflictException(
                `Já existe um projeto com o PEP "${dto.pep_prefix}${dto.pep_suffix ? `-${dto.pep_suffix}` : ""}" (id: ${existing.id})`,
            );
        }

        const projeto = this.projetoRepo.create(this.buildProjetoFromDto(dto));
        return this.projetoRepo.save(projeto);
    }

    async listProjetosWithStats(filters?: {
        nome?: string;
        pep_prefix?: string;
        pm?: string;
        analista?: string;
        secao?: string;
    }): Promise<ProjetoWithStats[]> {
        // Load all matching rows — rows with the same pep_prefix are siblings
        const qb = this.projetoRepo
            .createQueryBuilder("p")
            .orderBy("p.pep_prefix", "ASC")
            .addOrderBy("p.created_at", "ASC");

        if (filters?.nome?.trim()) {
            qb.andWhere("p.nome ILIKE :nome", { nome: `%${filters.nome.trim()}%` });
        }
        if (filters?.pep_prefix?.trim()) {
            qb.andWhere("p.pep_prefix ILIKE :pep_prefix", {
                pep_prefix: `%${filters.pep_prefix.trim()}%`,
            });
        }
        if (filters?.pm?.trim()) {
            qb.andWhere("p.pm ILIKE :pm", { pm: `%${filters.pm.trim()}%` });
        }
        if (filters?.analista?.trim()) {
            qb.andWhere("p.analista ILIKE :analista", {
                analista: `%${filters.analista.trim()}%`,
            });
        }
        if (filters?.secao?.trim()) {
            qb.andWhere("p.secao = :secao", { secao: filters.secao.trim() });
        }

        const rows = await qb.getMany();
        if (rows.length === 0) return [];

        // Group by pep_prefix — one ProjetoWithStats per prefix
        const prefixGroups = new Map<string, Projeto[]>();
        for (const row of rows) {
            if (!prefixGroups.has(row.pep_prefix)) {
                prefixGroups.set(row.pep_prefix, []);
            }
            prefixGroups.get(row.pep_prefix)!.push(row);
        }

        // Build full PEP strings across all rows for batch queries
        const allFullPeps: string[] = rows.map((r) => this.fullPep(r));
        const rowById = new Map(rows.map((r) => [r.id, r]));
        const fullPepToRowId = new Map(rows.map((r) => [this.fullPep(r), r.id]));

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
                      .andWhere("e.status != :cancelled", { cancelled: "CANCELADO" })
                      .groupBy("e.pep")
                      .addGroupBy("e.status")
                      .getRawMany<{ pep: string; status: string; total: string }>()
                : [];

        // rowId -> { status -> qty }
        const rowDeliveryMap = new Map<string, Record<string, number>>();
        for (const row of pepDeliveryRows) {
            const rowId = fullPepToRowId.get(row.pep);
            if (!rowId) continue;
            if (!rowDeliveryMap.has(rowId)) rowDeliveryMap.set(rowId, {});
            rowDeliveryMap.get(rowId)![row.status] = Number(row.total);
        }

        // Batch query: necessaria per row
        const rowNecRows = await this.itemRepo
            .createQueryBuilder("i")
            .innerJoin("i.projeto", "p")
            .select("p.id", "rowId")
            .addSelect("COALESCE(SUM(i.quantidade_necessaria), 0)", "total")
            .groupBy("p.id")
            .getRawMany<{ rowId: string; total: string }>();

        const rowNecMap = new Map(rowNecRows.map((r) => [r.rowId, Number(r.total)]));

        // Batch query: manual base for already_started rows
        const alreadyStartedIds = rows.filter((r) => r.already_started).map((r) => r.id);
        const manualRows =
            alreadyStartedIds.length > 0
                ? await this.itemRepo
                      .createQueryBuilder("i")
                      .innerJoin("i.projeto", "p")
                      .where("p.id IN (:...ids)", { ids: alreadyStartedIds })
                      .andWhere("i.quantidade_entregue_manual IS NOT NULL")
                      .select("p.id", "rowId")
                      .addSelect("COALESCE(SUM(i.quantidade_entregue_manual), 0)", "total")
                      .groupBy("p.id")
                      .getRawMany<{ rowId: string; total: string }>()
                : [];

        const rowManualMap = new Map(manualRows.map((r) => [r.rowId, Number(r.total)]));

        // Build one ProjetoWithStats per prefix group
        // The "anchor" row (first created) carries the project-level metadata
        const result: ProjetoWithStats[] = [];
        for (const [, group] of prefixGroups) {
            const anchor = group[0];

            let total_necessaria = 0;
            let total_separado = 0;
            let total_enviado = 0;
            let total_entregue = 0;

            const pepsWithStats = group.map((row) => {
                const nec = rowNecMap.get(row.id) ?? 0;
                const delivery = rowDeliveryMap.get(row.id) ?? {};
                const manual = rowManualMap.get(row.id) ?? 0;
                const entregue = (delivery["ENTREGUE"] ?? 0) + manual;

                total_necessaria += nec;
                total_separado += delivery["SEPARACAO"] ?? 0;
                total_enviado += delivery["ENVIADO"] ?? 0;
                total_entregue += entregue;

                const pct_entregue = nec > 0 ? Math.round((entregue / nec) * 100) : null;
                return { ...this.projetoToPepEntry(row), pct_entregue };
            });

            const pct_entregue =
                total_necessaria > 0
                    ? Math.round((total_entregue / total_necessaria) * 100)
                    : null;

            result.push({
                ...anchor,
                peps: pepsWithStats,
                total_necessaria,
                total_separado,
                total_enviado,
                total_entregue,
                pct_entregue,
            });
        }

        return result;
    }

    async getProjeto(id: string): Promise<Projeto> {
        const projeto = await this.projetoRepo.findOne({
            where: { id },
            relations: { items: true },
        });
        if (!projeto)
            throw new NotFoundException(`Projeto ${id} não encontrado`);
        return projeto;
    }

    async updateProjeto(id: string, dto: ProjetoFormDto): Promise<Projeto> {
        const projeto = await this.findProjeto(id);
        Object.assign(projeto, this.buildProjetoFromDto(dto, projeto));
        await this.projetoRepo.save(projeto);
        return this.getProjeto(id);
    }

    async deleteProjeto(id: string): Promise<void> {
        const anchor = await this.findProjeto(id);
        const all = await this.projetoRepo.find({ where: { pep_prefix: anchor.pep_prefix } });
        await this.projetoRepo.remove(all);
    }

    // ─── PEPs (sibling rows) ──────────────────────────────────────────────────

    async addPep(projetoId: string, dto: ProjetoPepFormDto): Promise<Projeto> {
        const anchor = await this.findProjeto(projetoId);

        // Uniqueness check
        const existing = await this.projetoRepo.findOne({
            where: {
                pep_prefix: anchor.pep_prefix,
                pep_suffix: dto.pep_suffix ?? IsNull(),
                zvgp: dto.zvgp ?? IsNull(),
            },
        });
        if (existing) {
            throw new ConflictException(
                `Já existe um PEP com sufixo "${dto.pep_suffix ?? ""}" e ZVGP "${dto.zvgp ?? "—"}" neste projeto`,
            );
        }

        // Create sibling row copying all shared project-level fields from anchor
        const sibling = this.projetoRepo.create({
            secao: anchor.secao,
            nome: anchor.nome ?? null,
            cliente: anchor.cliente,
            produto: anchor.produto,
            pep_prefix: anchor.pep_prefix,
            pep_suffix: dto.pep_suffix ?? null,
            pm: anchor.pm,
            analista: anchor.analista,
            already_started: anchor.already_started,
            cns_ano: anchor.cns_ano,
            data_primeiro_envio: anchor.data_primeiro_envio,
            ordem_pedido_compra: anchor.ordem_pedido_compra,
            valor_total_liq: anchor.valor_total_liq,
            claim: anchor.claim,
            data_claim: anchor.data_claim,
            observacoes_admin: anchor.observacoes_admin,
            observacoes_chefe: anchor.observacoes_chefe,
            data_criacao_pep: anchor.data_criacao_pep,
            idioma: anchor.idioma,
            contato_cliente_para: anchor.contato_cliente_para,
            contato_cliente_cc: anchor.contato_cliente_cc,
            contato_weg_para: anchor.contato_weg_para,
            contato_weg_cc: anchor.contato_weg_cc,
            custos_ipex: anchor.custos_ipex,
            workflow_status: anchor.workflow_status,
            anexo_ov: anchor.anexo_ov,
            anexo_outro: anchor.anexo_outro,
            // PEP-specific fields
            nome_pep: dto.nome ?? null,
            zvgp: dto.zvgp ?? null,
            zrgp: dto.zrgp ?? null,
            gerador: dto.gerador ?? null,
            data_preparacao: dto.data_preparacao ?? null,
            ml: dto.ml ?? null,
            is_cpc47: dto.is_cpc47 ?? anchor.is_cpc47 ?? null,
        });
        return this.projetoRepo.save(sibling);
    }

    async updatePep(
        projetoId: string,
        pepId: string,
        dto: ProjetoPepFormDto,
    ): Promise<Projeto> {
        // pepId is the id of the sibling projetos row
        const sibling = await this.findProjeto(pepId);
        // Verify it belongs to the same prefix group as anchor
        const anchor = await this.findProjeto(projetoId);
        if (sibling.pep_prefix !== anchor.pep_prefix) {
            throw new NotFoundException(`PEP ${pepId} não pertence ao projeto ${projetoId}`);
        }

        Object.assign(sibling, {
            nome_pep: dto.nome ?? null,
            pep_suffix: dto.pep_suffix ?? null,
            zvgp: dto.zvgp ?? null,
            zrgp: dto.zrgp ?? null,
            gerador: dto.gerador ?? null,
            data_preparacao: dto.data_preparacao ?? null,
            ml: dto.ml ?? null,
            is_cpc47: dto.is_cpc47 ?? null,
            // Per-OV Sistemas/Acionamentos
            ...(dto.pm !== undefined && { pm: dto.pm }),
            ...(dto.produto !== undefined && { produto: dto.produto }),
            ...(dto.data_primeiro_envio !== undefined && { data_primeiro_envio: dto.data_primeiro_envio }),
            ...(dto.ordem_pedido_compra !== undefined && { ordem_pedido_compra: dto.ordem_pedido_compra }),
            ...(dto.valor_total_liq !== undefined && { valor_total_liq: dto.valor_total_liq }),
            ...(dto.claim !== undefined && { claim: dto.claim }),
            ...(dto.data_claim !== undefined && { data_claim: dto.data_claim }),
            ...(dto.custos_ipex !== undefined && { custos_ipex: dto.custos_ipex }),
            // Per-OV workflow & communication
            ...(dto.workflow_status !== undefined && { workflow_status: dto.workflow_status }),
            ...(dto.observacoes_admin !== undefined && { observacoes_admin: dto.observacoes_admin }),
            ...(dto.observacoes_chefe !== undefined && { observacoes_chefe: dto.observacoes_chefe }),
            ...(dto.idioma !== undefined && { idioma: dto.idioma }),
            ...(dto.contato_cliente_para !== undefined && { contato_cliente_para: dto.contato_cliente_para }),
            ...(dto.contato_cliente_cc !== undefined && { contato_cliente_cc: dto.contato_cliente_cc }),
            ...(dto.contato_weg_para !== undefined && { contato_weg_para: dto.contato_weg_para }),
            ...(dto.contato_weg_cc !== undefined && { contato_weg_cc: dto.contato_weg_cc }),
            ...(dto.anexo_ov !== undefined && { anexo_ov: dto.anexo_ov }),
            ...(dto.anexo_outro !== undefined && { anexo_outro: dto.anexo_outro }),
        });
        return this.projetoRepo.save(sibling);
    }

    async removePep(projetoId: string, pepId: string): Promise<void> {
        const anchor = await this.findProjeto(projetoId);
        const sibling = await this.findProjeto(pepId);
        if (sibling.pep_prefix !== anchor.pep_prefix) {
            throw new NotFoundException(`PEP ${pepId} não pertence ao projeto ${projetoId}`);
        }

        const fp = this.fullPep(sibling);
        const enviados = await this.envioRepo.count({
            where: { pep: fp, status: "ENVIADO" as any },
        });
        if (enviados > 0) {
            throw new BadRequestException(
                `Não é possível remover o PEP "${fp}" pois existem ${enviados} envio(s) com status ENVIADO.`,
            );
        }

        await this.projetoRepo.remove(sibling);
    }

    // ─── Items ───────────────────────────────────────────────────────────────

    async bulkReplaceItems(
        projetoId: string,
        pepId: string,
        dto: BulkItemsDto,
    ): Promise<ProjetoItem[]> {
        // pepId is the projetos row id that owns these items
        const target = await this.findProjeto(pepId);
        return this.dataSource.transaction(async (manager) => {
            await manager.delete(ProjetoItem, { projeto: { id: pepId } });
            const newItems = dto.items.map((itemDto) =>
                manager.create(ProjetoItem, {
                    projeto: target,
                    sap: itemDto.sap,
                    descricao: itemDto.descricao,
                    quantidade_necessaria: itemDto.quantidade_necessaria,
                    quantidade_entregue_manual: itemDto.quantidade_entregue_manual ?? null,
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
        const item = await this.itemRepo.findOne({
            where: { id: itemId, projeto: { id: pepId } },
        });
        if (!item)
            throw new NotFoundException(`Item ${itemId} não encontrado no PEP ${pepId}`);
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
        const anchor = await this.projetoRepo.findOne({
            where: { id },
            relations: { items: true },
        });
        if (!anchor)
            throw new NotFoundException(`Projeto ${id} não encontrado`);

        // Load sibling rows with items. Single-OV (no suffix): anchor only.
        const siblings = anchor.pep_suffix
            ? await this.projetoRepo.find({
                  where: { pep_prefix: anchor.pep_prefix },
                  relations: { items: true },
                  order: { created_at: "ASC" },
              })
            : [anchor]; // anchor already has items loaded above

        const enrichedPeps: ProjetoPepEnriched[] = await Promise.all(
            siblings.map(async (row) => {
                const fp = this.fullPep(row);

                const envioMats = await this.envioRepo
                    .createQueryBuilder("e")
                    .innerJoin("e.materiais", "m")
                    .select("m.sap", "sap")
                    .addSelect("MAX(m.descricao)", "descricao")
                    .where("e.pep = :pep", { pep: fp })
                    .andWhere("e.status != :cancelled", { cancelled: "CANCELADO" })
                    .groupBy("m.sap")
                    .getRawMany<{ sap: string; descricao: string }>();

                const itemsBySap = new Map(
                    (row.items ?? []).map((item) => [item.sap, item]),
                );
                const virtualSaps = envioMats
                    .map((m) => m.sap)
                    .filter((sap) => !itemsBySap.has(sap));
                const orderedSaps = [...itemsBySap.keys(), ...virtualSaps];

                const enrichedItems: ProjetoItemEnriched[] = await Promise.all(
                    orderedSaps.map(async (sap) => {
                        const existingItem = itemsBySap.get(sap);
                        const delivered = await this.computeDeliveredByStatus(fp, sap);
                        const manual = existingItem?.quantidade_entregue_manual ?? 0;

                        if (existingItem) {
                            return {
                                ...existingItem,
                                is_virtual: false,
                                quantidade_separado: delivered.separado,
                                quantidade_enviado: delivered.enviado,
                                quantidade_entregue: delivered.entregue + manual,
                            } as ProjetoItemEnriched;
                        }

                        const envioMat = envioMats.find((m) => m.sap === sap);
                        return {
                            id: `virtual-${sap}`,
                            projeto_id: row.id,
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

                const pep = this.projetoToPepEntry(row);
                return { ...pep, items: enrichedItems };
            }),
        );

        return { ...anchor, peps: enrichedPeps };
    }

    async getAggregate(id: string): Promise<AggregateRow[]> {
        const summary = await this.getSummary(id);
        const map = new Map<
            string,
            { descricao: string; necessaria: number; separado: number; enviado: number; entregue: number; hasReal: boolean }
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
                saldo: data.necessaria - data.separado - data.enviado - data.entregue,
                is_virtual: !data.hasReal,
            }))
            .sort((a, b) => a.sap.localeCompare(b.sap));
    }

    // ─── Envios by Projeto ────────────────────────────────────────────────────

    async getEnviosByProjeto(id: string): Promise<EnvioEntity[]> {
        const anchor = await this.findProjeto(id);
        const siblings = await this.findSiblings(anchor);
        if (siblings.length === 0) return [];

        const fullPeps = siblings.map((s) => this.fullPep(s));
        return this.envioRepo.find({
            where: fullPeps.map((pep) => ({ pep })),
            order: { id: "ASC" },
        });
    }

    async getByZvgp(zvgp: string): Promise<Projeto | null> {
        return this.projetoRepo.findOne({ where: { zvgp } });
    }

    async getContactSuggestions(): Promise<string[]> {
        const rows = await this.projetoRepo
            .createQueryBuilder("p")
            .select([
                "p.contato_cliente_para",
                "p.contato_cliente_cc",
                "p.contato_weg_para",
                "p.contato_weg_cc",
            ])
            .where(
                "p.contato_cliente_para IS NOT NULL OR p.contato_cliente_cc IS NOT NULL OR p.contato_weg_para IS NOT NULL OR p.contato_weg_cc IS NOT NULL",
            )
            .getMany();

        const emails = new Set<string>();
        for (const row of rows) {
            for (const field of [row.contato_cliente_para, row.contato_cliente_cc, row.contato_weg_para, row.contato_weg_cc]) {
                if (field) field.split(";").map((e) => e.trim()).filter(Boolean).forEach((e) => emails.add(e));
            }
        }
        return [...emails].sort();
    }

    // ─── Lookup / Import ──────────────────────────────────────────────────────

    async lookupPepSuffixes(prefix: string): Promise<
        Array<{ pep_suffix: string; zvgp: string; gerador: string; ufv: string }>
    > {
        const [envioRows, projetoRows] = await Promise.all([
            this.envioRepo
                .createQueryBuilder("e")
                .select("e.pep", "pep")
                .addSelect("MAX(e.zvgp)", "zvgp")
                .addSelect("MAX(e.gerador)", "gerador")
                .addSelect("MAX(e.ufv)", "ufv")
                .where("e.pep LIKE :pattern", { pattern: `${prefix}-%` })
                .groupBy("e.pep")
                .orderBy("e.pep")
                .getRawMany<{ pep: string; zvgp: string; gerador: string; ufv: string }>(),
            this.projetoRepo
                .createQueryBuilder("p")
                .select("p.pep_suffix", "pep_suffix")
                .addSelect("p.zvgp", "zvgp")
                .addSelect("p.gerador", "gerador")
                .addSelect("p.nome_pep", "ufv")
                .where("p.pep_prefix = :prefix", { prefix })
                .andWhere("p.pep_suffix IS NOT NULL")
                .getRawMany<{ pep_suffix: string; zvgp: string; gerador: string; ufv: string }>(),
        ]);

        const map = new Map<string, { pep_suffix: string; zvgp: string; gerador: string; ufv: string }>();

        for (const row of projetoRows) {
            map.set(row.pep_suffix, {
                pep_suffix: row.pep_suffix,
                zvgp: row.zvgp ?? "",
                gerador: row.gerador ?? "",
                ufv: row.ufv ?? "",
            });
        }

        for (const row of envioRows) {
            const rawSuffix = row.pep.slice(prefix.length);
            const suffix = rawSuffix.startsWith("-") ? rawSuffix.slice(1) : rawSuffix;
            map.set(suffix, {
                pep_suffix: suffix,
                zvgp: row.zvgp ?? "",
                gerador: row.gerador ?? "",
                ufv: row.ufv ?? "",
            });
        }

        return [...map.values()].sort((a, b) => a.pep_suffix.localeCompare(b.pep_suffix));
    }

    async getPepItems(fullPep: string): Promise<ProjetoItemEnriched[]> {
        const lastDash = fullPep.lastIndexOf("-");
        if (lastDash <= 0) return [];
        const prefix = fullPep.slice(0, lastDash);
        const suffix = fullPep.slice(lastDash + 1);

        const row = await this.projetoRepo.findOne({
            where: { pep_prefix: prefix, pep_suffix: suffix },
            relations: { items: true },
        });
        if (!row) return [];

        const items = row.items ?? [];
        const enriched: ProjetoItemEnriched[] = await Promise.all(
            items.map(async (item) => {
                const delivered = await this.computeDeliveredByStatus(fullPep, item.sap);
                const entregue =
                    delivered.entregue +
                    (row.already_started ? (item.quantidade_entregue_manual ?? 0) : 0);
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

    async getZvgpItems(zvgp: string): Promise<ProjetoItemEnriched[]> {
        if (!zvgp) return [];

        const row = await this.projetoRepo.findOne({
            where: { zvgp },
            relations: { items: true },
        });
        if (!row) return [];

        const items = row.items ?? [];
        const enriched: ProjetoItemEnriched[] = await Promise.all(
            items.map(async (item) => {
                const delivered = await this.computeDeliveredByZvgp(
                    zvgp,
                    item.sap,
                );
                const entregue =
                    delivered.entregue +
                    (row.already_started
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

    private async computeDeliveredByZvgp(
        zvgp: string,
        sap: string,
    ): Promise<{ separado: number; enviado: number; entregue: number }> {
        const rows = await this.envioRepo
            .createQueryBuilder("e")
            .innerJoin("e.materiais", "m")
            .select("e.status", "status")
            .addSelect("COALESCE(SUM(m.quantidade), 0)", "total")
            .where("e.zvgp = :zvgp", { zvgp })
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

    async importFromEnvios(): Promise<Projeto[]> {
        const envioRows = await this.envioRepo
            .createQueryBuilder("e")
            .select("e.pep", "pep")
            .addSelect("MAX(e.ufv)", "ufv")
            .addSelect("MAX(e.zvgp)", "zvgp")
            .addSelect("MAX(e.gerador)", "gerador")
            .groupBy("e.pep")
            .orderBy("e.pep")
            .getRawMany<{ pep: string; ufv: string; zvgp: string; gerador: string }>();

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
                group.suffixes.set(suffix, { zvgp: row.zvgp, gerador: row.gerador });
            }
        }

        // Load all existing rows grouped by prefix
        const existingRows = await this.projetoRepo.find();
        const existingByPrefix = new Map<string, Projeto[]>();
        for (const r of existingRows) {
            if (!existingByPrefix.has(r.pep_prefix))
                existingByPrefix.set(r.pep_prefix, []);
            existingByPrefix.get(r.pep_prefix)!.push(r);
        }

        const affected: Projeto[] = [];
        for (const [prefix, group] of prefixMap.entries()) {
            const existing = existingByPrefix.get(prefix) ?? [];

            if (existing.length === 0) {
                // Create anchor + sibling rows
                const anchor = await this.projetoRepo.save(
                    this.projetoRepo.create({
                        nome: group.ufv || prefix,
                        pep_prefix: prefix,
                        pm: "",
                        analista: "",
                        already_started: true,
                    }),
                );

                for (const [suffix, { zvgp, gerador }] of group.suffixes.entries()) {
                    await this.projetoRepo.save(
                        this.projetoRepo.create({
                            ...anchor,
                            id: undefined as any,
                            pep_suffix: suffix,
                            zvgp,
                            gerador,
                        }),
                    );
                }

                const full = await this.projetoRepo.findOne({ where: { id: anchor.id } });
                if (full) affected.push(full);
            } else {
                const existingSuffixes = new Set(existing.map((r) => r.pep_suffix).filter(Boolean));
                let addedAny = false;
                const anchorRow = existing[0];
                for (const [suffix, { zvgp, gerador }] of group.suffixes.entries()) {
                    if (!existingSuffixes.has(suffix)) {
                        await this.projetoRepo.save(
                            this.projetoRepo.create({
                                secao: anchorRow.secao,
                                nome: anchorRow.nome,
                                cliente: anchorRow.cliente,
                                produto: anchorRow.produto,
                                pep_prefix: prefix,
                                pep_suffix: suffix,
                                pm: anchorRow.pm,
                                analista: anchorRow.analista,
                                already_started: anchorRow.already_started,
                                workflow_status: anchorRow.workflow_status,
                                zvgp,
                                gerador,
                            }),
                        );
                        addedAny = true;
                    }
                }
                if (addedAny) {
                    const full = await this.projetoRepo.findOne({ where: { id: anchorRow.id } });
                    if (full) affected.push(full);
                }
            }
        }

        return affected;
    }

    // ─── Workflow ─────────────────────────────────────────────────────────────

    async patchWorkflowStatus(
        id: string,
        dto: { workflow_status: string; pm?: string },
        userEmail: string,
        userToken: string,
    ): Promise<Projeto> {
        const projeto = await this.findProjeto(id);
        const previous = projeto.workflow_status;
        projeto.workflow_status = dto.workflow_status;
        if (dto.pm !== undefined) projeto.pm = dto.pm;
        await this.projetoRepo.save(projeto);

        if (previous === "RASCUNHO" && dto.workflow_status === "AGUARDANDO_GESTOR") {
            await this.sendEtapa1Email(projeto, userEmail, userToken).catch(() => undefined);
        } else if (previous === "AGUARDANDO_GESTOR" && dto.workflow_status === "ENVIO_EMAIL") {
            const updated = await this.findProjeto(id);
            await this.sendEtapa2Email(updated, userEmail, userToken).catch((err) => {
                if (err instanceof BadRequestException) throw err;
            });
        }

        return this.getProjeto(id);
    }

    // ─── Internal notification emails ─────────────────────────────────────────

    private async sendEtapa1Email(
        projeto: Projeto,
        userEmail: string,
        userToken: string,
    ): Promise<void> {
        const bosses = await this.peopleRepo.find({
            where: [
                { secao: projeto.secao, position: "boss" },
                { secao: "wau", position: "boss" },
            ],
        });
        const isProd = process.env.NODE_ENV === "production";
        const prodRecipients = bosses.map((b) => b.email).filter((e): e is string => Boolean(e));
        const toList = isProd ? prodRecipients : ["e-henchenski@weg.net"];
        if (toList.length === 0) return;

        const subject = isProd
            ? `[WAU] Novo projeto aguardando definição de PM — ${projeto.zvgp} ${projeto.cliente} ${projeto.pep_prefix}`
            : `TESTE - [WAU] Novo projeto aguardando definição de PM — ${projeto.zvgp} ${projeto.cliente} ${projeto.pep_prefix}`;

        const link = `${process.env.FRONTEND_URL ?? "http://localhost:3000"}/projetos/${projeto.id}`;
        const html = this.mailService.buildProjetoDetailsEmail(projeto, link, isProd, prodRecipients);
        await this.mailService.sendMail(toList, subject, html, userEmail, userToken);
    }

    private async sendEtapa2Email(
        projeto: Projeto,
        userEmail: string,
        userToken: string,
    ): Promise<void> {
        const [admins, financeList, controllers, pmRecord] = await Promise.all([
            this.peopleRepo.find({
                where: [
                    { secao: projeto.secao, position: "admin" },
                    { secao: "wau", position: "admin" },
                ],
            }),
            this.peopleRepo.find({ where: { secao: "wau", position: "finance" } }),
            this.peopleRepo.find({ where: { secao: "wau", position: "controller" } }),
            projeto.pm
                ? this.peopleRepo.findOne({ where: { name: projeto.pm, position: "pm" } })
                : null,
        ]);

        if (pmRecord && !pmRecord.email) {
            throw new BadRequestException(
                `PM "${projeto.pm}" não possui e-mail cadastrado. Cadastre o e-mail antes de avançar o workflow.`,
            );
        }

        const isProd = process.env.NODE_ENV === "production";
        const prodRecipients = [
            ...admins.map((p) => p.email),
            pmRecord?.email,
            ...financeList.map((p) => p.email),
            ...controllers.map((p) => p.email),
        ].filter((e): e is string => Boolean(e));

        const toList = isProd ? prodRecipients : ["e-henchenski@weg.net"];
        if (toList.length === 0) return;

        const subject = isProd
            ? `[WAU] Projeto pronto para envio de e-mail — ${projeto.zvgp} ${projeto.cliente} ${projeto.pep_prefix}`
            : `TESTE - [WAU] Projeto pronto para envio de e-mail — ${projeto.zvgp} ${projeto.cliente} ${projeto.pep_prefix}`;

        const link = `${process.env.FRONTEND_URL ?? "http://localhost:3000"}/projetos/${projeto.id}`;
        const html = this.mailService.buildInternalEmail({
            title: "Projeto aprovado — enviar e-mail ao cliente",
            lines: [
                `PEP: ${projeto.pep_prefix}`,
                `OV: ${projeto.zvgp}`,
                `Cliente: ${projeto.cliente ?? "—"}`,
                `PM: ${projeto.pm ?? "—"}`,
                `Seção: ${projeto.secao ?? "—"}`,
            ],
            ctaLabel: "Abrir projeto",
            ctaLink: link,
            isProd,
            prodRecipients,
        });

        await this.mailService.sendMail(toList, subject, html, userEmail, userToken);
    }

    // ─── Email ────────────────────────────────────────────────────────────────

    async sendProjetoEmail(
        id: string,
        language: string,
        userEmail: string,
        userToken: string,
    ): Promise<void> {
        const projeto = await this.getProjeto(id);
        const pmRecord = await this.peopleRepo.findOne({
            where: { name: projeto.pm, position: "pm" },
        });
        const pmEmail = pmRecord?.email ?? "";

        const isProd = process.env.NODE_ENV === "production";
        const splitEmails = (val: string | null | undefined): string[] =>
            val ? val.split(";").map((e) => e.trim()).filter(Boolean) : [];

        const baseSubject = `${projeto.cliente ?? ""} / OC nº ${projeto.ordem_pedido_compra ?? ""} / OV nº ${projeto.zvgp ?? ""} / PEP ${projeto.pep_prefix}`;

        const clientePara = splitEmails(projeto.contato_cliente_para);
        const clienteCc = splitEmails(projeto.contato_cliente_cc);
        const wegPara = splitEmails(projeto.contato_weg_para);
        const wegCc = [
            ...splitEmails(projeto.contato_weg_cc),
            ...(pmEmail ? [pmEmail] : []),
            userEmail,
        ].filter(Boolean);

        const realTo = clientePara;
        const realCc = [...clienteCc, ...wegPara, ...wegCc];

        const toRecipients = isProd ? realTo : ["e-henchenski@weg.net"];
        const subject = isProd ? baseSubject : `TESTE - ${baseSubject}`;
        const ccRecipients = isProd ? realCc : [];

        const html = this.mailService.buildProjetoEmail(
            projeto, pmEmail, language, isProd,
            clientePara, clienteCc, wegPara, wegCc,
        );
        await this.mailService.sendMail(
            toRecipients.length > 0 ? toRecipients : ["e-henchenski@weg.net"],
            subject,
            html,
            userEmail,
            userToken,
            undefined,
            ccRecipients,
        );
    }

    async getProdutoOptions(): Promise<Record<string, string[]>> {
        const rows = await this.produtoOptionRepo.find({ order: { secao: "ASC", label: "ASC" } });
        const result: Record<string, string[]> = {};
        for (const row of rows) {
            if (!result[row.secao]) result[row.secao] = [];
            result[row.secao].push(row.label);
        }
        return result;
    }

    async putProdutoOptions(options: Record<string, string[]>): Promise<Record<string, string[]>> {
        await this.produtoOptionRepo.delete({});
        const entities: ProdutoOption[] = [];
        for (const [secao, labels] of Object.entries(options)) {
            for (const label of labels) {
                const e = this.produtoOptionRepo.create({ secao, label });
                entities.push(e);
            }
        }
        if (entities.length > 0) await this.produtoOptionRepo.save(entities);
        return options;
    }
}

const projetosServiceProvider: ClassProvider<IProjetosService> = {
    provide: IProjetosService,
    useClass: ProjetosService,
};

export default projetosServiceProvider;

import { Injectable } from "@nestjs/common";
import Projeto from "../entities/projeto.entity";
import ProjetoPep from "../entities/projeto-pep.entity";
import ProjetoItem from "../entities/projeto-item.entity";
import ProjetoFormDto from "../dtos/projeto-form.dto";
import ProjetoPepFormDto from "../dtos/projeto-pep-form.dto";
import ProjetoItemFormDto from "../dtos/projeto-item-form.dto";
import BulkItemsDto from "../dtos/bulk-items.dto";
import EnvioEntity from "../../envios/entities/envio.entity";

export interface ProjetoItemEnriched extends ProjetoItem {
    /** Qty in SEPARACAO-status envios */
    quantidade_separado: number;
    /** Qty in ENVIADO-status envios */
    quantidade_enviado: number;
    /** Qty in ENTREGUE-status envios + manual base (for already_started) */
    quantidade_entregue: number;
    /** True when this item has no ProjetoItem record — derived purely from Envio materials */
    is_virtual: boolean;
}

export interface ProjetoPepEnriched extends ProjetoPep {
    items: ProjetoItemEnriched[];
}

export interface ProjetoSummary extends Projeto {
    peps: ProjetoPepEnriched[];
}

export interface AggregateRow {
    sap: string;
    descricao: string;
    quantidade_necessaria: number;
    quantidade_separado: number;
    quantidade_enviado: number;
    quantidade_entregue: number;
    saldo: number;
    /** True when this SAP has no ProjetoItem record in any PEP — only envio deliveries */
    is_virtual: boolean;
}

/** Projeto with computed delivery progress statistics */
export interface ProjetoWithStats extends Projeto {
    total_necessaria: number;
    total_separado: number;
    total_enviado: number;
    total_entregue: number;
    /** null when total_necessaria === 0 */
    pct_entregue: number | null;
}

@Injectable()
export abstract class IProjetosService {
    abstract createProjeto(dto: ProjetoFormDto): Promise<Projeto>;
    abstract listProjetosWithStats(filters?: {
        nome?: string;
        pep_prefix?: string;
        pm?: string;
        analista?: string;
    }): Promise<ProjetoWithStats[]>;
    abstract getProjeto(id: string): Promise<Projeto>;
    abstract updateProjeto(id: string, dto: ProjetoFormDto): Promise<Projeto>;

    abstract addPep(projetoId: string, dto: ProjetoPepFormDto): Promise<ProjetoPep>;
    abstract updatePep(
        projetoId: string,
        pepId: string,
        dto: ProjetoPepFormDto,
    ): Promise<ProjetoPep>;
    abstract removePep(projetoId: string, pepId: string): Promise<void>;

    abstract bulkReplaceItems(
        projetoId: string,
        pepId: string,
        dto: BulkItemsDto,
    ): Promise<ProjetoItem[]>;
    abstract updateItem(
        projetoId: string,
        pepId: string,
        itemId: string,
        dto: ProjetoItemFormDto,
    ): Promise<ProjetoItem>;

    abstract getSummary(id: string): Promise<ProjetoSummary>;
    abstract getAggregate(id: string): Promise<AggregateRow[]>;

    /** Returns all envios whose PEP starts with this project's pep_prefix + any known suffix */
    abstract getEnviosByProjeto(id: string): Promise<EnvioEntity[]>;

    /** Returns unique PEP suffixes (with zvgp/gerador/ufv) from existing Envios
     *  whose pep starts with the given prefix. */
    abstract lookupPepSuffixes(
        prefix: string,
    ): Promise<Array<{ pep_suffix: string; zvgp: string; gerador: string; ufv: string }>>;

    /** Returns the enriched items (with delivery quantities) for a specific full PEP string.
     *  Looks up the matching ProjetoPep across all projects. */
    abstract getPepItems(fullPep: string): Promise<ProjetoItemEnriched[]>;

    /** Creates projects (with PEPs) for every Projeto found in Envios
     *  that doesn't have a matching Projeto yet. Returns the created projects. */
    abstract importFromEnvios(): Promise<Projeto[]>;
}

import { Injectable } from "@nestjs/common";
import Projeto from "../entities/projeto.entity";
import ProjetoItem from "../entities/projeto-item.entity";
import ProjetoFormDto from "../dtos/projeto-form.dto";
import ProjetoPepFormDto from "../dtos/projeto-pep-form.dto";
import ProjetoItemFormDto from "../dtos/projeto-item-form.dto";
import BulkItemsDto from "../dtos/bulk-items.dto";
import EnvioEntity from "../../envios/entities/envio.entity";

export interface ProjetoItemEnriched extends ProjetoItem {
    quantidade_separado: number;
    quantidade_enviado: number;
    /** Qty in ENTREGUE-status envios + manual base (for already_started) */
    quantidade_entregue: number;
    /** True when this item has no ProjetoItem record — derived purely from Envio materials */
    is_virtual: boolean;
}

/** A "PEP entry" as seen by the frontend — maps to a single projetos row */
export interface ProjetoPepEnriched {
    id: string;
    /** Points to self (unified model: projetos row IS the pep entry) */
    projeto_id: string;
    nome: string | null;
    pep_suffix: string;
    zvgp: string | null;
    zrgp: string | null;
    gerador: string | null;
    data_preparacao: string | null;
    ml: number | null;
    is_cpc47?: boolean | null;
    items: ProjetoItemEnriched[];
    created_at: Date;
    updated_at: Date;
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
    is_virtual: boolean;
}

export interface ProjetoPepWithStats extends ProjetoPepEnriched {
    pct_entregue: number | null;
}

export interface ProjetoWithStats extends Omit<Projeto, "items"> {
    total_necessaria: number;
    total_separado: number;
    total_enviado: number;
    total_entregue: number;
    pct_entregue: number | null;
    peps?: ProjetoPepWithStats[];
}

@Injectable()
export abstract class IProjetosService {
    abstract createProjeto(dto: ProjetoFormDto): Promise<Projeto>;
    abstract listProjetosWithStats(filters?: {
        nome?: string;
        pep_prefix?: string;
        pm?: string;
        analista?: string;
        secao?: string;
    }): Promise<ProjetoWithStats[]>;
    abstract getProjeto(id: string): Promise<Projeto>;
    abstract updateProjeto(id: string, dto: ProjetoFormDto): Promise<Projeto>;
    abstract deleteProjeto(id: string): Promise<void>;

    abstract addPep(projetoId: string, dto: ProjetoPepFormDto): Promise<Projeto>;
    abstract updatePep(projetoId: string, pepId: string, dto: ProjetoPepFormDto): Promise<Projeto>;
    abstract removePep(projetoId: string, pepId: string): Promise<void>;

    abstract bulkReplaceItems(projetoId: string, pepId: string, dto: BulkItemsDto): Promise<ProjetoItem[]>;
    abstract updateItem(projetoId: string, pepId: string, itemId: string, dto: ProjetoItemFormDto): Promise<ProjetoItem>;

    abstract getSummary(id: string): Promise<ProjetoSummary>;
    abstract getAggregate(id: string): Promise<AggregateRow[]>;
    abstract getEnviosByProjeto(id: string): Promise<EnvioEntity[]>;

    abstract getByZvgp(zvgp: string): Promise<import("../entities/projeto.entity").default | null>;
    abstract getContactSuggestions(): Promise<string[]>;

    abstract lookupPepSuffixes(prefix: string): Promise<
        Array<{ pep_suffix: string; zvgp: string; gerador: string; ufv: string }>
    >;
    abstract getPepItems(fullPep: string): Promise<ProjetoItemEnriched[]>;
    abstract getZvgpItems(zvgp: string): Promise<ProjetoItemEnriched[]>;
    abstract importFromEnvios(): Promise<Projeto[]>;

    abstract patchWorkflowStatus(
        id: string,
        dto: { workflow_status: string; pm?: string },
        userEmail: string,
        userToken: string,
    ): Promise<Projeto>;

    abstract sendProjetoEmail(
        id: string,
        language: string,
        userEmail: string,
        userToken: string,
        confirmed?: boolean,
    ): Promise<void>;

    abstract getProdutoOptions(): Promise<Record<string, string[]>>;
    abstract putProdutoOptions(options: Record<string, string[]>): Promise<Record<string, string[]>>;
}

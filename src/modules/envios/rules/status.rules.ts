import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import ENV_VARIABLE_NAMES from "../../../utils/env_variable_names";

export enum StatusEnvio {
    RASCUNHO = "RASCUNHO",
    SEPARACAO = "SEPARACAO",
    ENVIADO = "ENVIADO",
    ENTREGUE = "ENTREGUE",
    CANCELADO = "CANCELADO",
}

export type FormField =
    | "ufv"
    | "pep"
    | "zvgp"
    | "gerador"
    | "separacao"
    | "data_enviado"
    | "data_entregue"
    | "previsao_chegada"
    | "status"
    | "observacoes"
    | "materiaisTable"
    | "created_at"
    | "updated_at";

export type StatusRule = {
    id: StatusEnvio;
    name: string;
    required: readonly FormField[];
    editable: readonly FormField[];
    next?: StatusEnvio;
    previous?: StatusEnvio;
    notify?: string | string[];
};

export const STATUS_RULES: Record<StatusEnvio, StatusRule> = {
    RASCUNHO: {
        id: StatusEnvio.RASCUNHO,
        name: "Rascunho",
        required: ["ufv", "pep", "zvgp", "gerador", "separacao"],
        editable: [
            "ufv",
            "pep",
            "zvgp",
            "gerador",
            "separacao",
            "observacoes",
            "materiaisTable",
        ],
        next: StatusEnvio.SEPARACAO,
    },
    SEPARACAO: {
        id: StatusEnvio.SEPARACAO,
        name: "Separação",
        required: ["data_enviado"],
        editable: ["separacao", "data_enviado", "observacoes"],
        notify: ["kamila@weg.net", "dihego@weg.net", "mmazzucco@weg.net"],
        next: StatusEnvio.ENVIADO,
        previous: StatusEnvio.CANCELADO,
    },
    ENVIADO: {
        id: StatusEnvio.ENVIADO,
        name: "Enviado",
        required: ["data_entregue"],
        editable: ["separacao", "data_enviado", "previsao_chegada", "data_entregue", "observacoes"],
        next: StatusEnvio.ENTREGUE,
    },
    ENTREGUE: {
        id: StatusEnvio.ENTREGUE,
        name: "Entregue",
        required: [],
        editable: [],
        // terminal — no next or previous
    },
    CANCELADO: {
        id: StatusEnvio.CANCELADO,
        name: "Cancelado",
        required: [],
        editable: [],
        next: StatusEnvio.RASCUNHO,
    },
} as const;

const DEFAULT_STATUS_RULE: StatusRule = {
    id: StatusEnvio.RASCUNHO,
    name: "Rascunho",
    required: ["ufv", "pep", "zvgp", "gerador", "separacao"],
    editable: [
        "ufv",
        "pep",
        "zvgp",
        "gerador",
        "separacao",
        "observacoes",
        "materiaisTable",
    ],
    next: StatusEnvio.RASCUNHO,
};

@Injectable()
export class StatusRulesService {
    private readonly isProd: boolean;
    private readonly statusRules: Record<StatusEnvio, StatusRule>;

    constructor(private readonly configService: ConfigService) {
        const nodeEnv = (this.configService.get(ENV_VARIABLE_NAMES.NODE_ENV) || "").trim().toLowerCase();
        this.isProd = nodeEnv === "production";

        console.log(`[StatusRulesService] NODE_ENV: "${nodeEnv}", isProd: ${this.isProd}`);

        this.statusRules = {
            ...STATUS_RULES,
            [StatusEnvio.SEPARACAO]: {
                ...STATUS_RULES[StatusEnvio.SEPARACAO],
                notify: !this.isProd
                    ? ["e-henchenski@weg.net", "e-henchenski@weg.net"]
                    : STATUS_RULES[StatusEnvio.SEPARACAO].notify,
            },
        };
    }

    getAllRules(): StatusRule[] {
        return Object.values(this.statusRules);
    }

    getStatus(status?: StatusEnvio): StatusRule {
        if (!status) return DEFAULT_STATUS_RULE;
        return this.statusRules[status] ?? DEFAULT_STATUS_RULE;
    }
}

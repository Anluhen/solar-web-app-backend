import { Injectable } from "@nestjs/common";

export enum StatusEnvio {
    RASCUNHO = "RASCUNHO",
    ENVIADO = "ENVIADO",
    SEPARACAO = "SEPARACAO",
    CANCELADO = "CANCELADO",
}

export type FormField =
    | "ufv"
    | "pep"
    | "zvgp"
    | "gerador"
    | "separacao"
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
    ENVIADO: {
        id: StatusEnvio.ENVIADO,
        name: "Enviado",
        required: ["separacao"],
        editable: ["separacao", "observacoes"],
        next: StatusEnvio.CANCELADO,
    },
    SEPARACAO: {
        id: StatusEnvio.SEPARACAO,
        name: "Separação",
        required: ["separacao"],
        editable: ["separacao", "observacoes"],
        notify: "e-henchenski@weg.net",
        previous: StatusEnvio.CANCELADO,
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
    getAllRules(): StatusRule[] {
        return Object.values(STATUS_RULES);
    }

    getStatus(status?: StatusEnvio): StatusRule {
        if (!status) return DEFAULT_STATUS_RULE;
        return STATUS_RULES[status] ?? DEFAULT_STATUS_RULE;
    }
}

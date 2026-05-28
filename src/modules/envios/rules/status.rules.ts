import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import ENV_VARIABLE_NAMES from "../../../utils/env_variable_names";
import { AppConfigService } from "../../app-config/services/app-config.service";

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
    | "secao"
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
            "secao",
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
        next: StatusEnvio.ENVIADO,
        previous: StatusEnvio.CANCELADO,
    },
    ENVIADO: {
        id: StatusEnvio.ENVIADO,
        name: "Enviado",
        required: ["data_entregue"],
        editable: [
            "separacao",
            "data_enviado",
            "previsao_chegada",
            "data_entregue",
            "observacoes",
        ],
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
        "secao",
        "separacao",
        "observacoes",
        "materiaisTable",
    ],
    next: StatusEnvio.RASCUNHO,
};

export const SEPARACAO_NOTIFY_EMAILS_KEY = "separacao_notify_emails";

@Injectable()
export class StatusRulesService {
    constructor(
        private readonly configService: ConfigService,
        private readonly appConfigService: AppConfigService,
    ) {}

    getAllRules(): StatusRule[] {
        return Object.values(STATUS_RULES);
    }

    getStatus(status?: StatusEnvio): StatusRule {
        if (!status) return DEFAULT_STATUS_RULE;
        return STATUS_RULES[status] ?? DEFAULT_STATUS_RULE;
    }

    /** Returns SEPARACAO notify emails: DB value takes precedence over env var. */
    async getSeparacaoNotifyEmails(): Promise<string[]> {
        const dbValue = await this.appConfigService.get(SEPARACAO_NOTIFY_EMAILS_KEY);
        if (dbValue !== null) {
            return dbValue.split(",").map((e) => e.trim()).filter(Boolean);
        }
        const envValue = this.configService.get<string>(ENV_VARIABLE_NAMES.SEPARACAO_NOTIFY_EMAILS);
        return envValue
            ? envValue.split(",").map((e) => e.trim()).filter(Boolean)
            : [];
    }

    async setSeparacaoNotifyEmails(emails: string[]): Promise<void> {
        await this.appConfigService.set(SEPARACAO_NOTIFY_EMAILS_KEY, emails.join(","));
    }
}

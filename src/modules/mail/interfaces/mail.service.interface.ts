import { Injectable } from "@nestjs/common";

export interface ProjetoEmailData {
    secao?: string | null;
    cliente?: string | null;
    pm?: string | null;
    nome?: string | null;
    produto?: string | null;
    cns_ano?: string | null;
    pep_prefix: string;
    data_criacao_pep?: string | null;
    data_primeiro_envio?: string | null;
    zvgp?: string | null;
    zrgp?: string | null;
    ordem_pedido_compra?: string | null;
    valor_total_liq?: number | null;
    moeda_total_liq?: string | null;
    claim?: string | null;
    data_claim?: string | null;
    ml?: number | null;
    custos_ipex?: boolean | null;
    is_cpc47?: boolean | null;
    contato_cliente_para?: string | null;
    contato_cliente_cc?: string | null;
    contato_weg_para?: string | null;
    contato_weg_cc?: string | null;
    observacoes_admin?: string | null;
    observacoes_chefe?: string | null;
}

@Injectable()
export abstract class IMailService {
    abstract sendMail(
        to: string | string[],
        subject: string,
        html: string,
        userEmail: string,
        userToken: string,
        text?: string,
        cc?: string[],
        bcc?: string[],
    ): Promise<void>;

    abstract buildProjetoDetailsEmail(
        projeto: ProjetoEmailData,
        link: string,
        isProd: boolean,
        prodRecipients: string[],
    ): string;

    abstract buildInternalEmail(opts: {
        title: string;
        lines: string[];
        ctaLabel: string;
        ctaLink: string;
        isProd: boolean;
        prodRecipients?: string[];
    }): string;

    abstract buildProjetoEmail(
        projeto: ProjetoEmailData,
        pmEmail: string,
        language: string,
        isProd?: boolean,
        clientePara?: string[],
        clienteCc?: string[],
        wegPara?: string[],
        wegCc?: string[],
    ): string;
}

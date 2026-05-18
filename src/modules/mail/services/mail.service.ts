import { Injectable, ClassProvider } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createTransport, getTestMessageUrl, Transporter } from "nodemailer";
import { IMailService, ProjetoEmailData } from "../interfaces/mail.service.interface";
import ENV_VARIABLE_NAMES from "src/utils/env_variable_names";

@Injectable()
class MailService implements IMailService {
    private readonly transporter: Transporter;
    private readonly usesTestAccount: boolean;
    private readonly isProd: boolean;

    constructor(private readonly configService: ConfigService) {
        const configuredHost = this.configService.get<string>(
            ENV_VARIABLE_NAMES.MAIL_HOST,
        );

        console.log("Creating transport...");
        const configuredPort = Number(
            this.configService.getOrThrow(ENV_VARIABLE_NAMES.MAIL_PORT),
        );

        if (Number.isNaN(configuredPort)) {
            throw new Error("MAIL_PORT must be a valid number");
        }

        const isDev =
            this.configService.getOrThrow(ENV_VARIABLE_NAMES.NODE_ENV) ===
            "development";

        this.isProd =
            this.configService.getOrThrow(ENV_VARIABLE_NAMES.NODE_ENV) ===
            "production";

        const mailOptions = {
            host: configuredHost,
            port: configuredPort,
            secure: false,
            auth: {
                user: this.configService.getOrThrow(
                    ENV_VARIABLE_NAMES.MAIL_USERNAME,
                ),
                pass: this.configService.getOrThrow(
                    ENV_VARIABLE_NAMES.MAIL_PASSWORD,
                ),
            },
            tls: {
                rejectUnauthorized: false,
            },
        };

        const testOptions = {
            host: "smtp.ethereal.email",
            port: 587,
            secure: false,
            auth: {
                user: "bernadette.bradtke84@ethereal.email",
                pass: "zhst7ucu5Zsc2n5Ucu",
            },
        };

        const options = isDev ? testOptions : mailOptions;

        this.transporter = createTransport(options);
        this.usesTestAccount = isDev;

        if (isDev) {
            console.log(
                "Test transport created in host: %s:%s",
                testOptions.host,
                testOptions.host,
            );
        } else {
            console.log(
                "Transport created in host: %s:%s",
                mailOptions.host,
                mailOptions.port,
            );
        }
    }

    async sendMail(
        to: string | string[],
        subject: string,
        html: string,
        userEmail: string,
        userToken: string,
        text?: string,
        cc?: string[],
    ): Promise<void> {
        try {
            const sender = userEmail;
            const mailFrom = this.configService.getOrThrow(
                ENV_VARIABLE_NAMES.MAIL_USERNAME,
            );
            const toArray = Array.isArray(to) ? to : [to];
            const ccList = [sender, ...(cc ?? [])].filter(Boolean);

            console.log(
                "Sending mail from host: %s",
                this.configService.getOrThrow(ENV_VARIABLE_NAMES.MAIL_HOST),
            );
            console.log("Sending mail from user: %s", mailFrom);
            console.log("Sending mail as %s", sender);
            console.log("Sending mail to %s", toArray.join(", "));
            console.log("Sending mail cc %s", ccList.join(", "));

            const info = await this.transporter.sendMail({
                from: mailFrom,
                cc: ccList,
                to,
                subject,
                html,
                ...(text ? { text } : {}),
            });

            console.log("Message sent: %s", info.messageId);
            if (this.usesTestAccount) {
                console.log("Preview URL: %s", getTestMessageUrl(info));
            }
        } catch (err) {
            console.error("Error while sending mail", err);
            throw err instanceof Error
                ? err
                : new Error("Unexpected error while sending mail");
        }
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private esc(val: string | null | undefined): string {
        if (!val) return "";
        return val.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }

    private fmtDate(v: string | null | undefined): string {
        if (!v) return "—";
        const parts = v.split("T")[0].split("-");
        if (parts.length !== 3) return v;
        const [year, month, day] = parts;
        return `${day}/${month}/${year}`;
    }

    private ctaButton(href: string, label: string): string {
        return `<a href="${href}" style="display:inline-block;background:#1976d2;color:#fff;padding:8px 18px;text-decoration:none;border-radius:4px;font-size:13px;font-family:Calibri,sans-serif;">${this.esc(label)}</a>`;
    }

    private testWarning(): string {
        return `<p style="font-family:Calibri,sans-serif;color:red;font-weight:bold;font-size:1.1em;margin:0 0 8px;">⚠️ ESSE E-MAIL É APENAS TESTE. DESCONSIDERAR.</p>`;
    }

    // ─── Email builders ───────────────────────────────────────────────────────

    buildProjetoDetailsEmail(
        projeto: ProjetoEmailData,
        link: string,
        isProd: boolean,
        prodRecipients: string[],
    ): string {
        const e = (v: string | null | undefined) => this.esc(v);
        const fmtBool = (v: boolean | null | undefined) =>
            v === true ? "SIM" : v === false ? "NÃO" : "—";
        const fmtCurrency = (v: number | null | undefined) =>
            v != null
                ? `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                : "—";
        const isSistemas = projeto.secao === "Sistemas" || projeto.secao === "Acionamentos";
        const isSolar = projeto.secao === "Solar";

        const row = (label: string, value: string) =>
            `<tr><td style="padding:7px 10px;color:#666;font-size:12px;width:42%;vertical-align:top;border-bottom:1px solid #ebebeb;white-space:nowrap;">${label}</td><td style="padding:7px 10px;font-size:13px;vertical-align:top;border-bottom:1px solid #ebebeb;">${value}</td></tr>`;
        const sectionTitle = (title: string) =>
            `<tr><td colspan="2" style="padding:10px 10px 4px;font-size:11px;font-weight:bold;color:#555;text-transform:uppercase;letter-spacing:.5px;border-bottom:1px solid #e0e0e0;background:#f0f0f0;">${title}</td></tr>`;

        const rows: string[] = [];
        rows.push(sectionTitle("Identificação do Fornecimento"));
        rows.push(row("Seção", e(projeto.secao)));
        rows.push(row("Cliente", e(projeto.cliente)));
        rows.push(row("PM", e(projeto.pm)));
        if (isSistemas) rows.push(row("Nome do Projeto", e(projeto.nome)));
        rows.push(row("Linha de Produto", e(projeto.produto)));
        if (isSolar) rows.push(row("CNS", e(projeto.cns_ano)));
        rows.push(row("PEP", e(projeto.pep_prefix)));
        rows.push(row("Data Criação do PEP", this.fmtDate(projeto.data_criacao_pep)));
        if (isSistemas) rows.push(row("Data Primeiro Envio", this.fmtDate(projeto.data_primeiro_envio)));
        if (isSistemas) rows.push(row("OV (ZVGP)", e(projeto.zvgp)));
        if (isSistemas) rows.push(row("Pedido de Compra", e(projeto.ordem_pedido_compra)));
        if (isSistemas) rows.push(row("Valor Total Líquido", fmtCurrency(projeto.valor_total_liq)));

        rows.push(sectionTitle("Financeiro / Qualidade"));
        rows.push(row("Claim", e(projeto.claim)));
        rows.push(row("Data Claim", this.fmtDate(projeto.data_claim)));
        rows.push(row("Margem Líquida", projeto.ml != null ? `${String(projeto.ml).replace(".", ",")}%` : "—"));
        if (isSistemas) rows.push(row("Custos lançados no IPEX?", fmtBool(projeto.custos_ipex)));
        rows.push(row(
            isSistemas ? "Pedido possui características para CPC?" : "Projeto é CPC 47?",
            fmtBool(projeto.is_cpc47),
        ));

        const hasContatos =
            projeto.contato_cliente_para || projeto.contato_cliente_cc ||
            projeto.contato_weg_para || projeto.contato_weg_cc;
        if (hasContatos) {
            rows.push(sectionTitle("Contatos"));
            rows.push(row("Para — Cliente", e(projeto.contato_cliente_para)));
            rows.push(row("Com Cópia — Cliente", e(projeto.contato_cliente_cc)));
            rows.push(row("Para — WEG", e(projeto.contato_weg_para)));
            rows.push(row("Com Cópia — WEG", e(projeto.contato_weg_cc)));
        }

        if (projeto.observacoes_admin || projeto.observacoes_chefe) {
            rows.push(sectionTitle("Observações"));
            if (projeto.observacoes_admin)
                rows.push(row("Administrativas", e(projeto.observacoes_admin).replace(/\n/g, "<br>")));
            if (isSistemas && projeto.observacoes_chefe)
                rows.push(row("Gestor", e(projeto.observacoes_chefe).replace(/\n/g, "<br>")));
        }

        const recipientsNote =
            !isProd && prodRecipients.length
                ? `<p style="font-family:Calibri,sans-serif;color:red;margin:0 0 12px;"><strong>Em produção este e-mail iria para:</strong> ${prodRecipients.join(", ")}</p>`
                : "";

        const body = `
<div style="font-family:Calibri,sans-serif;max-width:600px;">
  <h2 style="font-size:16px;margin:0 0 4px;">Novo projeto cadastrado — definir PM</h2>
  <p style="margin:0 0 12px;color:#555;font-size:13px;">Acesse o projeto para definir o PM e confirmar o CPC 47.</p>
  <p style="margin:0 0 4px;">${this.ctaButton(link, "Abrir projeto")}</p>
  <table style="width:auto;max-width:560px;border-collapse:collapse;background:#fafafa;border:1px solid #e0e0e0;border-radius:4px;margin:16px 0;">
    ${rows.join("")}
  </table>
</div>`;

        return isProd ? body : `${this.testWarning()}${recipientsNote}${body}`;
    }

    buildInternalEmail(opts: {
        title: string;
        lines: string[];
        ctaLabel: string;
        ctaLink: string;
        isProd: boolean;
        prodRecipients?: string[];
    }): string {
        const recipientsNote =
            !opts.isProd && opts.prodRecipients?.length
                ? `<p style="font-family:Calibri,sans-serif;color:red;margin:0 0 12px;"><strong>Em produção este e-mail iria para:</strong> ${opts.prodRecipients.join(", ")}</p>`
                : "";

        const body = `
<div style="font-family:Calibri,sans-serif;max-width:600px;">
  <h2 style="font-size:16px;margin:0 0 8px;font-family:Calibri,sans-serif;">${this.esc(opts.title)}</h2>
  <p style="margin:0 0 12px;">${this.ctaButton(opts.ctaLink, opts.ctaLabel)}</p>
  <ul style="margin:0;padding-left:20px;font-size:13px;">${opts.lines.map((l) => `<li style="margin-bottom:4px;">${this.esc(l)}</li>`).join("")}</ul>
</div>`;

        return opts.isProd ? body : `${this.testWarning()}${recipientsNote}${body}${this.testWarning()}`;
    }

    buildProjetoEmail(
        projeto: ProjetoEmailData,
        pmEmail: string,
        language: string,
        isProd = true,
        clientePara?: string[],
        clienteCc?: string[],
        wegPara?: string[],
        wegCc?: string[],
    ): string {
        const isEnglish = language === "ingles";
        const isSpanish = language === "espanhol";

        const p = (texto: string) =>
            `<p style="margin:0;font-family:Calibri,sans-serif;font-size:11pt;">${texto}</p>`;
        const bullet = (label: string, value: string) =>
            `<p style="margin:0;font-family:Calibri,sans-serif;font-size:11pt;">&#8226; <strong>${label}</strong> ${this.esc(value)}</p>`;
        const bulletEmail = (label: string, email: string) =>
            `<p style="margin:0;font-family:Calibri,sans-serif;font-size:11pt;">&#8226; <strong>${label}</strong> <a href="mailto:${this.esc(email)}">${this.esc(email)}</a></p>`;
        const br = `<p style="margin:0;">&nbsp;</p>`;

        let body: string;
        if (isEnglish) {
            body = [
                p("Dear Customer"),
                br,
                p(`Thank you for placing your order PO nº ${this.esc(projeto.ordem_pedido_compra)} - our PEP ${this.esc(projeto.pep_prefix)} / OV nº ${this.esc(projeto.zvgp)}. We would like to provide you with the details of your contract administrator:`),
                br,
                bullet("Internal Reference: PEP Nº", `${projeto.pep_prefix} / OV nº ${projeto.zvgp}`),
                bullet("Name:", projeto.pm ?? ""),
                bulletEmail("Email:", pmEmail),
                br,
                p(`From this point onwards, our colleague ${this.esc(projeto.pm)} will be your main point of contact for any technical and/or commercial matters regarding your order. His primary mission is to facilitate the production process by interacting with your company and all relevant WEG departments, ensuring the supply is delivered within the expected timeframe.`),
                br,
                p("For smoother communication, we suggest using our internal reference, as mentioned above, in your exchanges with us. If necessary, you may also contact us directly."),
                br,
                p("Once again, we thank you for your order and remain at your disposal."),
                br,
                p("Best Regards,"),
                br,
                `<p style="margin:0;font-family:Calibri,sans-serif;font-size:11pt;"><strong>Fabio de Souza</strong><br><strong>Head of Project and Contract Management – Systems</strong><br><strong>Phone: +55 (47) 3276-6700</strong><br><strong>WEG Automation &amp; Systems</strong></p>`,
                br,
                `<p style="margin:0;font-family:Calibri,sans-serif;font-size:11pt;color:#FD0303;"><em>*This is an automatic email – if you have any questions, please contact the administrator assigned to this contract.</em></p>`,
            ].join("\n");
        } else if (isSpanish) {
            body = [
                p("Estimado Cliente"),
                br,
                p(`Agradeciéndole por realizar su orden de compra nº ${this.esc(projeto.ordem_pedido_compra)} - nuestro PEP ${this.esc(projeto.pep_prefix)} / OV nº ${this.esc(projeto.zvgp)}, le informamos de los datos de su administrador de contrato:`),
                br,
                bullet("Ref. Interna: PEP Nº", `${projeto.pep_prefix} / OV nº ${projeto.zvgp}`),
                bullet("Nombre:", projeto.pm ?? ""),
                bulletEmail("Correo electrónico:", pmEmail),
                br,
                p(`A partir de este momento, nuestro colega ${this.esc(projeto.pm)} se convierte en su principal interlocutor para cualquier asunto técnico y/o comercial relacionado con su orden. Su principal misión es facilitar la fabricación de los mismos, interactuando con su empresa y con todas las áreas necesarias de WEG, contribuyendo de forma decisiva para que el suministro se produzca dentro del plazo previsto.`),
                br,
                p("Para facilitar los contactos, le sugerimos que utilice nuestra referencia interna anteriormente informada en sus comunicaciones con nosotros."),
                br,
                p("Eventualmente, si se considera necesario, también podemos ser contactados directamente."),
                br,
                p("Gracias nuevamente por su orden de compra, quedamos a su disposición."),
                br,
                p("Saludos cordiales,"),
                br,
                `<p style="margin:0;font-family:Calibri,sans-serif;font-size:11pt;"><strong>Fabio de Souza</strong><br><strong>Jefe de la Sección de Gestión de Proyectos y Contratos – Sistemas</strong><br><strong>Teléfono: +55 (47) 3276-6700</strong><br><strong>WEG Automatización &amp; Sistemas</strong></p>`,
                br,
                `<p style="margin:0;font-family:Calibri,sans-serif;font-size:11pt;color:#F30101;"><em>*Este es un correo electrónico automático; si tiene alguna duda, por favor contacte al administrador asignado a este contrato.</em></p>`,
            ].join("\n");
        } else {
            body = [
                p("Prezado Cliente"),
                br,
                p(`Agradecendo a colocação do seu pedido OC nº ${this.esc(projeto.ordem_pedido_compra)} - nosso PEP ${this.esc(projeto.pep_prefix)} / OV nº ${this.esc(projeto.zvgp)}, informamos os dados do administrador do seu contrato:`),
                br,
                bullet("Ref. Interna: PEP Nº", `${projeto.pep_prefix} / OV nº ${projeto.zvgp}`),
                bullet("Nome:", projeto.pm ?? ""),
                bulletEmail("E-mail:", pmEmail),
                br,
                p(`Deste momento em diante nosso colega ${this.esc(projeto.pm)} torna-se o principal interlocutor dos senhores para qualquer assunto técnico e/ou comercial relacionado com seu pedido. Sua missão maior é facilitar a fabricação do seu pedido, interagindo com sua empresa e com todas as áreas necessárias da WEG, contribuindo de forma decisiva para que o fornecimento ocorra dentro do prazo esperado.`),
                br,
                p("Para facilitar os contatos sugerimos que os senhores utilizem nossa referência interna acima informada em suas comunicações conosco."),
                br,
                p("Eventualmente, caso julgue necessário, também poderemos ser diretamente contatados."),
                br,
                p("Novamente agradecemos seu pedido e colocamo-nos ao seu inteiro dispor."),
                br,
                p("Cordialmente,"),
                br,
                `<p style="margin:0;font-family:Calibri,sans-serif;font-size:11pt;"><strong>Fabio de Souza</strong><br><strong>Chefe da Seção Gerenciamento de Projetos e Contratos – Sistemas</strong><br><strong>Fone: +55 (47) 3276-6700</strong><br><strong>WEG Automação &amp; Sistemas</strong></p>`,
                br,
                `<p style="margin:0;font-family:Calibri,sans-serif;font-size:11pt;color:#FB0303;"><em>*Este é um e-mail automático - em caso de dúvidas entre em contato com o administrador designado para este contrato.</em></p>`,
            ].join("\n");
        }

        const hasAny = clientePara?.length || clienteCc?.length || wegPara?.length || wegCc?.length;
        const recipientsNote =
            !isProd && hasAny
                ? `<p style="color:red;font-family:Calibri,sans-serif;font-size:11pt;"><strong>Em produção este e-mail iria para:</strong><br>` +
                  `Para — Cliente: ${(clientePara ?? []).join(", ") || "—"}<br>` +
                  `CC — Cliente: ${(clienteCc ?? []).join(", ") || "—"}<br>` +
                  `Para — WEG: ${(wegPara ?? []).join(", ") || "—"}<br>` +
                  `CC — WEG: ${(wegCc ?? []).join(", ") || "—"}</p>`
                : "";
        return isProd ? body : `${this.testWarning()}${recipientsNote}${body}${this.testWarning()}`;
    }
}

const mailServiceProvider: ClassProvider<IMailService> = {
    provide: IMailService,
    useClass: MailService,
};

export default mailServiceProvider;

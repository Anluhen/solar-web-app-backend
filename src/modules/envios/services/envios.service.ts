import {
    BadRequestException,
    ClassProvider,
    Inject,
    Injectable,
    InternalServerErrorException,
    NotFoundException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import EnvioEntity from "../entities/envio.entity";
import EnvioFormDto from "../dtos/envio-form.dto";
import { IEnviosService } from "../interfaces/envios.service.interface";
import { StatusEnvio, StatusRulesService } from "../rules/status.rules";
import { IMateriaisService } from "../../materiais/interfaces/materiais.service.interface";
import MaterialEntity from "../../materiais/entities/material.entity";
import { IMailService } from "../../mail/interfaces/mail.service.interface";
import ENV_VARIABLE_NAMES from "../../../utils/env_variable_names";

@Injectable()
class EnviosService implements IEnviosService {
    private readonly isProd: boolean;

    constructor(
        @InjectRepository(EnvioEntity, "postgreConnection")
        private readonly repo: Repository<EnvioEntity>,
        private readonly materiaisService: IMateriaisService,
        private readonly statusRulesService: StatusRulesService,
        @Inject(IMailService) private readonly mailService: IMailService,
        private readonly configService: ConfigService,
    ) {
        const nodeEnv = (
            this.configService.get(ENV_VARIABLE_NAMES.NODE_ENV) || ""
        )
            .trim()
            .toLowerCase();
        this.isProd = nodeEnv === "production";
    }

    async postEnvio(dto: EnvioFormDto): Promise<EnvioEntity> {
        const payload = { ...dto, ufv: dto.ufv ?? "SEM NOME" };
        const envio = this.repo.create(payload);
        return this.repo.save(envio);
    }

    getEnvios(opts?: {
        filters?: {
            id?: string;
            pep?: string;
            zvgp?: string;
            gerador?: string;
            ufv?: string;
            status?: string;
        };
    }): Promise<EnvioEntity[]> {
        const qb = this.repo.createQueryBuilder("envio");

        const f = opts?.filters ?? {};

        if (f.id && String(f.id).trim() !== "") {
            qb.andWhere("envio.id = :id", { id: String(f.id).trim() });
        }
        if (f.pep && f.pep.trim() !== "") {
            qb.andWhere("envio.pep ILIKE :pep", { pep: `%${f.pep.trim()}%` });
        }
        if (f.zvgp && f.zvgp.trim() !== "") {
            qb.andWhere("envio.zvgp ILIKE :zvgp", {
                zvgp: `%${f.zvgp.trim()}%`,
            });
        }
        if (f.gerador && f.gerador.trim() !== "") {
            qb.andWhere("envio.gerador ILIKE :gerador", {
                gerador: `%${f.gerador.trim()}%`,
            });
        }
        if (f.ufv && f.ufv.trim() !== "") {
            qb.andWhere("envio.ufv ILIKE :ufv", { ufv: `%${f.ufv.trim()}%` });
        }
        if (f.status && f.status.trim() !== "") {
            qb.andWhere("envio.status ILIKE :status", {
                status: `%${f.status.trim()}%`,
            });
        }

        // materiais are fetched via a dedicated endpoint; no relation join here

        qb.orderBy("envio.id", "ASC");
        return qb.getMany();
    }

    async getEnvio(id: string): Promise<EnvioEntity> {
        const envio = await this.repo.findOne({ where: { id: String(id) } });
        if (!envio) throw new NotFoundException(`Envio ${id} not found`);
        return envio;
    }

    async putEnvio(id: string, dto: EnvioFormDto): Promise<EnvioEntity> {
        const payload = { ...dto, ufv: dto.ufv ?? "SEM NOME" };
        const entity = await this.repo.preload({ id: String(id), ...payload });
        if (!entity) throw new NotFoundException(`Envio ${id} not found`);
        return this.repo.save(entity);
    }

    async advanceStatus(
        id: string,
        dto: EnvioFormDto,
        userEmail: string,
        userToken: string,
    ): Promise<EnvioEntity> {
        const current = await this.getEnvio(id);

        const rule = this.statusRulesService.getStatus(current.status);
        if (!rule?.next) {
            throw new BadRequestException(
                `Status ${current.status} cannot transition to another state.`,
            );
        }

        if (dto.status && dto.status !== current.status) {
            throw new BadRequestException(
                `Payload status ${dto.status} does not match envio status ${current.status}.`,
            );
        }

        const payload: EnvioFormDto = {
            ...current,
            status: rule.next,
            // Forward status-specific dates supplied by the caller
            ...(dto.data_enviado !== undefined && {
                data_enviado: dto.data_enviado,
            }),
            ...(dto.data_entregue !== undefined && {
                data_entregue: dto.data_entregue,
            }),
        };

        const materiais = await this.materiaisService.getMateriaisByEnvio(id);

        if (
            payload.status !== current.status &&
            payload.status === StatusEnvio.SEPARACAO &&
            !dto.skip_email
        ) {
            const to = this.statusRulesService.getStatus(
                payload.status,
            )?.notify;
            const subject = `${current.id} - Solicitação de Separação - ${current.ufv} - ${current.pep} `;
            const htmlBody = this.buildStatusEmail(
                subject,
                current,
                payload.status,
                materiais,
            );

            // In non-production environments, require frontend confirmation
            if (!this.isProd && !(dto as any).confirmed) {
                throw new BadRequestException({
                    message: "EMAIL_CONFIRMATION_REQUIRED",
                    emailData: {
                        from: userEmail,
                        to: Array.isArray(to) ? to : [to],
                        subject,
                    },
                });
            }

            await this.notifyStatusChange(to, subject, htmlBody, userEmail, userToken);
        }

        return this.putEnvio(id, payload);
    }

    async returnStatus(
        id: string,
        dto: EnvioFormDto,
        userEmail: string,
        userToken: string,
    ): Promise<EnvioEntity> {
        const current = await this.getEnvio(id);

        const rule = this.statusRulesService.getStatus(current.status);
        if (!rule?.previous) {
            throw new BadRequestException(
                `Status ${current.status} cannot return to another state.`,
            );
        }

        if (dto.status && dto.status !== current.status) {
            throw new BadRequestException(
                `Payload status ${dto.status} does not match envio status ${current.status}.`,
            );
        }

        const payload: EnvioFormDto = {
            ...current,
            status: rule.previous,
        };

        const materiais = await this.materiaisService.getMateriaisByEnvio(id);

        if (
            payload.status !== current.status &&
            payload.status === StatusEnvio.CANCELADO
        ) {
            const to = this.statusRulesService.getStatus(
                current.status,
            )?.notify;
            const subject = `CANCELAMENTO - ${current.id} - Solicitação de Separação - ${current.ufv} - ${current.pep} `;
            const htmlBody = this.buildStatusEmail(
                subject,
                current,
                payload.status,
                materiais,
            );

            // In non-production environments, require frontend confirmation
            if (!this.isProd && !(dto as any).confirmed) {
                throw new BadRequestException({
                    message: "EMAIL_CONFIRMATION_REQUIRED",
                    emailData: {
                        from: userEmail,
                        to: Array.isArray(to) ? to : [to],
                        subject,
                    },
                });
            }

            await this.notifyStatusChange(to, subject, htmlBody, userEmail, userToken);
        }

        return this.putEnvio(id, payload);
    }

    async bulkAdvanceStatus(
        ids: string[],
        userEmail: string,
        userToken: string,
        dates?: { separacao?: string; data_enviado?: string; data_entregue?: string },
    ): Promise<{ id: string; status: string; error?: string }[]> {
        const results: { id: string; status: string; error?: string }[] = [];

        for (const id of ids) {
            try {
                // Pass confirmed:true to skip email confirmation dialog for batch ops
                // Also forward any date fields relevant to this transition
                const updated = await this.advanceStatus(
                    id,
                    {
                        confirmed: true,
                        ...(dates?.separacao && { separacao: dates.separacao }),
                        ...(dates?.data_enviado && {
                            data_enviado: dates.data_enviado,
                        }),
                        ...(dates?.data_entregue && {
                            data_entregue: dates.data_entregue,
                        }),
                    } as any,
                    userEmail,
                    userToken,
                );
                results.push({ id, status: updated.status });
            } catch (err) {
                const message =
                    err instanceof Error ? err.message : String(err);
                const envio = await this.getEnvio(id).catch(() => null);
                results.push({
                    id,
                    status: envio?.status ?? "UNKNOWN",
                    error: message,
                });
            }
        }

        return results;
    }

    async deleteEnvio(id: string): Promise<EnvioEntity> {
        const entity = await this.repo.findOne({ where: { id: String(id) } });
        if (!entity) throw new NotFoundException(`Envio ${id} not found`);
        await this.repo.remove(entity);
        return entity;
    }

    private buildStatusEmail(
        subject: string,
        current: EnvioEntity,
        nextStatus: StatusEnvio | undefined,
        materiais: MaterialEntity[],
    ): string {
        const tableStyle =
            "width:100%;border-collapse:collapse;font-family:Arial,Helvetica,sans-serif;";
        const headerCellStyle =
            "padding:8px;border:1px solid #d0d7de;background-color:#f4f6fa;text-align:left;";
        const cellStyle = "padding:8px;border:1px solid #d0d7de;";

        const envioDetails: Array<[string, unknown]> = [
            ["PEP", current.pep],
            ["ZVGP", current.zvgp],
            ["Gerador", current.gerador],
            ["UFV", current.ufv],
            ["Observações", current.observacoes ?? ""],
            ["Data de separação", this.formatSeparationDate(current.separacao)],
        ];

        const envioRows = envioDetails
            .map(
                ([label, value]) => `
            <tr>
                <th style="${headerCellStyle}">${this.escapeHtml(label)}</th>
                <td style="${cellStyle}">${this.escapeHtml(this.formatCell(value))}</td>
            </tr>
            `,
            )
            .join("");

        const materiaisRows =
            materiais.length > 0
                ? materiais
                      .map(
                          (material) => `
                      <tr>
                          <td style="${cellStyle}">${this.escapeHtml(this.formatCell(material.sap))}</td>
                          <td style="${cellStyle}">${this.escapeHtml(this.formatCell(material.descricao))}</td>
                          <td style="${cellStyle}">${this.escapeHtml(this.formatCell(material.quantidade))}</td>
                      </tr>
                  `,
                      )
                      .join("")
                : `<tr><td style="${cellStyle}" colspan="3">Nenhum material cadastrado.</td></tr>`;

        return `
            <div style="font-family:Arial,Helvetica,sans-serif;color:#1f2933;">
                <h2 style="margin-bottom:16px;">${subject}</h2>
                <table style="${tableStyle}">
                    <tbody>${envioRows}</tbody>
                </table>
                <h3 style="margin-top:24px;margin-bottom:8px;">Materiais</h3>
                <table style="${tableStyle}">
                    <thead>
                        <tr>
                            <th style="${headerCellStyle}">SAP</th>
                            <th style="${headerCellStyle}">Descrição</th>
                            <th style="${headerCellStyle}">Quantidade</th>
                        </tr>
                    </thead>
                    <tbody>${materiaisRows}</tbody>
                </table>
            </div>
            `;
    }

    private escapeHtml(value: unknown): string {
        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    private formatCell(value: unknown): string {
        if (value === null || value === undefined) return "";
        if (value instanceof Date) return value.toISOString();
        return String(value);
    }

    private formatSeparationDate(value: unknown): string {
        if (value === null || value === undefined || value === "") return "";

        const formatDate = (date: Date): string => {
            const day = String(date.getUTCDate()).padStart(2, "0");
            const month = String(date.getUTCMonth() + 1).padStart(2, "0");
            const year = String(date.getUTCFullYear());
            return `${day}/${month}/${year}`;
        };

        if (value instanceof Date) {
            return formatDate(value);
        }

        if (typeof value === "number") {
            const parsed = new Date(value);
            if (!Number.isNaN(parsed.getTime())) {
                return formatDate(parsed);
            }
        }

        if (typeof value === "string") {
            const trimmed = value.trim();
            const dateOnlyMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
            if (dateOnlyMatch) {
                const [, year, month, day] = dateOnlyMatch;
                return `${day}/${month}/${year}`;
            }

            const parsed = new Date(trimmed);
            if (!Number.isNaN(parsed.getTime())) {
                return formatDate(parsed);
            }

            return trimmed;
        }

        return String(value);
    }

    private async notifyStatusChange(
        recipients: string | string[] | undefined | null,
        subject: string,
        htmlBody: string,
        userEmail: string,
        userToken: string,
    ): Promise<void> {
        if (
            !recipients ||
            !(
                typeof recipients === "string" ||
                (Array.isArray(recipients) && recipients.length > 0)
            )
        ) {
            return;
        }

        try {
            await this.mailService.sendMail(
                recipients,
                subject,
                htmlBody,
                userEmail,
                userToken,
            );
        } catch {
            throw new InternalServerErrorException(
                "Failed to send status change notification.",
            );
        }
    }
}

const enviosServiceProvider: ClassProvider<IEnviosService> = {
    provide: IEnviosService,
    useClass: EnviosService,
};

export default enviosServiceProvider;

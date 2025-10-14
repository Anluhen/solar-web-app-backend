import {
    BadRequestException,
    ClassProvider,
    Injectable,
    InternalServerErrorException,
    NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import EnvioEntity from "../entities/envio.entity";
import EnvioFormDto from "../dtos/envio-form.dto";
import { IEnviosService } from "../interfaces/envios.service.interface";
import { StatusEnvio, StatusRulesService } from "../rules/status.rules";
import { IMateriaisService } from "../../materiais/interfaces/materiais.service.interface";
import MaterialEntity from "../../materiais/entities/material.entity";
import { IMailService } from "../../mail/interfaces/mail.service.interface";

@Injectable()
class EnviosService implements IEnviosService {
    constructor(
        @InjectRepository(EnvioEntity, "postgreConnection")
        private readonly repo: Repository<EnvioEntity>,
        private readonly materiaisService: IMateriaisService,
        private readonly statusRulesService: StatusRulesService,
        private readonly mailService: IMailService,
    ) {}

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

    async advanceStatus(id: string, dto: EnvioFormDto): Promise<EnvioEntity> {
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
        };

        const materiais = await this.materiaisService.getMateriaisByEnvio(id);

        if (
            payload.status !== current.status &&
            payload.status === StatusEnvio.SEPARACAO
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

            await this.notifyStatusChange(to, subject, htmlBody);
        }

        return this.putEnvio(id, payload);
    }

    async returnStatus(id: string, dto: EnvioFormDto): Promise<EnvioEntity> {
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

            await this.notifyStatusChange(to, subject, htmlBody);
        }

        return this.putEnvio(id, payload);
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
            ["Status atual", current.status],
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
            await this.mailService.sendMail(recipients, subject, htmlBody);
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

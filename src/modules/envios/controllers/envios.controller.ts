import {
    BadRequestException,
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Post,
    Put,
    Query,
} from "@nestjs/common";
import { ApiCreatedResponse, ApiOkResponse, ApiTags } from "@nestjs/swagger";
import MaterialEntity from "../../materiais/entities/material.entity";
import { IMateriaisService } from "../../materiais/interfaces/materiais.service.interface";
import EnvioFormDto from "../dtos/envio-form.dto";
import EnvioEntity from "../entities/envio.entity";
import { IEnviosService } from "../interfaces/envios.service.interface";
import { StatusEnvio, StatusRule } from "../rules/status.rules";
import { StatusRulesService } from "../rules/status.rules";
import { IMailService } from "../../mail/interfaces/mail.service.interface";


@Controller("envios")
@ApiTags("Envios")
export class EnviosController {
    constructor(
        private readonly enviosService: IEnviosService,
        private readonly materiaisService: IMateriaisService,
        private readonly statusRulesService: StatusRulesService,
        private readonly mailService: IMailService,
    ) { }

    @Post()
    @ApiCreatedResponse({ type: EnvioEntity })
    postEnvio(@Body() envio: EnvioFormDto): Promise<EnvioEntity> {
        return this.enviosService.postEnvio(envio);
    }

    @Get()
    @ApiOkResponse({ type: EnvioEntity, isArray: true })
    getEnvios(
        @Query("id") id?: string,
        @Query("pep") pep?: string,
        @Query("zvgp") zvgp?: string,
        @Query("gerador") gerador?: string,
        @Query("ufv") ufv?: string,
    ): Promise<EnvioEntity[]> {
        return this.enviosService.getEnvios({
            filters: { id, pep, zvgp, gerador, ufv },
        });
    }

    @Put(":id")
    @ApiOkResponse({ type: EnvioEntity })
    async putEnvio(
        @Param("id") id: string,
        @Body() envio: EnvioFormDto,
    ): Promise<EnvioEntity> {
        return this.enviosService.putEnvio(id, envio);
    }

    @Get("status")
    getStatusRule(@Query("status") status?: StatusEnvio): StatusRule {
        return this.statusRulesService.getStatus(status);
    }

    @Get(":id")
    @ApiOkResponse({ type: EnvioEntity })
    async getEnvio(@Param("id") id: string): Promise<EnvioEntity> {
        return this.enviosService.getEnvio(id);
    }

    @Delete(":id")
    @ApiOkResponse({ type: EnvioEntity })
    async deleteEnvio(@Param("id") id: string): Promise<EnvioEntity> {
        return this.enviosService.deleteEnvio(id);
    }

    @Get(":id/materiais")
    @ApiOkResponse({ type: MaterialEntity, isArray: true })
    async findMateriaisByEnvio(
        @Param("id") id: string,
    ): Promise<MaterialEntity[]> {
        return this.materiaisService.getMateriaisByEnvio(id);
    }

    @Get(":id/status")
    async getStatus(@Param("id") id: string): Promise<StatusRule> {
        const envio = await this.enviosService.getEnvio(id);
        return this.statusRulesService.getStatus(envio.status);
    }

    @Put(":id/status")
    @ApiOkResponse({ type: EnvioEntity })
    async advanceStatus(
        @Param("id") id: string,
        @Body() dto: EnvioFormDto,
    ): Promise<EnvioEntity> {
        const current = await this.enviosService.getEnvio(id);

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

        if (payload.status != current.status && payload.status === StatusEnvio.SEPARACAO) {
            const to = rule.notify;

            const escapeHtml = (value: unknown): string =>
                String(value ?? "")
                    .replace(/&/g, "&amp;")
                    .replace(/</g, "&lt;")
                    .replace(/>/g, "&gt;")
                    .replace(/"/g, "&quot;")
                    .replace(/'/g, "&#39;");

            const formatCell = (value: unknown): string => {
                if (value === null || value === undefined) return "";
                if (value instanceof Date) return value.toISOString();
                return String(value);
            };

            const tableStyle =
                "width:100%;border-collapse:collapse;font-family:Arial,Helvetica,sans-serif;";
            const headerCellStyle =
                "padding:8px;border:1px solid #d0d7de;background-color:#f4f6fa;text-align:left;";
            const cellStyle = "padding:8px;border:1px solid #d0d7de;";

            const envioDetails: Array<[string, unknown]> = [
                ["Envio ID", current.id],
                ["Status atual", current.status],
                ["Próximo status", payload.status],
                ["PEP", current.pep],
                ["ZVGP", current.zvgp],
                ["Gerador", current.gerador],
                ["UFV", current.ufv],
                ["Observações", current.observacoes ?? ""],
                ["Data de separação", current.separacao],
                ["Criado em", current.created_at],
                ["Atualizado em", current.updated_at],
            ];

            const envioRows = envioDetails
                .map(
                    ([label, value]) => `
            <tr>
                <th style="${headerCellStyle}">${escapeHtml(label)}</th>
                <td style="${cellStyle}">${escapeHtml(formatCell(value))}</td>
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
                          <td style="${cellStyle}">${escapeHtml(formatCell(material.id))}</td>
                          <td style="${cellStyle}">${escapeHtml(formatCell(material.sap))}</td>
                          <td style="${cellStyle}">${escapeHtml(formatCell(material.descricao))}</td>
                          <td style="${cellStyle}">${escapeHtml(formatCell(material.quantidade))}</td>
                      </tr>
                  `,
                        )
                        .join("")
                    : `<tr><td style="${cellStyle}" colspan="4">Nenhum material cadastrado.</td></tr>`;

            const htmlBody = `
            <div style="font-family:Arial,Helvetica,sans-serif;color:#1f2933;">
                <h2 style="margin-bottom:16px;">Atualização do envio ${escapeHtml(formatCell(current.id))}</h2>
                <table style="${tableStyle}">
                    <tbody>${envioRows}</tbody>
                </table>
                <h3 style="margin-top:24px;margin-bottom:8px;">Materiais</h3>
                <table style="${tableStyle}">
                    <thead>
                        <tr>
                            <th style="${headerCellStyle}">ID</th>
                            <th style="${headerCellStyle}">SAP</th>
                            <th style="${headerCellStyle}">Descrição</th>
                            <th style="${headerCellStyle}">Quantidade</th>
                        </tr>
                    </thead>
                    <tbody>${materiaisRows}</tbody>
                </table>
            </div>
            `;

            const subject = `${current.id} - Solicitação de Separação - ${current.ufv} - ${current.pep} `

            this.mailService.sendMail(
                to,
                subject,
                htmlBody,
            );
        } else {
            throw new BadRequestException(
                `Status ${current.status} for envio ${current.id} has no e-mail notification to be sent.`,
            );
        }

        return this.enviosService.putEnvio(id, payload);
    }
}

import {
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

@Controller("envios")
@ApiTags("Envios")
export class EnviosController {
    constructor(
        private readonly enviosService: IEnviosService,
        private readonly materiaisService: IMateriaisService,
        private readonly statusRulesService: StatusRulesService,
    ) {}

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
    @ApiOkResponse({
        schema: {
            type: "object",
            properties: {
                id: { type: "string", enum: Object.values(StatusEnvio) },
                name: { type: "string" },
                required: { type: "array", items: { type: "string" } },
                editable: { type: "array", items: { type: "string" } },
                next: {
                    type: "string",
                    nullable: true,
                    enum: Object.values(StatusEnvio),
                },
                previous: {
                    type: "string",
                    nullable: true,
                    enum: Object.values(StatusEnvio),
                },
                notify: {
                    oneOf: [
                        { type: "string" },
                        { type: "array", items: { type: "string" } },
                    ],
                    nullable: true,
                },
            },
            required: ["id", "name", "required", "editable"],
        },
    })
    async getStatus(@Param("id") id: string): Promise<StatusRule> {
        const envio = await this.enviosService.getEnvio(id);
        return this.statusRulesService.getStatus(envio.status);
    }

    @Put(":id/nextstatus")
    @ApiOkResponse({ type: EnvioEntity })
    advanceStatus(
        @Param("id") id: string,
        @Body() dto: EnvioFormDto,
    ): Promise<EnvioEntity> {
        return this.enviosService.advanceStatus(id, dto);
    }

    @Put(":id/prevstatus")
    @ApiOkResponse({ type: EnvioEntity })
    returnStatus(
        @Param("id") id: string,
        @Body() dto: EnvioFormDto,
    ): Promise<EnvioEntity> {
        return this.enviosService.returnStatus(id, dto);
    }
}

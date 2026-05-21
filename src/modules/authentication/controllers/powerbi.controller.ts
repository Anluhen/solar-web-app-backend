import { Controller, Get, Param, Query, UseGuards } from "@nestjs/common";
import { ApiTags, ApiSecurity } from "@nestjs/swagger";
import { Public } from "../guards/jwt-strategy.guard";
import { ApiKeyGuard, ApiKeyRoute } from "../guards/api-key.guard";
import { IProjetosService } from "../../projetos/interfaces/projetos.service.interface";
import { IEnviosService } from "../../envios/interfaces/envios.service.interface";

@Controller("powerbi")
@ApiTags("Power BI")
@ApiSecurity("x-api-key")
@Public()
@ApiKeyRoute()
@UseGuards(ApiKeyGuard)
export class PowerBiController {
    constructor(
        private readonly projetosSvc: IProjetosService,
        private readonly enviosSvc: IEnviosService,
    ) {}

    // ── Projetos ──────────────────────────────────────────────────────────────

    @Get("projetos")
    listProjetos(
        @Query("nome") nome?: string,
        @Query("pep_prefix") pep_prefix?: string,
        @Query("pm") pm?: string,
        @Query("analista") analista?: string,
        @Query("secao") secao?: string,
    ) {
        return this.projetosSvc.listProjetosWithStats({
            nome,
            pep_prefix,
            pm,
            analista,
            secao,
        });
    }

    @Get("projetos/:id")
    getProjeto(@Param("id") id: string) {
        return this.projetosSvc.getProjeto(id);
    }

    @Get("projetos/:id/summary")
    getSummary(@Param("id") id: string) {
        return this.projetosSvc.getSummary(id);
    }

    @Get("projetos/:id/aggregate")
    getAggregate(@Param("id") id: string) {
        return this.projetosSvc.getAggregate(id);
    }

    @Get("projetos/:id/envios")
    getEnviosByProjeto(@Param("id") id: string) {
        return this.projetosSvc.getEnviosByProjeto(id);
    }

    // ── Envios ────────────────────────────────────────────────────────────────

    @Get("envios")
    listEnvios(
        @Query("status") status?: string,
        @Query("pep") pep?: string,
        @Query("zvgp") zvgp?: string,
        @Query("gerador") gerador?: string,
        @Query("ufv") ufv?: string,
    ) {
        return this.enviosSvc.getEnvios({ filters: { status, pep, zvgp, gerador, ufv } });
    }

    @Get("envios/:id")
    getEnvio(@Param("id") id: string) {
        return this.enviosSvc.getEnvio(id);
    }
}

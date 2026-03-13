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
import { ApiTags } from "@nestjs/swagger";
import { IProjetosService } from "../interfaces/projetos.service.interface";
import ProjetoFormDto from "../dtos/projeto-form.dto";
import ProjetoPepFormDto from "../dtos/projeto-pep-form.dto";
import ProjetoItemFormDto from "../dtos/projeto-item-form.dto";
import BulkItemsDto from "../dtos/bulk-items.dto";

@Controller("projetos")
@ApiTags("Projetos")
export class ProjetosController {
    constructor(private readonly svc: IProjetosService) {}

    // ── Projeto CRUD ──────────────────────────────────────────────────────────

    @Post()
    createProjeto(@Body() dto: ProjetoFormDto) {
        return this.svc.createProjeto(dto);
    }

    @Get()
    listProjetos(
        @Query("nome") nome?: string,
        @Query("pep_prefix") pep_prefix?: string,
        @Query("pm") pm?: string,
        @Query("analista") analista?: string,
        @Query("secao") secao?: string,
    ) {
        return this.svc.listProjetosWithStats({
            nome,
            pep_prefix,
            pm,
            analista,
            secao,
        });
    }

    // Static sub-routes must come BEFORE dynamic :id routes

    @Get("pep-lookup")
    lookupPepSuffixes(@Query("prefix") prefix: string) {
        return this.svc.lookupPepSuffixes(prefix ?? "");
    }

    @Get("pep-items")
    getPepItems(@Query("pep") pep: string) {
        return this.svc.getPepItems(pep ?? "");
    }

    @Post("import-from-envios")
    importFromEnvios() {
        return this.svc.importFromEnvios();
    }

    // NOTE: specific sub-routes (:id/summary, :id/aggregate, :id/envios) are
    // declared before the generic :id route so NestJS matches them first.

    @Get(":id/summary")
    getSummary(@Param("id") id: string) {
        return this.svc.getSummary(id);
    }

    @Get(":id/aggregate")
    getAggregate(@Param("id") id: string) {
        return this.svc.getAggregate(id);
    }

    @Get(":id/envios")
    getEnviosByProjeto(@Param("id") id: string) {
        return this.svc.getEnviosByProjeto(id);
    }

    @Get(":id")
    getProjeto(@Param("id") id: string) {
        return this.svc.getProjeto(id);
    }

    @Put(":id")
    updateProjeto(@Param("id") id: string, @Body() dto: ProjetoFormDto) {
        return this.svc.updateProjeto(id, dto);
    }

    // ── PEPs ─────────────────────────────────────────────────────────────────

    @Post(":id/peps")
    addPep(@Param("id") id: string, @Body() dto: ProjetoPepFormDto) {
        return this.svc.addPep(id, dto);
    }

    @Put(":id/peps/:pepId")
    updatePep(
        @Param("id") id: string,
        @Param("pepId") pepId: string,
        @Body() dto: ProjetoPepFormDto,
    ) {
        return this.svc.updatePep(id, pepId, dto);
    }

    @Delete(":id/peps/:pepId")
    removePep(@Param("id") id: string, @Param("pepId") pepId: string) {
        return this.svc.removePep(id, pepId);
    }

    // ── Items ─────────────────────────────────────────────────────────────────

    @Post(":id/peps/:pepId/items/bulk")
    bulkReplaceItems(
        @Param("id") id: string,
        @Param("pepId") pepId: string,
        @Body() dto: BulkItemsDto,
    ) {
        return this.svc.bulkReplaceItems(id, pepId, dto);
    }

    @Put(":id/peps/:pepId/items/:itemId")
    updateItem(
        @Param("id") id: string,
        @Param("pepId") pepId: string,
        @Param("itemId") itemId: string,
        @Body() dto: ProjetoItemFormDto,
    ) {
        return this.svc.updateItem(id, pepId, itemId, dto);
    }
}

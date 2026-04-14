import { Body, Controller, Get, Param, Patch, Post, Put } from "@nestjs/common";
import { ApiCreatedResponse, ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { IKaizenService } from "../interfaces/kaizen.service.interface";
import KaizenFormDto from "../dtos/kaizen-form.dto";
import KaizenEntity from "../entities/kaizen.entity";

@Controller("kaizens")
@ApiTags("Kaizen")
export class KaizenController {
    constructor(private readonly svc: IKaizenService) {}

    @Post()
    @ApiCreatedResponse({ type: KaizenEntity })
    createKaizen(@Body() dto: KaizenFormDto): Promise<KaizenEntity> {
        return this.svc.createKaizen(dto);
    }

    @Get()
    @ApiOkResponse({ type: KaizenEntity, isArray: true })
    listKaizens(): Promise<KaizenEntity[]> {
        return this.svc.listKaizens();
    }

    @Get(":id")
    @ApiOkResponse({ type: KaizenEntity })
    getKaizen(@Param("id") id: string): Promise<KaizenEntity> {
        return this.svc.getKaizen(id);
    }

    @Put(":id")
    @ApiOkResponse({ type: KaizenEntity })
    updateKaizen(@Param("id") id: string, @Body() dto: KaizenFormDto): Promise<KaizenEntity> {
        return this.svc.updateKaizen(id, dto);
    }

    @Patch(":id/cadastrar")
    @ApiOkResponse({ type: KaizenEntity })
    cadastrarKaizen(@Param("id") id: string, @Body("id_kaizen") idKaizen: string): Promise<KaizenEntity> {
        return this.svc.cadastrarKaizen(id, idKaizen);
    }
}

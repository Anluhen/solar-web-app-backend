import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  Param,
  ParseBoolPipe,
  ParseIntPipe,
  Post,
  Put,
  Query,
} from "@nestjs/common";
import EnvioFormDto from "../dtos/envio-form.dto";
import EnvioEntity from "../entities/envio.entity";
import MaterialEntity from "../../materiais/entities/material.entity";
import { ApiCreatedResponse, ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { IEnviosService } from "../interfaces/envios.service.interface";
import { IMateriaisService } from "../../materiais/interfaces/materiais.service.interface";

@Controller('envios')
@ApiTags("Envios")
export class EnviosController {
  constructor(
    private readonly enviosService: IEnviosService,
    private readonly materiaisService: IMateriaisService,
  ) { }

  @Post()
  @ApiCreatedResponse({ type: EnvioEntity })
  postEnvio(
    @Body() envio: EnvioFormDto
  ): Promise<EnvioEntity> {
    return this.enviosService.postEnvio(envio);
  }

  @Get()
  @ApiOkResponse({ type: EnvioEntity, isArray: true })
  getEnvios(
    @Query('withMateriais', new DefaultValuePipe('false'), ParseBoolPipe) withMateriais: boolean,
    @Query('id') id?: string,
    @Query('pep') pep?: string,
    @Query('zvgp') zvgp?: string,
    @Query('gerador') gerador?: string,
  ): Promise<EnvioEntity[]> {
    return this.enviosService.getEnvios({ filters: { id, pep, zvgp, gerador }, withMateriais });
  }

  @Put(":id")
  @ApiOkResponse({ type: EnvioEntity })
  async putEnvio(
    @Param("id") id: string,
    @Body() envio: EnvioFormDto,
  ): Promise<EnvioEntity> {
    return this.enviosService.putEnvio(id, envio);
  }

  @Get(':id')
  @ApiOkResponse({ type: EnvioEntity })
  async getEnvio(
    @Param('id') id: string,
    @Query('withMateriais', new DefaultValuePipe('true'), ParseBoolPipe) withMateriais: boolean,
  ): Promise<EnvioEntity> {
    return this.enviosService.getEnvio(id);
  }

  @Delete(':id')
  @ApiOkResponse({ type: EnvioEntity })
  async deleteEnvio(
    @Param('id') id: string
  ): Promise<EnvioEntity> {
    return this.enviosService.deleteEnvio(id);
  }

  @Get(':id/materiais')
  @ApiOkResponse({ type: MaterialEntity, isArray: true })
  async findMateriaisByEnvio(@Param('id') id: string
  ): Promise<MaterialEntity[]> {
    return this.materiaisService.getMateriaisByEnvio(id);
  }
}

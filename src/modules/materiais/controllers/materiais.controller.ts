import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  Param,
  Put,
  Post,
  Query,
  ParseBoolPipe,
} from "@nestjs/common";
import { ApiCreatedResponse, ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { IMateriaisService } from "../interfaces/materiais.service.interface";
import MaterialFormDto from "../dtos/material-form.dto";
import MaterialEntity from "../entities/material.entity";

@Controller("api/materiais")
@ApiTags("Materiais")
export class MateriaisController {
  constructor(private readonly materiaisService: IMateriaisService) { }

  @Post()
  @ApiCreatedResponse({ type: MaterialEntity })
  async postMaterial(@Body() material: MaterialFormDto): Promise<MaterialEntity> {
    return this.materiaisService.postMaterial(material);
  }

  @Get()
  @ApiOkResponse({ type: MaterialEntity, isArray: true })
  async getMateriais(
    @Query("withEnvio", new DefaultValuePipe("false"), ParseBoolPipe) withEnvio: boolean,
  ): Promise<MaterialEntity[]> {
    return this.materiaisService.getMateriais({ withEnvio });
  }

  @Get(':id')
  @ApiOkResponse({ type: MaterialEntity })
  async getMaterial(
    @Param('id') id: string,
    @Query('withEnvio', new DefaultValuePipe('true'), ParseBoolPipe) withEnvio: boolean,
  ): Promise<MaterialEntity> {
    return this.materiaisService.getMaterial(id, { withEnvio });
  }

  @Put(':id')
  @ApiOkResponse({ type: MaterialEntity })
  async putMaterial(@Param('id') id: string, @Body() newMaterial: MaterialFormDto): Promise<MaterialEntity> {
    return this.materiaisService.putMaterial(id, newMaterial);
  }

  @Delete(':id')
  @ApiOkResponse({ schema: { properties: { deleted: { type: 'boolean' }, id: { type: 'string' } } } })
  async deleteMaterial(@Param('id') id: string): Promise<{ deleted: boolean; id: string }> {
    return this.materiaisService.deleteMaterial(id);
  }
}

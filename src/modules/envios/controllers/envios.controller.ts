import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  DefaultValuePipe,
  ParseBoolPipe,
} from '@nestjs/common';
import { EnviosService } from '../services/envios.service';
import { CreateEnvioDto } from '../dtos/create-envio.dto';
import { UpdateEnvioDto } from '../dtos/update-envio.dto';
import { MateriaisService } from '../../materiais/services/materiais.service';

@Controller('envios')
export class EnviosController {
  constructor(
    private readonly enviosService: EnviosService,
    private readonly materiaisService: MateriaisService,
  ) { }

  @Post()
  create(@Body() dto: CreateEnvioDto) {
    return this.enviosService.create(dto);
  }

  @Get()
  findAll(
    @Query('withMateriais', new DefaultValuePipe('false'), ParseBoolPipe) withMateriais: boolean,
    @Query('id') id?: string,
    @Query('pep') pep?: string,
    @Query('zvgp') zvgp?: string,
    @Query('gerador') gerador?: string,
  ) {
    return this.enviosService.findAll({
      withMateriais,
      filters: { id, pep, zvgp, gerador },
    });
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @Query('withMateriais', new DefaultValuePipe('true'), ParseBoolPipe) withMateriais: boolean,
  ) {
    return this.enviosService.findOne(id, { withMateriais });
  }

  @Get(':id/materiais')
  async findMateriaisByEnvio(@Param('id') id: string) {
    const list = await this.materiaisService.findByEnvio(id);
    return list.map((m: any) => ({
      id: Number(m.id),
      envio_id: Number(id),
      sap: m.sap !== undefined && m.sap !== null ? Number(m.sap) : 0,
      descricao: m.descricao,
      quantidade: Number(m.quantidade),
      created_at: m.created_at,
      updated_at: m.updated_at,
    }));
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateEnvioDto) {
    return this.enviosService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.enviosService.remove(id);
  }
}

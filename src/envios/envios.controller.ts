import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Put,
  Post,
  BadRequestException,
  NotFoundException,
  Query,
} from '@nestjs/common';
import { EnviosService } from './envios.service';
import type { UpdateEnvioDto, CreateEnvioDto } from './envios.service';

class ListEnviosQueryDto {
  id?: string;        // number-ish (kept string to validate/parse ourselves)
  pep?: string;
  zvgp?: string;
  gerador?: string;
  limit?: string;     // strings in query, convert below
  offset?: string;
  orderBy?: 'created_at' | 'updated_at' | 'id';
  orderDir?: 'asc' | 'desc';
}

@Controller('envios')
export class EnviosController {
  constructor(private readonly service: EnviosService) { }

  @Get()
  async list(@Query() q: ListEnviosQueryDto) {
    // normalize + validate
    const id = q.id ? Number(q.id) : undefined;
    if (q.id && Number.isNaN(id)) {
      throw new BadRequestException('id must be a number');
    }

    const limit = q.limit ? Math.min(Math.max(Number(q.limit), 1), 200) : 50;
    const offset = q.offset ? Math.max(Number(q.offset), 0) : 0;
    const orderBy = q.orderBy ?? 'id';
    const orderDir = (q.orderDir ?? 'asc').toLowerCase() === 'desc' ? 'desc' : 'asc';

    return this.service.list({
      id,
      pep: q.pep?.trim(),
      zvgp: q.zvgp?.trim(),
      gerador: q.gerador?.trim(),
      limit, offset, orderBy, orderDir,
    });
  }

  @Post()
  async create(@Body() dto: CreateEnvioDto) {
    return this.service.create(dto);
  }

  @Get(':id')
  async getById(@Param('id', ParseIntPipe) id: number) {
    const envio = await this.service.get(id);
    if (!envio) {
      throw new NotFoundException('Envio not found.');
    }
    return envio;
  }

  @Get(':id/materiais')
  async getMateriais(@Param('id', ParseIntPipe) id: number) {
    const materiais = await this.service.getMateriais(id);
    return materiais;
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateEnvioDto,
  ) {
    const hasAnyField =
      body.pep !== undefined ||
      body.zvgp !== undefined ||
      body.gerador !== undefined ||
      body.observacoes !== undefined ||
      body.status !== undefined;

    if (!hasAnyField) {
      throw new BadRequestException('No fields to update.');
    }

    const updated = await this.service.update(id, body);
    if (!updated) {
      throw new NotFoundException('Envio not found.');
    }
    return updated;
  }

}
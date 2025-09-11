import { Body, Controller, Delete, Param, ParseIntPipe, Put, Get, Post, NotFoundException } from '@nestjs/common';
import { MateriaisService } from './materiais.service';

class CreateMaterialDto {
  envio_id: number;
  sap: string;
  descricao: string;
  quantidade: number;
}

class UpdateMaterialDto {
  sap?: string;
  descricao?: string;
  quantidade?: number;
}

@Controller('materiais')
export class MateriaisController {
  constructor(private readonly service: MateriaisService) { }

  @Get(':id')
  async getById(@Param('id', ParseIntPipe) id: number) {
    const envio = await this.service.get(id);
    if (!envio) {
      throw new NotFoundException('Material not found.');
    }
    return envio;
  }

  @Post()
  async create(@Body() dto: CreateMaterialDto) {
    return this.service.create(dto);
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateMaterialDto
  ) {
    const row = await this.service.update(id, dto);
    if (!row) {
      throw new NotFoundException('Material not found.');
    }
    return row;
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    const ok = await this.service.remove(id);
    if (!ok) {
      throw new NotFoundException('Material not found.');
    }
    return { ok: true };
  }
}

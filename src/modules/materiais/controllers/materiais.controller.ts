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
import { MateriaisService } from '../services/materiais.service';
import { CreateMaterialDto } from '../dtos/create-material.dto';
import { UpdateMaterialDto } from '../dtos/update-material.dto';

@Controller('materiais')
export class MateriaisController {
  constructor(private readonly materiaisService: MateriaisService) { }

  @Post()
  create(@Body() dto: CreateMaterialDto) {
    return this.materiaisService.create(dto);
  }

  @Get()
  findAll(
    @Query('withEnvio', new DefaultValuePipe('false'), ParseBoolPipe) withEnvio: boolean,
  ) {
    return this.materiaisService.findAll({ withEnvio });
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @Query('withEnvio', new DefaultValuePipe('true'), ParseBoolPipe) withEnvio: boolean,
  ) {
    return this.materiaisService.findOne(id, { withEnvio });
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateMaterialDto) {
    return this.materiaisService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.materiaisService.remove(id);
  }
}
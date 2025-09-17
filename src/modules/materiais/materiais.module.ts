import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import MaterialOrmEntity from './entities/material.orm-entity';
import Envio from '../envios/entities/envio.entity';
import materiaisServiceProvider from './services/materiais.service';
import { MateriaisController } from './controllers/materiais.controller';

@Module({
  imports: [TypeOrmModule.forFeature([MaterialOrmEntity, Envio], 'postgreConnection')],
  controllers: [MateriaisController],
  providers: [materiaisServiceProvider],
  exports: [TypeOrmModule, materiaisServiceProvider],
})
export default class MateriaisModule { }

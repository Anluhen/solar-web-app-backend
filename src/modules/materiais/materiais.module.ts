import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import MaterialEntity from './entities/material.entity';
import Envio from '../envios/entities/envio.entity';
import materiaisServiceProvider from './services/materiais.service';
import { MateriaisController } from './controllers/materiais.controller';

@Module({
  imports: [TypeOrmModule.forFeature([MaterialEntity, Envio], 'postgreConnection')],
  controllers: [MateriaisController],
  providers: [materiaisServiceProvider],
  exports: [TypeOrmModule, materiaisServiceProvider],
})
export default class MateriaisModule { }

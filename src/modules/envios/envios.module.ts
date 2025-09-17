import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import Envio from './entities/envio.entity';
import MaterialOrmEntity from '../materiais/entities/material.orm-entity';
import enviosServiceProvider from './services/envios.service';
import { EnviosController } from './controllers/envios.controller';
import MateriaisModule from '../materiais/materiais.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Envio, MaterialOrmEntity], 'postgreConnection'),
    MateriaisModule,
  ],
  controllers: [EnviosController],
  providers: [enviosServiceProvider],
  exports: [TypeOrmModule, enviosServiceProvider],
})
export default class EnviosModule { }

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Material } from './entities/material.entity';
import { Envio } from '../envios/entities/envio.entity';
import { MateriaisService } from './services/materiais.service';
import { MateriaisController } from './controllers/materiais.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Material, Envio], 'postgreConnection')],
  controllers: [MateriaisController],
  providers: [MateriaisService],
  exports: [TypeOrmModule, MateriaisService],
})
export class MateriaisModule { }

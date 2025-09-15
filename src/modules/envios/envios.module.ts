import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Envio } from './entities/envio.entity';
import { Material } from '../materiais/entities/material.entity';
import { EnviosService } from './services/envios.service';
import { EnviosController } from './controllers/envios.controller';
import { MateriaisModule } from '../materiais/materiais.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Envio, Material], 'postgreConnection'),
    MateriaisModule,
  ],
  controllers: [EnviosController],
  providers: [EnviosService],
  exports: [TypeOrmModule, EnviosService],
})
export class EnviosModule { }

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  RelationId,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { IsDate, IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import Envio from '../../envios/entities/envio.entity';

@Entity('material')
export default class MaterialEntity {
  // bigint in DB -> string in TS
  @ApiProperty({ required: true, type: String, description: 'Material id (bigint as string)' })
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id!: string;

  @ApiProperty({ required: false, description: 'Envio relation (included when requested)' })
  @ManyToOne(() => Envio, (e) => e.materiais, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  @JoinColumn({ name: 'envio_id' })
  envio?: Envio | null;

  // expose FK id to match DB/API shape
  @ApiProperty({ required: false, type: String, description: 'Envio id (bigint as string)' })
  @IsOptional()
  @IsString()
  @RelationId((m: MaterialEntity) => m.envio)
  envio_id?: string | null;

  @ApiProperty({ required: true, type: String, description: 'SAP code (bigint as string)' })
  @IsString()
  @Column({ type: 'bigint' })
  sap!: string;

  @ApiProperty({ required: true })
  @IsString()
  @IsNotEmpty()
  @Column({ type: 'text' })
  descricao!: string;

  @ApiProperty({ required: true })
  @IsInt()
  @Column({ type: 'integer' })
  quantidade!: number;

  @ApiProperty({ required: true })
  @IsDate()
  @CreateDateColumn({ type: 'timestamptz', default: () => 'now()' })
  created_at!: Date;

  @ApiProperty({ required: true })
  @IsDate()
  @UpdateDateColumn({ type: 'timestamptz', default: () => 'now()' })
  updated_at!: Date;
}


import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Envio } from '../../envios/entities/envio.entity';

@Entity('materiais')
export class Material {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id!: string;

  // nullable in DB; ON DELETE CASCADE from schema
  @ManyToOne(() => Envio, (e) => e.materiais, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  @JoinColumn({ name: 'envio_id' })
  envio?: Envio | null;

  @Column({
    type: 'bigint',
  })
  sap!: string;

  @Column({ type: 'text' })
  descricao!: string;

  @Column({ type: 'integer' })
  quantidade!: number;

  @CreateDateColumn({ type: 'timestamptz', default: () => 'now()' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamptz', default: () => 'now()' })
  updated_at!: Date;
}
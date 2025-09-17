import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import Envio from '../../envios/entities/envio.entity';

@Entity('material')
export default class MaterialOrmEntity {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id!: string;

  @ManyToOne(() => Envio, (e) => e.materiais, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  @JoinColumn({ name: 'envio_id' })
  envio?: Envio | null;

  @Column({ type: 'bigint' })
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


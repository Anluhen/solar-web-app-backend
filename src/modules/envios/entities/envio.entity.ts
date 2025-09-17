import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Check,
  Index,
} from 'typeorm';
import MaterialEntity from '../../materiais/entities/material.entity';

export enum StatusEnvio {
  RASCUNHO = 'RASCUNHO',
  ENVIADO = 'ENVIADO',
  CANCELADO = 'CANCELADO',
}

@Entity('envios')
@Check(`"status" IN ('RASCUNHO','ENVIADO','CANCELADO')`)
@Index('envios_gerador_idx', ['gerador'])
@Index('envios_pep_idx', ['pep'])
@Index('envios_zvgp_idx', ['zvgp'])
export default class Envio {
  // bigint -> prefer string in TS to avoid precision loss
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id!: string;

  @Column({ type: 'text' })
  pep!: string;

  @Column({ type: 'text' })
  zvgp!: string;

  @Column({ type: 'text' })
  gerador!: string;

  @Column({ type: 'text', nullable: true })
  observacoes?: string | null;

  @Column({ type: 'text', default: StatusEnvio.RASCUNHO })
  status!: StatusEnvio;

  @CreateDateColumn({ type: 'timestamptz', default: () => 'now()' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamptz', default: () => 'now()' })
  updated_at!: Date;

  @Column({ type: 'date', default: () => 'CURRENT_DATE' })
  separacao!: string; // keep as string (YYYY-MM-DD) or use Date if you prefer

  @OneToMany(() => MaterialEntity, (m) => m.envio)
  materiais?: MaterialEntity[];
}

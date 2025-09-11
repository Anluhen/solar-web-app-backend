import { Injectable, BadRequestException, InternalServerErrorException, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import type { DataSource } from 'typeorm';

export type Envio = {
  id: number;
  pep: string;
  zvgp: string;
  gerador: string;
  separacao: string;
  observacoes: string | null;
  status: 'RASCUNHO' | 'ENVIADO' | 'CANCELADO';
  created_at: string;
  updated_at: string;
};

export type Material = {
  id: number;
  envio_id: number;
  sap: number;
  descricao: string;
  quantidade: number;
  created_at: string;
  updated_at: string;
};

export type UpdateEnvioDto = {
  pep?: string;
  zvgp?: string;
  gerador?: string;
  separacao?: string;
  observacoes?: string | null;
  status?: 'RASCUNHO' | 'ENVIADO' | 'CANCELADO';
};

export type CreateEnvioDto = {
  pep: string;
  zvgp: string;
  gerador: string;
  separacao: string;
  observacoes: string | null;
  status: 'RASCUNHO';
};

type ListFilters = {
  id?: number;
  pep?: string;
  zvgp?: string;
  gerador?: string;
  limit: number;
  offset: number;
  orderBy: 'created_at' | 'updated_at' | 'id';
  orderDir: 'asc' | 'desc';
};


@Injectable()
export class EnviosService {
  private readonly logger = new Logger(EnviosService.name);
  constructor(@InjectDataSource('postgreConnection') private readonly dataSource: DataSource) { }

  async list(filters: ListFilters) {
    try {
      const where: string[] = [];
      const params: any[] = [];

      if (filters.id !== undefined) {
        params.push(filters.id);
        where.push(`e.id = $${params.length}`);
      }
      if (filters.pep) {
        params.push(`%${filters.pep}%`);                 // prefix match (index-friendly)
        where.push(`e.pep ILIKE $${params.length}`);
      }
      if (filters.zvgp) {
        params.push(`%${filters.zvgp}%`);
        where.push(`e.zvgp ILIKE $${params.length}`);
      }
      if (filters.gerador) {
        params.push(`%${filters.gerador}%`);
        where.push(`e.gerador ILIKE $${params.length}`);
      }

      const orderBy = ['created_at', 'updated_at', 'id'].includes(filters.orderBy) ? filters.orderBy : 'id';
      const orderDir = filters.orderDir === 'asc' ? 'asc' : 'desc';

      params.push(filters.limit);
      const limitIdx = params.length;
      params.push(filters.offset);
      const offsetIdx = params.length;

      const sql = `
        SELECT
          e.id, e.pep, e.zvgp, e.gerador, e.observacoes, e.status,
          to_char(e.separacao, 'DD/MM/YYYY') as separacao,
          to_char(e.created_at, 'DD/MM/YYYY" "HH24"h":MI"m":SS"s"') AS created_at,
          to_char(e.updated_at, 'DD/MM/YYYY" "HH24"h":MI"m":SS"s"') AS updated_at
        FROM envios e
        ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
        ORDER BY e.${orderBy} ${orderDir}
        LIMIT $${limitIdx} OFFSET $${offsetIdx}
      `;

      const rows = await this.dataSource.query(sql, params);
      return rows;
    } catch (err) {
      this.logger.error('list error:', err);
      throw new InternalServerErrorException('Failed to list envios.');
    }
  }

  async create(dto: CreateEnvioDto) {
    try {
      const rows = await this.dataSource.query(
        `INSERT INTO envios(pep, zvgp, gerador, separacao, observacoes, created_at, updated_at)
      VALUES($1, $2, $3, $4, $5, NOW(), NOW())
      RETURNING id, pep, zvgp, gerador, observacoes, status,
      to_char(separacao, 'DD/MM/YYYY') as separacao,
      to_char(created_at, 'DD/MM/YYYY" "HH24"h":MI"m":SS"s"') as created_at,
      to_char(updated_at, 'DD/MM/YYYY" "HH24"h":MI"m":SS"s"') as updated_at
    `,
        [dto.pep, dto.zvgp, dto.gerador, dto.separacao, dto.observacoes]
      );

      return rows[0];
    } catch (err) {
      this.logger.error('create error:', err);
      throw new InternalServerErrorException('Failed to create envio.');
    }
  }

  async get(id: number): Promise<Envio | null> {
    try {
      const rows = await this.dataSource.query(
        `SELECT id, pep, zvgp, gerador, observacoes,  status,
             to_char(separacao, 'DD/MM/YYYY') as separacao,
             to_char(created_at, 'DD/MM/YYYY" "HH24"h":MI"m":SS"s"') as created_at,
             to_char(updated_at, 'DD/MM/YYYY" "HH24"h":MI"m":SS"s"') as updated_at
      FROM envios
      WHERE id = $1`,
        [id],
      );
      return rows[0] ?? null;
    } catch (err) {
      this.logger.error('get error:', err);
      throw new InternalServerErrorException('Failed to fetch envio.');
    }
  }

  async getMateriais(envio_id: number): Promise<Material[] | null> {
    try {
      const rows = await this.dataSource.query(
        `SELECT id, envio_id, sap, descricao, quantidade,
             to_char(created_at, 'DD/MM/YYYY" "HH24"h":MI"m":SS"s"') as created_at,
             to_char(updated_at, 'DD/MM/YYYY" "HH24"h":MI"m":SS"s"') as updated_at
      FROM materiais
      WHERE envio_id = $1
      ORDER BY id`,
        [envio_id],
      );
      return rows as Material[];
    } catch (err) {
      this.logger.error('getMateriais error:', err);
      throw new InternalServerErrorException('Failed to fetch materiais for envio.');
    }
  }

  async update(id: number, dto: UpdateEnvioDto): Promise<Envio | null> {
    try {
      const allowedKeys: (keyof UpdateEnvioDto)[] = [
        'pep',
        'zvgp',
        'gerador',
        'separacao',
        'observacoes',
        'status',
      ];

      const setClauses: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      for (const key of allowedKeys) {
        if (Object.prototype.hasOwnProperty.call(dto, key)) {
          setClauses.push(`${key} = $${paramIndex++}`);
          values.push((dto as any)[key]);
        }
      }

      if (setClauses.length === 0) {
        throw new BadRequestException('No valid fields provided for update.');
      }

      setClauses.push(`updated_at = NOW()`);

      values.push(id);

      const sql = `
      UPDATE envios
      SET ${setClauses.join(', ')}
      WHERE id = $${values.length}
      RETURNING id, pep, zvgp, gerador, observacoes, status,
        to_char(separacao, 'DD/MM/YYYY') as separacao,
        to_char(created_at, 'DD/MM/YYYY" "HH24"h":MI"m":SS"s"') as created_at,
        to_char(updated_at, 'DD/MM/YYYY" "HH24"h":MI"m":SS"s"') as updated_at
    `;

      const rows = await this.dataSource.query(sql, values);
      return rows[0] ?? null;
    } catch (err) {
      this.logger.error('update error:', err);
      throw new InternalServerErrorException('Failed to update envio.');
    }
  }
}
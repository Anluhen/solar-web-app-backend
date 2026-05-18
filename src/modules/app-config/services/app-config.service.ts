import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import AppConfig from "../entities/app-config.entity";

@Injectable()
export class AppConfigService {
    constructor(
        @InjectRepository(AppConfig, "postgreConnection")
        private readonly repo: Repository<AppConfig>,
    ) {}

    async get(key: string): Promise<string | null> {
        const row = await this.repo.findOne({ where: { key } });
        return row?.value ?? null;
    }

    async set(key: string, value: string): Promise<void> {
        await this.repo.save({ key, value });
    }
}

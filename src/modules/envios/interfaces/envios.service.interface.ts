import { Injectable } from "@nestjs/common";
import EnvioEntity from "../entities/envio.entity";
import EnvioFormDto from "../dtos/envio-form.dto";

@Injectable()
export abstract class IEnviosService {
    abstract postEnvio(dto: EnvioFormDto): Promise<EnvioEntity>;
    abstract getEnvios(opts?: {
        filters?: { id?: string; pep?: string; zvgp?: string; gerador?: string };
    }): Promise<EnvioEntity[]>;
    abstract getEnvio(id: string): Promise<EnvioEntity>;
    abstract putEnvio(id: string, dto: EnvioFormDto): Promise<EnvioEntity>;
    abstract deleteEnvio(id: string): Promise<EnvioEntity>;
}

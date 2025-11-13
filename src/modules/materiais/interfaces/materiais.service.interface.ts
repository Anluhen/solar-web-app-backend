import { Injectable } from "@nestjs/common";
import MaterialEntity from "../entities/material.entity";
import MaterialFormDto from "../dtos/material-form.dto";

@Injectable()
export abstract class IMateriaisService {
    abstract postMaterial(material: MaterialFormDto): Promise<MaterialEntity>;
    abstract getMateriais(): Promise<MaterialEntity[]>;
    abstract getMateriaisByEnvio(envioId: string): Promise<MaterialEntity[]>;
    abstract getMaterial(
        id: string,
        opts?: { withEnvio?: boolean },
    ): Promise<MaterialEntity>;
    abstract putMaterial(
        id: string,
        newMaterial: MaterialFormDto,
    ): Promise<MaterialEntity>;
    abstract deleteMaterial(
        id: string,
    ): Promise<{ deleted: boolean; id: string }>;
}

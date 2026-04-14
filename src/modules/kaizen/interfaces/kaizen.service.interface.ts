import { Injectable } from "@nestjs/common";
import KaizenEntity from "../entities/kaizen.entity";
import KaizenFormDto from "../dtos/kaizen-form.dto";

@Injectable()
export abstract class IKaizenService {
    abstract createKaizen(dto: KaizenFormDto): Promise<KaizenEntity>;
    abstract listKaizens(): Promise<KaizenEntity[]>;
    abstract getKaizen(id: string): Promise<KaizenEntity>;
    abstract updateKaizen(id: string, dto: KaizenFormDto): Promise<KaizenEntity>;
    abstract cadastrarKaizen(id: string, idKaizen: string): Promise<KaizenEntity>;
}

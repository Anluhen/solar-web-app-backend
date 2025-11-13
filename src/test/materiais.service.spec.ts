import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import materiaisServiceProvider from "../modules/materiais/services/materiais.service";
import { IMateriaisService } from "../modules/materiais/interfaces/materiais.service.interface";
import MaterialEntity from "../modules/materiais/entities/material.entity";
import MaterialFormDto from "../modules/materiais/dtos/material-form.dto";
import EnvioEntity from "../modules/envios/entities/envio.entity";
import { StatusEnvio } from "../modules/envios/rules/status.rules";

const baseEnvio: EnvioEntity = {
    id: "1",
    pep: "pep-001",
    zvgp: "zvgp-001",
    gerador: "gerador-001",
    ufv: "UFV Base",
    observacoes: "Initial notes",
    status: StatusEnvio.RASCUNHO,
    created_at: new Date("2024-01-01T00:00:00.000Z"),
    updated_at: new Date("2024-01-01T00:00:00.000Z"),
    separacao: "2024-01-03",
};

const otherEnvio: EnvioEntity = {
    id: "2",
    pep: "pep-002",
    zvgp: "zvgp-002",
    gerador: "gerador-002",
    ufv: "UFV Alternativa",
    observacoes: null,
    status: StatusEnvio.ENVIADO,
    created_at: new Date("2024-01-02T00:00:00.000Z"),
    updated_at: new Date("2024-01-02T00:00:00.000Z"),
    separacao: "2024-01-04",
};

const baseMaterial: MaterialEntity = {
    id: "10",
    envio: baseEnvio,
    envio_id: baseEnvio.id,
    sap: "9001",
    descricao: "Painel Solar",
    quantidade: 5,
    created_at: new Date("2024-01-01T00:00:00.000Z"),
    updated_at: new Date("2024-01-01T00:00:00.000Z"),
};

type MaterialRepoMock = Partial<
    Record<keyof Repository<MaterialEntity>, jest.Mock>
> & {
    create: jest.Mock;
    save: jest.Mock;
    find: jest.Mock;
    findOne: jest.Mock;
    remove: jest.Mock;
};

type EnviosRepoMock = Partial<
    Record<keyof Repository<EnvioEntity>, jest.Mock>
> & {
    findOne: jest.Mock;
};

describe("Materiais Service", () => {
    let app: INestApplication;
    let materiaisService: IMateriaisService;
    let materialRepo: MaterialRepoMock;
    let envioRepo: EnviosRepoMock;

    beforeAll(async () => {
        materialRepo = {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
            remove: jest.fn(),
        } as MaterialRepoMock;

        envioRepo = {
            findOne: jest.fn(),
        } as EnviosRepoMock;

        const moduleRef = await Test.createTestingModule({
            providers: [
                materiaisServiceProvider,
                {
                    provide: getRepositoryToken(
                        MaterialEntity,
                        "postgreConnection",
                    ),
                    useValue: materialRepo,
                },
                {
                    provide: getRepositoryToken(
                        EnvioEntity,
                        "postgreConnection",
                    ),
                    useValue: envioRepo,
                },
            ],
        }).compile();

        materiaisService = moduleRef.get<IMateriaisService>(IMateriaisService);

        app = moduleRef.createNestApplication();
        await app.init();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    afterAll(async () => {
        await app.close();
    });

    it("Insert Material", async () => {
        const dto: MaterialFormDto = {
            envio_id: baseEnvio.id,
            sap: baseMaterial.sap,
            descricao: baseMaterial.descricao,
            quantidade: baseMaterial.quantidade,
        };

        const created = {
            ...baseMaterial,
            id: undefined,
        } as unknown as MaterialEntity;
        materialRepo.create.mockReturnValue(created);
        envioRepo.findOne.mockResolvedValue(baseEnvio);
        materialRepo.save.mockImplementation(
            async (entity: MaterialEntity) => ({
                ...entity,
                id: baseMaterial.id,
                created_at: baseMaterial.created_at,
                updated_at: baseMaterial.updated_at,
            }),
        );

        const response = await materiaisService.postMaterial(dto);

        expect(materialRepo.create).toHaveBeenCalledWith({
            descricao: dto.descricao,
            quantidade: dto.quantidade,
        });
        expect(envioRepo.findOne).toHaveBeenCalledWith({
            where: { id: dto.envio_id },
        });
        expect(materialRepo.save).toHaveBeenCalledWith(
            expect.objectContaining({
                descricao: dto.descricao,
                quantidade: dto.quantidade,
                envio: baseEnvio,
                sap: dto.sap,
            }),
        );
        expect(response).toEqual({
            ...created,
            id: baseMaterial.id,
            envio: baseEnvio,
            sap: dto.sap,
            descricao: dto.descricao,
            quantidade: dto.quantidade,
            created_at: baseMaterial.created_at,
            updated_at: baseMaterial.updated_at,
        });
    });

    it("Get Materiais", async () => {
        materialRepo.find.mockResolvedValue([baseMaterial]);

        const response = await materiaisService.getMateriais();

        expect(materialRepo.find).toHaveBeenCalledWith({
            order: { id: "DESC" },
        });
        expect(response).toEqual([baseMaterial]);
    });

    it("Get Materiais By Envio", async () => {
        materialRepo.find.mockResolvedValue([baseMaterial]);

        const response = await materiaisService.getMateriaisByEnvio(
            baseEnvio.id,
        );

        expect(materialRepo.find).toHaveBeenCalledWith({
            where: { envio: { id: baseEnvio.id } as any },
            order: { id: "DESC" },
        });
        expect(response).toEqual([baseMaterial]);
    });

    it("Get Material", async () => {
        materialRepo.findOne.mockResolvedValue(baseMaterial);

        const response = await materiaisService.getMaterial(baseMaterial.id, {
            withEnvio: true,
        });

        expect(materialRepo.findOne).toHaveBeenCalledWith({
            where: { id: baseMaterial.id },
            relations: { envio: true },
        });
        expect(response).toEqual(baseMaterial);
    });

    it("Update Material", async () => {
        const existing = { ...baseMaterial, envio: baseEnvio };
        materialRepo.findOne.mockResolvedValue(existing);

        const dto: MaterialFormDto = {
            envio_id: otherEnvio.id,
            descricao: "Novo Material",
            quantidade: 12,
            sap: "9002",
        };

        envioRepo.findOne.mockResolvedValue(otherEnvio);
        materialRepo.save.mockImplementation(
            async (entity: MaterialEntity) => ({
                ...entity,
                updated_at: otherEnvio.updated_at,
            }),
        );

        const response = await materiaisService.putMaterial(existing.id, dto);

        expect(envioRepo.findOne).toHaveBeenCalledWith({
            where: { id: dto.envio_id },
        });
        expect(materialRepo.save).toHaveBeenCalledWith(
            expect.objectContaining({
                descricao: dto.descricao,
                quantidade: dto.quantidade,
                envio: otherEnvio,
                sap: dto.sap,
            }),
        );
        expect(response).toEqual({
            ...existing,
            descricao: dto.descricao,
            quantidade: dto.quantidade,
            envio: otherEnvio,
            sap: dto.sap!,
            updated_at: otherEnvio.updated_at,
        });
    });

    it("Delete Material", async () => {
        materialRepo.findOne.mockResolvedValue(baseMaterial);
        materialRepo.remove.mockResolvedValue(baseMaterial);

        const response = await materiaisService.deleteMaterial(baseMaterial.id);

        expect(materialRepo.findOne).toHaveBeenCalledWith({
            where: { id: baseMaterial.id },
        });
        expect(materialRepo.remove).toHaveBeenCalledWith(baseMaterial);
        expect(response).toEqual({ deleted: true, id: baseMaterial.id });
    });
});

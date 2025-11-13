import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import enviosServiceProvider from "../modules/envios/services/envios.service";
import { IEnviosService } from "../modules/envios/interfaces/envios.service.interface";
import EnvioEntity from "../modules/envios/entities/envio.entity";
import {
  StatusEnvio,
  StatusRulesService,
} from "../modules/envios/rules/status.rules";
import EnvioFormDto from "../modules/envios/dtos/envio-form.dto";
import { IMateriaisService } from "../modules/materiais/interfaces/materiais.service.interface";
import { IMailService } from "../modules/mail/interfaces/mail.service.interface";

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

type EnviosRepoMock = Partial<
  Record<keyof Repository<EnvioEntity>, jest.Mock>
> & {
  create: jest.Mock;
  save: jest.Mock;
  createQueryBuilder: jest.Mock;
  findOne: jest.Mock;
  preload: jest.Mock;
  remove: jest.Mock;
};

describe("Envios Service", () => {
  let app: INestApplication;
  let enviosService: IEnviosService;
  let envioRepo: EnviosRepoMock;

  const buildQueryBuilder = () => {
    const queryBuilder = {
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn(),
    };
    envioRepo.createQueryBuilder.mockReturnValue(queryBuilder);
    return queryBuilder;
  };

  beforeAll(async () => {
    envioRepo = {
      create: jest.fn(),
      save: jest.fn(),
      createQueryBuilder: jest.fn(),
      findOne: jest.fn(),
      preload: jest.fn(),
      remove: jest.fn(),
    } as EnviosRepoMock;

    const materiaisServiceMock = {
      getMateriaisByEnvio: jest.fn().mockResolvedValue([]),
    };

    const mailServiceMock = {
      sendMail: jest.fn(),
    };

    const configServiceMock = {
      getOrThrow: jest.fn().mockReturnValue("development"),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        enviosServiceProvider,
        {
          provide: getRepositoryToken(
            EnvioEntity,
            "postgreConnection",
          ),
          useValue: envioRepo,
        },
        {
          provide: IMateriaisService,
          useValue: materiaisServiceMock,
        },
        {
          provide: StatusRulesService,
          useValue: new StatusRulesService(configServiceMock as any),
        },
        {
          provide: IMailService,
          useValue: mailServiceMock,
        },
      ],
    }).compile();

    enviosService = moduleRef.get<IEnviosService>(IEnviosService);

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await app.close();
  });

  it("Insert Envio", async () => {
    const dto: EnvioFormDto = {
      pep: baseEnvio.pep,
      zvgp: baseEnvio.zvgp,
      gerador: baseEnvio.gerador,
      ufv: "UFV Nova",
      observacoes: baseEnvio.observacoes ?? undefined,
      status: StatusEnvio.ENVIADO,
      separacao: baseEnvio.separacao,
    };

    const savedEnvio = {
      ...baseEnvio,
      status: StatusEnvio.ENVIADO,
      ufv: dto.ufv,
    };
    envioRepo.create.mockReturnValue(savedEnvio);
    envioRepo.save.mockResolvedValue(savedEnvio);

    const response = await enviosService.postEnvio(dto);

    expect(envioRepo.create).toHaveBeenCalledWith({ ...dto });
    expect(envioRepo.save).toHaveBeenCalledWith(savedEnvio);
    expect(response).toEqual(savedEnvio);
  });

  it("Get Envios", async () => {
    const queryBuilder = buildQueryBuilder();
    queryBuilder.getMany.mockResolvedValue([baseEnvio]);

    const response = await enviosService.getEnvios();

    expect(envioRepo.createQueryBuilder).toHaveBeenCalledWith("envio");
    expect(queryBuilder.orderBy).toHaveBeenCalledWith("envio.id", "ASC");
    expect(response).toEqual([baseEnvio]);
  });

  it("Get Envios applies filters", async () => {
    const queryBuilder = buildQueryBuilder();
    queryBuilder.getMany.mockResolvedValue([baseEnvio]);

    const filters = {
      id: baseEnvio.id,
      pep: baseEnvio.pep,
      zvgp: baseEnvio.zvgp,
      gerador: baseEnvio.gerador,
      ufv: baseEnvio.ufv,
    };

    await enviosService.getEnvios({ filters });

    expect(queryBuilder.andWhere).toHaveBeenCalledWith("envio.id = :id", {
      id: filters.id,
    });
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      "envio.pep ILIKE :pep",
      { pep: `%${filters.pep}%` },
    );
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      "envio.zvgp ILIKE :zvgp",
      { zvgp: `%${filters.zvgp}%` },
    );
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      "envio.gerador ILIKE :gerador",
      { gerador: `%${filters.gerador}%` },
    );
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      "envio.ufv ILIKE :ufv",
      { ufv: `%${filters.ufv}%` },
    );
  });

  it("Get Envio", async () => {
    envioRepo.findOne.mockResolvedValue(baseEnvio);

    const response = await enviosService.getEnvio(baseEnvio.id);

    expect(envioRepo.findOne).toHaveBeenCalledWith({
      where: { id: baseEnvio.id },
    });
    expect(response).toEqual(baseEnvio);
  });

  it("Update Envio", async () => {
    const dto: EnvioFormDto = {
      pep: "pep-002",
      zvgp: baseEnvio.zvgp,
      gerador: baseEnvio.gerador,
      ufv: baseEnvio.ufv,
      status: StatusEnvio.CANCELADO,
    };

    const preloaded = { ...baseEnvio, ...dto };
    envioRepo.preload.mockResolvedValue(preloaded);
    envioRepo.save.mockResolvedValue(preloaded);

    const response = await enviosService.putEnvio(baseEnvio.id, dto);

    expect(envioRepo.preload).toHaveBeenCalledWith({
      id: baseEnvio.id,
      ...dto,
    });
    expect(envioRepo.save).toHaveBeenCalledWith(preloaded);
    expect(response).toEqual(preloaded);
  });

  it("Delete Envio", async () => {
    envioRepo.findOne.mockResolvedValue(baseEnvio);
    envioRepo.remove.mockResolvedValue(baseEnvio);

    const response = await enviosService.deleteEnvio(baseEnvio.id);

    expect(envioRepo.findOne).toHaveBeenCalledWith({
      where: { id: baseEnvio.id },
    });
    expect(envioRepo.remove).toHaveBeenCalledWith(baseEnvio);
    expect(response).toEqual(baseEnvio);
  });
});

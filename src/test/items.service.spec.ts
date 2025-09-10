import { Test } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import * as request from "supertest";
import ItemsModule from "../modules/items/items.module";
import { IItemsService } from "../modules/items/interfaces/items.service.interface";
import ItemFormDto from "../modules/items/dtos/item-form.dto";
import ItemEntity from "src/modules/items/entities/item.entity";

const baseItem: ItemEntity = {
    description: "Updated Desc",
    id: 1,
};

const updatedItem: ItemEntity = {
    description: "Updated Desc",
    id: 1,
};

describe("Items Service", () => {
    let app: INestApplication;
    let itemsService: IItemsService;

    beforeAll(async () => {
        const moduleRef = await Test.createTestingModule({
            imports: [ItemsModule],
       }).compile();

        itemsService = moduleRef.get<IItemsService>(IItemsService);

        app = moduleRef.createNestApplication();
        await app.init();
    });

    it("Insert Item", async () => {
        const item: ItemFormDto = {
            description: baseItem.description,
        };

        const response = await itemsService.postItem(item);

        expect(response).toEqual(baseItem);
    });

    it("Get Item", async () => {
        const response = await itemsService.getItem(1);

        expect(response).toEqual(baseItem);
    });

    it("Update Item", async () => {
        const item: ItemFormDto = {
            description: updatedItem.description,
        };

        const response = await itemsService.putItem(1, item);

        expect(response).toEqual(updatedItem);
    });

    it("Delete Item", async () => {
        const response = await itemsService.deleteItem(1);

        expect(response).toEqual(updatedItem);
    });
});

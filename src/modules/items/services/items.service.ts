import { ClassProvider, Injectable, NotFoundException } from "@nestjs/common";
import ItemEntity from "../entities/item.entity";
import ItemFormDto from "../dtos/item-form.dto";
import { IItemsService } from "../interfaces/items.service.interface";


@Injectable()
class ItemsService implements IItemsService {
    private items: Map<number, ItemEntity> = new Map();
    private index: number = 1;

    async postItem(item: ItemFormDto): Promise<ItemEntity> {
        const newItem: ItemEntity = {
            id: this.index,
            description: item.description,
        };

        this.items.set(this.index, newItem);
        this.index += 1;

        return newItem;
    }

    async getItem(id: number): Promise<ItemEntity> {
        const item = this.items.get(id);

        if (!item) throw new NotFoundException();

        return item;
    }

    async deleteItem(id: number): Promise<ItemEntity> {
        const item = await this.getItem(id);

        this.items.delete(id);

        return item;
    }

    async putItem(id: number, newItem: ItemFormDto): Promise<ItemEntity> {
        const item = await this.getItem(id);

        item.description = newItem.description;

        this.items.set(id, item);

        return item;
    }
}

const itemsServiceProvider: ClassProvider<IItemsService> = {
    provide: IItemsService,
    useClass: ItemsService,
};

export default itemsServiceProvider;

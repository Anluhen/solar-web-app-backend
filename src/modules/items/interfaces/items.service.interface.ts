import { Injectable } from "@nestjs/common";
import ItemEntity from "../entities/item.entity";
import ItemFormDto from "../dtos/item-form.dto";

@Injectable()
export abstract class IItemsService {
    abstract postItem(item: ItemFormDto): Promise<ItemEntity>;
    abstract getItem(id: number): Promise<ItemEntity>;
    abstract deleteItem(id: number): Promise<ItemEntity>;
    abstract putItem(id: number, newItem: ItemFormDto): Promise<ItemEntity>;
}

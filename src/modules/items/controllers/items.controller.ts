import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    ParseIntPipe,
    Post,
    Put,
} from "@nestjs/common";
import ItemFormDto from "../dtos/item-form.dto";
import ItemEntity from "../entities/item.entity";
import { ApiCreatedResponse, ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { IItemsService } from "../interfaces/items.service.interface";

@Controller("api/items")
@ApiTags("Items")
export class ItemsController {
    constructor(private readonly itemsService: IItemsService) { }

    @Post()
    @ApiCreatedResponse({ type: ItemEntity })
    async postItem(@Body() item: ItemFormDto): Promise<ItemEntity> {
        return this.itemsService.postItem(item);
    }

    @Put(":id")
    @ApiOkResponse({ type: ItemEntity })
    async putItem(
        @Param("id", ParseIntPipe) id: number,
        @Body() item: ItemFormDto,
    ): Promise<ItemEntity> {
        return this.itemsService.putItem(id, item);
    }
    @Get(":id")
    @ApiOkResponse({ type: ItemEntity })
    async getItem(@Param("id", ParseIntPipe) id: number): Promise<ItemEntity> {
        return this.itemsService.getItem(id);
    }
    @Delete(":id")
    @ApiOkResponse({ type: ItemEntity })
    async deleteItem(@Param("id", ParseIntPipe) id: number): Promise<ItemEntity> {
        return this.itemsService.deleteItem(id);
    }
}

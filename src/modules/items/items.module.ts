import { Module } from "@nestjs/common";
import { ItemsController } from "./controllers/items.controller";
import itemsServiceProvider from "./services/items.service";

@Module({
    controllers: [ItemsController],
    providers: [itemsServiceProvider],
})
export default class ItemsModule { }

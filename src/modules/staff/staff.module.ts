import { Module } from "@nestjs/common";
import { StaffController } from "./controllers/staff.controller";
import staffServiceProvider from "./services/staff.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import StaffEntity from "./entities/staff.entity";

@Module({
    imports: [TypeOrmModule.forFeature([StaffEntity], "postgreConnection")],
    controllers: [StaffController],
    providers: [staffServiceProvider],
})
export default class StaffModule {}

import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    ParseIntPipe,
    Post,
    Put,
    UseGuards,
} from "@nestjs/common";
import StaffFormDto from "../dtos/staff-form.dto";
import StaffEntity from "../entities/staff.entity";
import { ApiCreatedResponse, ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { IStaffService } from "../interfaces/staff.service.interface";
@Controller("api/postgres/staff")
@ApiTags("PostgreSql")
export class StaffController {
    constructor(private readonly staffsService: IStaffService) {}

    @Post()
    @ApiCreatedResponse({ type: StaffEntity })
    async postItem(@Body() staff: StaffFormDto): Promise<StaffEntity> {
        return this.staffsService.postStaff(staff);
    }

    @Put(":id")
    @ApiOkResponse({ type: StaffEntity })
    async putItem(
        @Param("id", ParseIntPipe) id: number,
        @Body() staff: StaffFormDto,
    ): Promise<StaffEntity> {
        return this.staffsService.putStaff(id, staff);
    }
    @Get(":id")
    @ApiOkResponse({ type: StaffEntity })
    async getItem(@Param("id", ParseIntPipe) id: number): Promise<StaffEntity> {
        return this.staffsService.getStaff(id);
    }
    @Delete(":id")
    @ApiOkResponse({ type: StaffEntity })
    async deleteItem(
        @Param("id", ParseIntPipe) id: number,
    ): Promise<StaffEntity> {
        return this.staffsService.deleteStaff(id);
    }
}

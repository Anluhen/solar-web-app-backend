import { Injectable } from "@nestjs/common";
import StaffEntity from "../entities/staff.entity";
import StaffFormDto from "../dtos/staff-form.dto";

@Injectable()
export abstract class IStaffService {
    abstract postStaff(Staff: StaffFormDto): Promise<StaffEntity>;
    abstract getStaff(id: number): Promise<StaffEntity>;
    abstract deleteStaff(id: number): Promise<StaffEntity>;
    abstract putStaff(id: number, newStaff: StaffFormDto): Promise<StaffEntity>;
}

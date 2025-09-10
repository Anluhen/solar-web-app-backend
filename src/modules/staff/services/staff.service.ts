import { ClassProvider, Injectable, NotFoundException } from "@nestjs/common";
import StaffEntity from "../entities/staff.entity";
import StaffFormDto from "../dtos/staff-form.dto";
import { IStaffService } from "../interfaces/staff.service.interface";
import { Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";

@Injectable()
class StaffService implements IStaffService {
    constructor(
        @InjectRepository(StaffEntity, "postgreConnection")
        private readonly staffRepository: Repository<StaffEntity>,
    ) { }

    async postStaff(staff: StaffFormDto): Promise<StaffEntity> {
        const newstaff = await this.staffRepository.insert({
            name: staff.name,
            description: staff.description,
        });

        return {
            id: newstaff.identifiers[0].id,
            name: staff.name,
            description: staff.description,
        };
    }

    async getStaff(id: number): Promise<StaffEntity> {
       
        const staff = await this.staffRepository.findOneBy({
            id: id,
        });

        if (!staff) throw new NotFoundException();

        return staff;
    }

    async deleteStaff(id: number): Promise<StaffEntity> {
       
        const staff = await this.getStaff(id);

        await this.staffRepository.delete({
            id: id,
        });

        return staff;
       
    }

    async putStaff(id: number, newstaff: StaffFormDto): Promise<StaffEntity> {
        await this.getStaff(id);

        await this.staffRepository.update(
            {
                id,
            },
            {   name: newstaff.name,
                description: newstaff.description,
            },
        );

        return {
            id,
            name: newstaff.name,
            description: newstaff.description,
        };
       
    }
}

const staffServiceProvider: ClassProvider<IStaffService> = {
    provide: IStaffService,
    useClass: StaffService,
};

export default staffServiceProvider;

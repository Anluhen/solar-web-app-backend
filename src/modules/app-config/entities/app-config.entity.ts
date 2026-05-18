import { Entity, PrimaryColumn, Column } from "typeorm";

@Entity("app_config")
export default class AppConfig {
    @PrimaryColumn({ type: "text" })
    key!: string;

    @Column({ type: "text" })
    value!: string;
}

import { Entity, PrimaryGeneratedColumn, Column, Unique } from "typeorm";

@Entity("produto_options")
@Unique(["secao", "label"])
export default class ProdutoOption {
    @PrimaryGeneratedColumn({ type: "bigint" })
    id!: string;

    @Column({ type: "text" })
    secao!: string;

    @Column({ type: "text" })
    label!: string;
}

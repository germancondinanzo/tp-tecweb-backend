import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Banda } from '../../bandas/entities/banda.entity';

@Entity()
export class Genero {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  nombre: string;

  @OneToMany(() => Banda, (banda) => banda.genero)
  bandas: Banda[];
}
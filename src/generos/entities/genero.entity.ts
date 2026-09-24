import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Genero {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  nombre: string;
}
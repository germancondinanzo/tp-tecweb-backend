import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Genero } from '../../generos/entities/genero.entity';

@Entity()
export class Banda {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nombre: string;

  @Column()
  pais: string;

  @Column({ name: 'anio_formacion' })
  anioFormacion: number;

  @Column({ name: 'genero_id' })
  generoId: number;

  @ManyToOne(() => Genero, (genero) => genero.bandas)
  @JoinColumn({ name: 'genero_id' })
  genero: Genero;
}
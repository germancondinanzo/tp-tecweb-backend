import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Genero } from './entities/genero.entity';
import { CreateGeneroDto } from './dto/create-genero.dto';
import { UpdateGeneroDto } from './dto/update-genero.dto';

@Injectable()
export class GenerosService {
  constructor(
    @InjectRepository(Genero)
    private readonly generosRepository: Repository<Genero>,
  ) {}

  async create(dto: CreateGeneroDto): Promise<Genero> {
    const existente = await this.generosRepository.findOne({
      where: { nombre: dto.nombre },
    });
    if (existente) {
      throw new ConflictException(
        `Ya existe un género con el nombre "${dto.nombre}"`,
      );
    }
    const genero = this.generosRepository.create(dto);
    return this.generosRepository.save(genero);
  }

  async findAll(): Promise<Genero[]> {
    return this.generosRepository.find({ order: { nombre: 'ASC' } });
  }

  async findOne(id: number): Promise<Genero> {
    const genero = await this.generosRepository.findOne({
      where: { id },
    });
    if (!genero) {
      throw new NotFoundException(`Género con id ${id} no encontrado`);
    }
    return genero;
  }

  async update(id: number, dto: UpdateGeneroDto): Promise<Genero> {
    await this.findOne(id);
    if (dto.nombre) {
      const existente = await this.generosRepository.findOne({
        where: { nombre: dto.nombre },
      });
      if (existente && existente.id !== id) {
        throw new ConflictException(
          `Ya existe un género con el nombre "${dto.nombre}"`,
        );
      }
    }
    await this.generosRepository.update(id, dto);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const genero = await this.generosRepository.findOne({
      where: { id },
      relations: { bandas: true },
    });
    if (!genero) {
      throw new NotFoundException(`Género con id ${id} no encontrado`);
    }
    if (genero.bandas.length > 0) {
      throw new BadRequestException(
        `No se puede borrar el género "${genero.nombre}": tiene ${genero.bandas.length} banda(s) asociada(s)`,
      );
    }
    await this.generosRepository.remove(genero);
  }
}

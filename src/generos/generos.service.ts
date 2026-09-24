import { Injectable, NotFoundException } from '@nestjs/common';
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
    const genero = this.generosRepository.create(dto);
    return this.generosRepository.save(genero);
  }

  async findAll(): Promise<Genero[]> {
    return this.generosRepository.find();
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
    await this.generosRepository.update(id, dto);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const genero = await this.findOne(id);
    await this.generosRepository.remove(genero);
  }
}
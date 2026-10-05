import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Banda } from './entities/banda.entity';
import { CreateBandaDto } from './dto/create-banda.dto';
import { UpdateBandaDto } from './dto/update-banda.dto';
import { Genero } from '../generos/entities/genero.entity';

@Injectable()
export class BandasService {
  constructor(
    @InjectRepository(Banda)
    private readonly bandasRepository: Repository<Banda>,
    @InjectRepository(Genero)
    private readonly generosRepository: Repository<Genero>,
  ) {}

  async create(dto: CreateBandaDto): Promise<Banda> {
    const genero = await this.generosRepository.findOne({ where: { id: dto.generoId } });
    if (!genero) {
      throw new BadRequestException(`Género con id ${dto.generoId} no existe`);
    }
    const banda = this.bandasRepository.create(dto);
    return this.bandasRepository.save(banda);
  }

  async findAll(generoId?: number): Promise<Banda[]> {
    return this.bandasRepository.find({
      where: generoId ? { generoId } : {},
      relations: { genero: true },
    });
  }

  async findOne(id: number): Promise<Banda> {
    const banda = await this.bandasRepository.findOne({
      where: { id },
      relations: { genero: true },
    });
    if (!banda) {
      throw new NotFoundException(`Banda con id ${id} no encontrada`);
    }
    return banda;
  }

  async update(id: number, dto: UpdateBandaDto): Promise<Banda> {
    if (dto.generoId) {
      const genero = await this.generosRepository.findOne({ where: { id: dto.generoId } });
      if (!genero) {
        throw new BadRequestException(`Género con id ${dto.generoId} no existe`);
      }
    }
    await this.findOne(id);
    await this.bandasRepository.update(id, dto);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const banda = await this.findOne(id);
    await this.bandasRepository.remove(banda);
  }
}
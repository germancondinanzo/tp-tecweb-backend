import { IsString, IsNotEmpty, MaxLength, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateBandaDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  nombre: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  pais: string;

  @IsNumber()
  @Type(() => Number)
  @Min(1800)
  @Max(2100)
  anioFormacion: number;

  @IsNumber()
  @Type(() => Number)
  generoId: number;
}
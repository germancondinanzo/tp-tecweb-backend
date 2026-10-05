import { Controller, Get, Post, Put, Delete, Param, Body, ParseIntPipe, HttpCode, HttpStatus, Query } from '@nestjs/common';
import { BandasService } from './bandas.service';
import { CreateBandaDto } from './dto/create-banda.dto';
import { UpdateBandaDto } from './dto/update-banda.dto';

@Controller('bandas')
export class BandasController {
  constructor(private readonly bandasService: BandasService) {}

  @Post()
  create(@Body() dto: CreateBandaDto) {
    return this.bandasService.create(dto);
  }

  @Get()
  findAll(@Query('generoId', new ParseIntPipe({ optional: true })) generoId?: number) {
    return this.bandasService.findAll(generoId);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.bandasService.findOne(id);
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateBandaDto) {
    return this.bandasService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.bandasService.remove(id);
  }
}
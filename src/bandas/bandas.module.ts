import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BandasController } from './bandas.controller';
import { BandasService } from './bandas.service';
import { Banda } from './entities/banda.entity';
import { GenerosModule } from '../generos/generos.module';

@Module({
  imports: [TypeOrmModule.forFeature([Banda]), GenerosModule],
  controllers: [BandasController],
  providers: [BandasService],
  exports: [BandasService],
})
export class BandasModule {}
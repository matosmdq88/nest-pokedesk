import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { Model, isValidObjectId } from 'mongoose';

import { CreatePokemonDto } from './dto/create-pokemon.dto';
import { UpdatePokemonDto } from './dto/update-pokemon.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Pokemon } from './entities/pokemoon.entity';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PokemonService {
private defaultLimit: number;

  constructor(
    @InjectModel(Pokemon.name)
    private readonly pokemonModel: Model<Pokemon>,

    private readonly configService: ConfigService
    ) {
    this.defaultLimit = configService.get<number>('defaultLimit');
  }

  async create(createPokemonDto: CreatePokemonDto) {
    try{
      createPokemonDto.name = createPokemonDto.name.toLowerCase();
      const pokemon = await this.pokemonModel.create(createPokemonDto);
      return pokemon;
    }catch(error){
      this.handleException(error);
    }
  }

  findAll(paginationDto : PaginationDto) {
    const {limit = this.defaultLimit, offset = 0} = paginationDto;

    return this.pokemonModel.find()
                            .limit(limit)
                            .skip(offset)
                            /*.sort({
                              no : 1
                            })*/
                            .select('-__v');
  }

  async findOne(term: string) {
    let pokemon: Pokemon;
    if(!isNaN(+term))
    {
      pokemon = await this.pokemonModel.findOne({no: term});
    }

    if(!pokemon && isValidObjectId(term))
    {
      pokemon = await this.pokemonModel.findById(term);
    }

    if(!pokemon){
      pokemon = await this.pokemonModel.findOne({name: term.toLowerCase()});
    }

    if(!pokemon) throw new NotFoundException(`no se encontro ningun pokemon relacionado a ${term}`);
    return pokemon;
  }

  async update(term: string, updatePokemonDto: UpdatePokemonDto) {
    try{
      const pokemon = await this.findOne(term);
      if(updatePokemonDto.name)
        updatePokemonDto.name = updatePokemonDto.name.toLowerCase();

      await pokemon.updateOne(updatePokemonDto, {new: true});
      return {...pokemon.toJSON(), ...updatePokemonDto};
    }catch(error){
      this.handleException(error);
    }
  }

  async remove(id: string) {
    // const pokemon = await this.findOne(id);
    // await pokemon.deleteOne();
    //return {id};

    //const result = await this.pokemonModel.findByIdAndDelete(id);
    
    const {deletedCount} = await this.pokemonModel.deleteOne({ _id : id});
    if(deletedCount === 0)
      throw new BadRequestException(`no se encontro el pokemon con el id: "${ id }"`);
    return deletedCount;
  }

  private handleException(error : any){
    if(error.code==11000){
      throw new BadRequestException(`ya existe este pokemon ${JSON.stringify(error.keyValue)}`);
    }
    throw new InternalServerErrorException(`No se puede crear, chekea los logs`);
  }
}

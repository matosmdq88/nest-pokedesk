import { Injectable } from '@nestjs/common';
import { PokeResponse } from './interfaces/poke-response.interface';
import { InjectModel } from '@nestjs/mongoose';
import { Pokemon } from 'src/pokemon/entities/pokemoon.entity';
import { Model } from 'mongoose';
import { AxiosAdapter } from 'src/common/adapters/axios.adapter';

@Injectable()
export class SeedService {
  

  constructor(@InjectModel(Pokemon.name)
    private readonly pokemonModel: Model<Pokemon>,
    private readonly http: AxiosAdapter){
  }

  async executeSeed(){
    await this.pokemonModel.deleteMany({});
    const data = await this.http.get<PokeResponse>('https://pokeapi.co/api/v2/pokemon?limit=650');
    /* insercion de a uno/ no tan optimo
    data.results.forEach(async({name, url}) => {
      const segments = url.split('/');
      const no = +segments[segments.length -2]
      const pokemon = await this.pokemonModel.create({name, no});
      console.log({name, no});
    });*/

    /*esta es un poco mas chill
    const insertPromisesArray = [];
    data.results.forEach(({name, url}) => {
      const segments = url.split('/');
      const no = +segments[segments.length -2]
      insertPromisesArray.push(this.pokemonModel.create({name, no}));
    })

    await Promise.all(insertPromisesArray);*/

    const pokemonToInsert: {name:string, no:number}[]= [];

    data.results.forEach(({name, url}) => {
      const segments = url.split('/');
      const no = +segments[segments.length -2]
      pokemonToInsert.push({name, no});
    })

    await this.pokemonModel.insertMany(pokemonToInsert);
    
    return 'seed ejecutado';
  }
}

import { capitalize } from "../utils/format";
import type { PokemonListItem } from "../services/api";

type PokemonCardProps = {
  pokemon: PokemonListItem;
};

export default function PokemonCard({ pokemon }: PokemonCardProps) {
  return <li className="pokedex-list-item">{capitalize(pokemon.name)}</li>;
}

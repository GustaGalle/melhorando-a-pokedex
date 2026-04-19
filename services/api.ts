export type Pokemon = {
  name: string;
  height: number;
  weight: number;
  sprites: {
    front_default: string | null;
  };
  types: Array<{
    type: { name: string };
  }>;
};

const BASE_URL = "https://pokeapi.co/api/v2/pokemon";

export async function fetchPokemonByName(name: string): Promise<Pokemon> {
  try {
    const response = await fetch(`${BASE_URL}/${name.toLowerCase()}`);

    if (!response.ok) {
      throw new Error("Pokemon nao encontrado");
    }

    return (await response.json()) as Pokemon;
  } catch {
    throw new Error("Falha ao buscar dados do Pokemon");
  }
}

export async function fetchInitialPokemon(): Promise<Pokemon> {
  try {
    return await fetchPokemonByName("pikachu");
  } catch {
    throw new Error("Falha ao carregar Pokemons iniciais");
  }
}

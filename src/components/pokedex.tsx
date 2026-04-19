import { useEffect, useState } from "react";
import "./pokedex.css";
import {
  fetchInitialPokemon,
  fetchPokemonByName,
  type Pokemon,
} from "../services/api";

export default function Pokedex() {
  const [nome, setNome] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [erroInicial, setErroInicial] = useState("");

  const [pokemon, setPokemon] = useState<Pokemon | null>(null);
  const [erro, setErro] = useState("");

  useEffect(() => {
    const carregarPokemonInicial = async () => {
      setIsLoading(true);
      setErroInicial("");

      try {
        const pokemonInicial = await fetchInitialPokemon();
        setPokemon(pokemonInicial);
      } catch {
        setErroInicial("Falha ao carregar Pokemons. Verifique sua conexao.");
      } finally {
        setIsLoading(false);
      }
    };

    void carregarPokemonInicial();
  }, []);

  const buscarPokemon = async () => {
    if (!nome.trim()) return;

    setCarregando(true);
    setErro("");
    setPokemon(null);

    try {
      const dados = await fetchPokemonByName(nome);
      setPokemon(dados);
    } catch {
      setErro("Pokemon nao encontrado 😢");
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="pokedex-container">
      <h2 className="pokedex-title">🔎 Pokédex</h2>

      <input
        className="pokedex-input"
        type="text"
        placeholder="Digite o nome do Pokémon"
        value={nome}
        onChange={(e) => setNome(e.target.value)}
      />

      <button className="pokedex-button" onClick={buscarPokemon}>
        Buscar
      </button>

      {isLoading && (
        <p className="pokedex-loading">Carregando Pokemons...</p>
      )}
      {!isLoading && erroInicial && <p className="pokedex-error">{erroInicial}</p>}
      {carregando && <p className="pokedex-loading">Carregando...</p>}
      {erro && <p className="pokedex-error">{erro}</p>}

      {!isLoading && pokemon && (
        <div className="pokedex-card">
          <h3 className="pokedex-name">{pokemon.name}</h3>
          {pokemon.sprites.front_default && (
            <img
              src={pokemon.sprites.front_default}
              alt={pokemon.name}
              className="pokedex-image"
            />
          )}
          <p>
            <strong>Altura:</strong> {pokemon.height * 10} cm
          </p>
          <p>
            <strong>Peso:</strong> {pokemon.weight / 10} kg
          </p>
          <p>
            <strong>Tipos:</strong>{" "}
            {pokemon.types.map((t) => t.type.name).join(" / ")}
          </p>
        </div>
      )}
    </div>
  );
}

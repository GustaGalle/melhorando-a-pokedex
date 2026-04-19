import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "./pokedex.css";
import { getPokemons, type PokemonListItem } from "../services/api";

export default function Pokedex() {
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [erroInicial, setErroInicial] = useState("");
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [pokemons, setPokemons] = useState<PokemonListItem[]>([]);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreTriggerRef = useRef<HTMLDivElement | null>(null);
  const isLoadingMoreRef = useRef(false);

  useEffect(() => {
    const carregarPokemonInicial = async () => {
      setIsLoading(true);
      setErroInicial("");

      try {
        const response = await getPokemons(0);
        setPokemons(response.results);
        setOffset(response.results.length);
        setHasMore(Boolean(response.next));
      } catch {
        setErroInicial("Falha ao carregar Pokemons. Verifique sua conexao.");
      } finally {
        setIsLoading(false);
      }
    };

    void carregarPokemonInicial();
  }, []);

  const loadMorePokemons = useCallback(async () => {
    if (isLoading || isLoadingMoreRef.current || !hasMore || erroInicial) {
      return;
    }

    isLoadingMoreRef.current = true;
    setIsLoadingMore(true);
    try {
      const response = await getPokemons(offset);
      setPokemons((prev) => [...prev, ...response.results]);
      setOffset((prevOffset) => prevOffset + response.results.length);
      setHasMore(Boolean(response.next));
    } catch {
      // Keeps existing list visible if pagination fails.
    } finally {
      isLoadingMoreRef.current = false;
      setIsLoadingMore(false);
    }
  }, [erroInicial, hasMore, isLoading, offset]);

  useEffect(() => {
    if (!loadMoreTriggerRef.current) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          void loadMorePokemons();
        }
      },
      { threshold: 0.2 },
    );

    observerRef.current.observe(loadMoreTriggerRef.current);

    return () => observerRef.current?.disconnect();
  }, [loadMorePokemons]);

  const filteredPokemons = useMemo(() => {
    const termo = search.trim().toLowerCase();
    if (!termo) return pokemons;
    return pokemons.filter((pokemon) => pokemon.name.includes(termo));
  }, [pokemons, search]);

  const mensagemListaVazia =
    !isLoading && filteredPokemons.length === 0
      ? search.trim()
        ? `Nenhum Pokemon encontrado para '${search.trim()}'.`
        : "Nenhum Pokemon para exibir no momento."
      : "";

  return (
    <div className="pokedex-container">
      <h2 className="pokedex-title">🔎 Pokédex</h2>

      <input
        className="pokedex-input"
        type="text"
        placeholder="Busque por nome"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {isLoading && (
        <p className="pokedex-loading">Carregando Pokemons...</p>
      )}
      {!isLoading && erroInicial && <p className="pokedex-error">{erroInicial}</p>}
      {!erroInicial && mensagemListaVazia && (
        <p className="pokedex-empty">{mensagemListaVazia}</p>
      )}

      {!isLoading && filteredPokemons.length > 0 && (
        <ul className="pokedex-list">
          {filteredPokemons.map((pokemon) => (
            <li key={pokemon.name} className="pokedex-list-item">
              {pokemon.name}
            </li>
          ))}
        </ul>
      )}

      {!isLoading && hasMore && !search.trim() && !erroInicial && (
        <div ref={loadMoreTriggerRef} className="pokedex-trigger" />
      )}

      {!isLoading && isLoadingMore && (
        <p className="pokedex-loading">Carregando mais Pokemons...</p>
      )}
    </div>
  );
}

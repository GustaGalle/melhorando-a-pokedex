# Proposta de Refatoracao para MVVM

## 1. Padrao Escolhido

O padrao escolhido para a refatoracao da tela da Pokedex foi o **MVVM (Model-View-ViewModel)**.

Considero MVVM uma boa opcao para este aplicativo porque a Pokedex tem uma interface que depende bastante de estado: texto digitado na busca, Pokemon carregado, mensagens de erro e indicadores de carregamento. Em React, esse tipo de organizacao combina muito bem com hooks personalizados. Um hook como `usePokedexViewModel` pode concentrar a logica da tela, enquanto o componente `PokedexScreen.tsx` fica responsavel principalmente por renderizar a interface.

Com essa abordagem, a View fica mais limpa e o ViewModel passa a ser o lugar onde ficam as regras de apresentacao, controle de estado e chamadas ao servico de API.

## 2. Nova Estrutura de Arquivos

Uma possivel nova estrutura para a tela da Pokedex seria:

```text
PokedexApp/
+-- src/
    +-- components/
    |   +-- PokemonCard/
    |   |   +-- PokemonCard.tsx
    |   |   +-- PokemonCard.css
    |   +-- SearchInput/
    |       +-- SearchInput.tsx
    |       +-- SearchInput.css
    |
    +-- screens/
    |   +-- Pokedex/
    |       +-- PokedexScreen.tsx        (View)
    |       +-- PokedexScreen.css
    |       +-- usePokedexViewModel.ts   (ViewModel)
    |
    +-- services/
    |   +-- pokemonApi.ts                (Model / acesso a dados)
    |
    +-- types/
    |   +-- pokemon.ts                   (tipos da aplicacao)
    |
    +-- utils/
    |   +-- pokemonFormatters.ts         (formatacoes auxiliares)
    |
    +-- App.tsx
    +-- main.tsx
```

Na estrutura atual do projeto, o arquivo `src/components/pokedex.tsx` concentra a tela inteira. Na proposta acima, ele seria substituido por `src/screens/Pokedex/PokedexScreen.tsx` e parte da sua logica iria para `usePokedexViewModel.ts`.

## 3. Divisao de Responsabilidades

### View: `PokedexScreen.tsx`

A View seria responsavel apenas por mostrar a interface e encaminhar eventos do usuario para o ViewModel. Ela nao deveria saber detalhes sobre a PokeAPI, URL de requisicao, tratamento interno de erros ou regras de formatacao mais complexas.

Responsabilidades da View:

- Renderizar o titulo da tela.
- Renderizar o campo de busca.
- Renderizar o botao de busca, se a busca continuar sendo acionada por botao.
- Exibir mensagens de carregamento.
- Exibir mensagens de erro.
- Renderizar o componente `PokemonCard` quando houver um Pokemon carregado.
- Chamar funcoes expostas pelo ViewModel quando o usuario interagir com a tela.

Exemplo conceitual de consumo do ViewModel:

```tsx
const {
  searchQuery,
  pokemon,
  isLoading,
  errorMessage,
  setSearchQuery,
  searchPokemon,
} = usePokedexViewModel();
```

Com isso, a View nao precisaria manter varios `useState` diretamente. Ela apenas usaria os dados e funcoes fornecidos pelo ViewModel.

### ViewModel: `usePokedexViewModel.ts`

O ViewModel concentraria a logica de apresentacao e estado da tela. Ele faria a ponte entre a View e a camada de servico.

Estados que o ViewModel poderia expor:

- `searchQuery`: texto digitado pelo usuario.
- `pokemon`: Pokemon encontrado ou Pokemon inicial.
- `isLoading`: indica se ha uma busca em andamento.
- `isInitialLoading`: indica se o carregamento inicial esta acontecendo.
- `errorMessage`: mensagem de erro da busca.
- `initialErrorMessage`: mensagem de erro do carregamento inicial.
- `hasPokemon`: valor booleano derivado para facilitar a renderizacao.

Funcoes que o ViewModel poderia expor:

- `setSearchQuery(value: string)`: atualiza o texto de busca.
- `searchPokemon()`: executa a busca pelo Pokemon digitado.
- `loadInitialPokemon()`: carrega o Pokemon inicial, como Pikachu.
- `clearError()`: limpa mensagens de erro, se necessario.

Responsabilidades do ViewModel:

- Controlar os estados da tela.
- Chamar `pokemonApi` para buscar dados.
- Tratar erros vindos da API.
- Decidir quando mostrar loading e erro.
- Validar se o campo de busca esta vazio.
- Normalizar o texto buscado, por exemplo removendo espacos e usando letras minusculas.
- Preparar dados derivados para a View, quando fizer sentido.

Exemplo de regras que poderiam ficar no ViewModel:

- Se o usuario tentar buscar com campo vazio, nao chamar a API.
- Antes de buscar, limpar erro anterior.
- Durante a busca, marcar `isLoading` como `true`.
- Se a API falhar, preencher `errorMessage` com uma mensagem amigavel.
- Ao finalizar, marcar `isLoading` como `false`.

### Model / Service: `pokemonApi.ts`

A camada de servico continuaria responsavel por falar com a PokeAPI.

Responsabilidades:

- Definir a URL base da API.
- Fazer requisicoes HTTP.
- Verificar `response.ok`.
- Converter a resposta JSON.
- Retornar dados tipados para o ViewModel.

Ela nao deveria controlar estado visual, mensagens de tela ou regras especificas de apresentacao.

### Components: `PokemonCard` e `SearchInput`

O `PokemonCard` ficaria responsavel por exibir os dados de um Pokemon:

- nome;
- imagem;
- altura;
- peso;
- tipos.

O `SearchInput` poderia encapsular o campo de busca e deixar a View ainda mais limpa. Ele receberia `value`, `onChange` e talvez `onSubmit` por props.

## 4. Fluxo de Dados

### Fluxo ao carregar a tela

```text
1. O usuario abre a aplicacao.
2. A View `PokedexScreen.tsx` e renderizada.
3. A View chama o hook `usePokedexViewModel`.
4. Dentro do ViewModel, um `useEffect` executa `loadInitialPokemon`.
5. `loadInitialPokemon` marca `isInitialLoading` como `true`.
6. O ViewModel chama `pokemonApi.fetchPokemonByName("pikachu")`.
7. O servico busca os dados na PokeAPI e retorna o Pokemon.
8. O ViewModel salva o Pokemon no estado `pokemon`.
9. O ViewModel marca `isInitialLoading` como `false`.
10. A View e atualizada automaticamente e renderiza o `PokemonCard`.
```

### Fluxo quando o usuario digita no campo de busca

```text
1. O usuario digita no campo de busca da View.
2. O evento `onChange` da View chama `setSearchQuery`, funcao exposta pelo ViewModel.
3. O ViewModel atualiza o estado `searchQuery`.
4. Como o estado mudou, a View e renderizada novamente com o novo valor no input.
```

Nesse fluxo, digitar no campo apenas atualiza o estado. A busca em si pode acontecer ao clicar no botao ou ao pressionar Enter.

### Fluxo quando o usuario clica em Buscar

```text
1. O usuario clica no botao "Buscar".
2. A View chama `searchPokemon`, funcao exposta pelo ViewModel.
3. O ViewModel verifica se `searchQuery` esta vazio.
4. Se estiver vazio, o ViewModel encerra a funcao sem chamar a API.
5. Se houver texto, o ViewModel limpa erros anteriores e marca `isLoading` como `true`.
6. O ViewModel chama `pokemonApi.fetchPokemonByName(searchQuery)`.
7. O servico faz a requisicao para a PokeAPI.
8. Se a API retornar sucesso, o ViewModel salva o Pokemon recebido no estado `pokemon`.
9. Se a API retornar erro, o ViewModel salva uma mensagem em `errorMessage`.
10. O ViewModel marca `isLoading` como `false`.
11. A View reage aos novos estados e mostra o card, loading ou erro conforme o caso.
```

## 5. Exemplo Conceitual dos Arquivos

### `PokedexScreen.tsx` como View

```tsx
export function PokedexScreen() {
  const {
    searchQuery,
    pokemon,
    isLoading,
    isInitialLoading,
    errorMessage,
    initialErrorMessage,
    setSearchQuery,
    searchPokemon,
  } = usePokedexViewModel();

  return (
    <main className="pokedex-container">
      <h1>Pokedex</h1>

      <SearchInput
        value={searchQuery}
        onChange={setSearchQuery}
        onSubmit={searchPokemon}
      />

      <button onClick={searchPokemon} disabled={isLoading}>
        Buscar
      </button>

      {isInitialLoading && <p>Carregando Pokemon inicial...</p>}
      {initialErrorMessage && <p>{initialErrorMessage}</p>}
      {isLoading && <p>Buscando Pokemon...</p>}
      {errorMessage && <p>{errorMessage}</p>}
      {pokemon && <PokemonCard pokemon={pokemon} />}
    </main>
  );
}
```

### `usePokedexViewModel.ts` como ViewModel

```tsx
export function usePokedexViewModel() {
  const [searchQuery, setSearchQuery] = useState("");
  const [pokemon, setPokemon] = useState<Pokemon | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [initialErrorMessage, setInitialErrorMessage] = useState("");

  async function searchPokemon() {
    const query = searchQuery.trim().toLowerCase();

    if (!query) return;

    setIsLoading(true);
    setErrorMessage("");

    try {
      const result = await fetchPokemonByName(query);
      setPokemon(result);
    } catch {
      setErrorMessage("Pokemon nao encontrado.");
    } finally {
      setIsLoading(false);
    }
  }

  return {
    searchQuery,
    pokemon,
    isLoading,
    isInitialLoading,
    errorMessage,
    initialErrorMessage,
    setSearchQuery,
    searchPokemon,
  };
}
```

Esse exemplo nao precisa ser implementado exatamente dessa forma, mas mostra a ideia principal: a View renderiza, o ViewModel controla o estado e os servicos buscam os dados.

## 6. Vantagens da Refatoracao

Com MVVM, a tela da Pokedex ficaria mais organizada porque a responsabilidade de cada arquivo seria mais clara.

Principais vantagens:

- A View fica menor e mais facil de ler.
- A logica de busca pode ser testada separadamente no ViewModel.
- O estado da tela fica centralizado em um hook.
- Componentes como `PokemonCard` podem ser reutilizados em outras telas.
- A camada de servico continua isolada da interface.
- A aplicacao fica mais preparada para crescer com novas telas, filtros, favoritos e detalhes de Pokemon.

## Conclusao

A refatoracao para MVVM seria uma boa evolucao para a Pokedex porque respeita o estilo natural de aplicacoes React modernas. A tela `PokedexScreen` ficaria responsavel pela interface, o hook `usePokedexViewModel` concentraria estado e regras de apresentacao, e o servico `pokemonApi` continuaria responsavel pela comunicacao com a PokeAPI.

Essa separacao torna o projeto mais organizado, mais testavel e mais facil de evoluir sem transformar a tela principal em um componente grande demais.

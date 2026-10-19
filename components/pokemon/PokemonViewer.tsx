"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/shared/icons";

interface Pokemon {
  id: number;
  name: string;
  height: number;
  weight: number;
  sprites: {
    other?: {
      "official-artwork"?: {
        front_default: string | null;
      };
    };
  };
  types: { slot: number; type: { name: string } }[];
  stats: { base_stat: number; stat: { name: string } }[];
}

const FIRST_POKEMON = 1;
const LAST_POKEMON = 1025;

const TYPE_LABELS: Record<string, string> = {
  normal: "Normal",
  fire: "Fuego",
  water: "Agua",
  electric: "Eléctrico",
  grass: "Planta",
  ice: "Hielo",
  fighting: "Lucha",
  poison: "Veneno",
  ground: "Tierra",
  flying: "Volador",
  psychic: "Psíquico",
  bug: "Bicho",
  rock: "Roca",
  ghost: "Fantasma",
  dragon: "Dragón",
  dark: "Siniestro",
  steel: "Acero",
  fairy: "Hada",
};

const STAT_LABELS: Record<string, string> = {
  hp: "PS",
  attack: "Ataque",
  defense: "Defensa",
  "special-attack": "At. esp.",
  "special-defense": "Def. esp.",
  speed: "Velocidad",
};

function formatName(name: string) {
  return name.charAt(0).toUpperCase() + name.slice(1);
}

export function PokemonViewer() {
  const [pokemonId, setPokemonId] = useState(FIRST_POKEMON);
  const [pokemon, setPokemon] = useState<Pokemon | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fetchToken, setFetchToken] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function fetchPokemon() {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `https://pokeapi.co/api/v2/pokemon/${pokemonId}`,
          { signal: controller.signal },
        );
        if (!res.ok)
          throw new Error(`Request failed with status ${res.status}`);
        const data: Pokemon = await res.json();
        setPokemon(data);
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError("No se pudo cargar el Pokémon. Intenta de nuevo.");
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }

    void fetchPokemon();
    return () => controller.abort();
  }, [pokemonId, fetchToken]);

  const goTo = (id: number) => {
    const clamped = Math.min(LAST_POKEMON, Math.max(FIRST_POKEMON, id));
    setPokemonId(clamped);
  };

  const artwork =
    pokemon?.sprites.other?.["official-artwork"]?.front_default ?? null;

  return (
    <div className="mx-auto flex w-full max-w-[520px] flex-col gap-[18px]">
      <Link
        href="/"
        className="flex w-fit items-center gap-[7px] text-[14px] font-bold text-[#94887B]"
      >
        <ChevronLeftIcon size={18} />
        Volver al inicio
      </Link>

      <div className="rounded-[18px] border border-[#ECE0D0] bg-[#FFFDF9] p-6 shadow-[0_10px_30px_-18px_rgba(63,54,46,.35)]">
        <div className="mb-1 text-[12.5px] font-extrabold tracking-[.8px] text-accent">
          POKÉMON #{String(pokemonId).padStart(4, "0")}
        </div>

        {isLoading && (
          <div
            role="status"
            className="flex min-h-[320px] items-center justify-center text-[15px] font-semibold text-[#94887B]"
          >
            Cargando…
          </div>
        )}

        {!isLoading && error && (
          <div className="flex min-h-[320px] flex-col items-center justify-center gap-4">
            <p className="text-[15px] font-semibold text-[#94887B]">{error}</p>
            <button
              type="button"
              onClick={() => setFetchToken((token) => token + 1)}
              className="cursor-pointer rounded-[14px] bg-[linear-gradient(180deg,#F4977E,#EE8164)] px-[18px] py-[11px] text-[14.5px] font-extrabold text-white"
            >
              Reintentar
            </button>
          </div>
        )}

        {!isLoading && !error && pokemon && (
          <>
            <h1 className="m-0 font-display text-[30px] font-semibold text-foreground">
              {formatName(pokemon.name)}
            </h1>

            <div className="my-4 flex justify-center">
              {artwork ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={artwork}
                  alt={formatName(pokemon.name)}
                  width={260}
                  height={260}
                  className="h-[260px] w-[260px] object-contain"
                />
              ) : (
                <div className="flex h-[260px] w-[260px] items-center justify-center rounded-full bg-[#F6ECDF] text-[15px] font-semibold text-[#94887B]">
                  Sin imagen
                </div>
              )}
            </div>

            <div className="mb-5 flex justify-center gap-2">
              {pokemon.types.map(({ slot, type }) => (
                <span
                  key={slot}
                  className="rounded-full bg-[#F6ECDF] px-3 py-1 text-[12.5px] font-extrabold uppercase tracking-[.5px] text-[#6E6154]"
                >
                  {TYPE_LABELS[type.name] ?? type.name}
                </span>
              ))}
            </div>

            <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-[14px]">
              <div className="flex justify-between border-b border-[#F1E7DA] pb-2">
                <dt className="font-bold text-[#94887B]">Altura</dt>
                <dd className="font-extrabold text-foreground">
                  {(pokemon.height / 10).toFixed(1)} m
                </dd>
              </div>
              <div className="flex justify-between border-b border-[#F1E7DA] pb-2">
                <dt className="font-bold text-[#94887B]">Peso</dt>
                <dd className="font-extrabold text-foreground">
                  {(pokemon.weight / 10).toFixed(1)} kg
                </dd>
              </div>
              {pokemon.stats.map(({ base_stat, stat }) => (
                <div
                  key={stat.name}
                  className="flex justify-between border-b border-[#F1E7DA] pb-2"
                >
                  <dt className="font-bold text-[#94887B]">
                    {STAT_LABELS[stat.name] ?? stat.name}
                  </dt>
                  <dd className="font-extrabold text-foreground">
                    {base_stat}
                  </dd>
                </div>
              ))}
            </dl>
          </>
        )}
      </div>

      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => goTo(pokemonId - 1)}
          disabled={isLoading || pokemonId <= FIRST_POKEMON}
          className="flex cursor-pointer items-center gap-2 rounded-[14px] border border-[#ECE0D0] bg-[#FFFDF9] px-[18px] py-[11px] text-[14.5px] font-extrabold text-foreground transition disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeftIcon size={17} />
          Anterior
        </button>

        <span className="text-[14px] font-extrabold text-[#94887B]">
          {pokemonId} / {LAST_POKEMON}
        </span>

        <button
          type="button"
          onClick={() => goTo(pokemonId + 1)}
          disabled={isLoading || pokemonId >= LAST_POKEMON}
          className="flex cursor-pointer items-center gap-2 rounded-[14px] bg-[linear-gradient(180deg,#F4977E,#EE8164)] px-[18px] py-[11px] text-[14.5px] font-extrabold text-white shadow-[0_8px_18px_-8px_rgba(238,129,100,.7)] transition disabled:cursor-not-allowed disabled:opacity-40"
        >
          Siguiente
          <ChevronRightIcon size={17} />
        </button>
      </div>
    </div>
  );
}

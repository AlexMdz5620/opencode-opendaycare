import { PokemonViewer } from "@/components/pokemon/PokemonViewer";

export default function PokemonPage() {
  return (
    <main className="flex min-h-screen flex-col justify-center bg-background px-6 py-10">
      <PokemonViewer />
    </main>
  );
}

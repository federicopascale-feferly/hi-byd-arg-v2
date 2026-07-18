import { Calculator } from "@/components/Calculator";

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6 sm:py-12">
      <header className="mb-8">
        <p className="font-display text-xs uppercase tracking-[0.3em] text-primary">Hi BYD Argentina</p>
        <h1 className="mt-2 font-display text-2xl font-bold uppercase leading-tight sm:text-3xl">
          Calculadora de carga
        </h1>
        <p className="mt-2 max-w-xl text-sm text-muted-fg">
          Elegí tu modelo, cuánta batería tenés y dónde vas a cargar: te decimos cuánto tarda, cuánto
          cuesta y cuánto ahorrás contra la nafta.
        </p>
      </header>

      <Calculator />

      <footer className="mt-10 text-xs text-muted-fg">
        <p>
          Tarifas de referencia julio 2026 (EPE, EDELAP, YPF, ChargeBox, Shell). Los tiempos son
          estimaciones: la carga real varía con temperatura, estado de la batería y del cargador.
        </p>
      </footer>
    </main>
  );
}

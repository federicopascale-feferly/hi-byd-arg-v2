const ars = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

const arsFino = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const num = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 1 });

const usd = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export const formatARS = (v: number) => ars.format(v);
/** Con centavos, para valores chicos como $/km */
export const formatARSFino = (v: number) => arsFino.format(v);
export const formatNum = (v: number) => num.format(v);
export const formatUSD = (v: number) => usd.format(v);

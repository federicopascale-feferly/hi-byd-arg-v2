# Calculadora Hi BYD Argentina v2

Calculadora de carga para vehículos BYD de la comunidad **Hi BYD Argentina**: tiempo y costo de carga por modelo/cargador/tarifa, comparación $/km contra nafta, amortización del Wallbox y un asistente de consultas con IA.

**Producción:** https://hi-byd-arg-v2.vercel.app

## Documentación

- [docs/funcional.md](docs/funcional.md) — qué hace la app: modelos, reglas de negocio, fórmulas y validaciones con datos reales.
- [docs/tecnica.md](docs/tecnica.md) — cómo está hecha: stack, estructura, invariantes del motor, asistente, deploy.
- [docs/CHANGELOG.md](docs/CHANGELOG.md) — qué se entregó en cada fase.
- [docs/spec-v2.md](docs/spec-v2.md) — la spec funcional original.

## Comandos

```bash
npm run dev      # dev server
npm test         # suite Vitest (el gate es una carga real de la comunidad)
npm run build    # build de producción
```

Variables de entorno: ver [.env.example](.env.example). Sin ellas la calculadora funciona igual (solo se apagan el chat y el endpoint de QA).

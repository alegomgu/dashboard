# Regime CORE — tech/semis apalancado con timing de tendencia

> Ficha de estrategia para la web de seguimiento (conectada a Alpaca). Resume qué opera el bot
> `regime-core-bot` y bajo qué evidencia. Última actualización: 2026-06-23.

## Nombre de la estrategia

**Regime CORE** — timing de régimen sobre ETFs sectoriales apalancados (3×) de tecnología y
semiconductores. *No es stock-picking:* es temporización de exposición a beta apalancada.

## Objetivo

Capturar las **épocas explosivas** de tech/semis estando dentro del ETF apalancado en tendencia
alcista y **en caja** cuando la tendencia se rompe, para subir el CAGR y, sobre todo, **recortar el
drawdown** frente a comprar y mantener (un 3× sufre decaimiento por reset diario y caídas de
−80/−90%). No busca predecir giros: confirma el régimen y acepta entrar/salir con algo de lag.

## Universo

Tres ETFs apalancados 3×, cada uno con su subyacente 1× para la señal:

| Vehículo (3×) | Subyacente (señal) | Tema |
|---|---|---|
| TQQQ | QQQ (Nasdaq-100) | Tecnología |
| SOXL | SOXX (semiconductores) | Semis |
| SPXL | SPY (S&P 500) | Mercado amplio |

Universo **fijo** (no rota a otros sectores: oro, uranio, china, baterías… se probaron en F9 y la
alfa explosiva fue específica de tech/semis; la rotación restaba). Survivorship-free (son ETFs).

## Señales de entrada

Para cada vehículo, **risk-on** si el subyacente 1× cierra **por encima de su SMA(200)** (causal,
con `.shift(1)`, sin look-ahead). Entre los que estén risk-on se reparte el capital a **peso igual**.

## Señales de salida

Cuando el subyacente cae **por debajo de su SMA(200)**, ese ETF va a **caja**. Si ninguno de los tres
está risk-on, la cartera queda **100% en caja**. Es la misma regla de tendencia en sentido inverso
(trend-follower puro; sin stop-loss explícito por defecto).

## Frecuencia de rebalanceo

**Semanal** (por defecto, lunes tras la apertura — `REBALANCE_WEEKDAY=0`, `REBALANCE_TIME=15:45`
UTC). Con guard de horario: si el mercado está cerrado, no envía órdenes y reintenta en el siguiente.

## Gross / apalancamiento

- **Gross objetivo de la cartera = 1,0×** (sin apalancamiento de cuenta): se reparte 1/N entre los
  ETFs risk-on, o se va a caja.
- El **apalancamiento real ≈ 3×** viene embebido en los ETFs (TQQQ/SOXL/SPXL ya son 3× su índice).
- Constraint del proyecto: `LEVERAGE_BRUTO_MAX = 1,60×` sobre el equity para estrategias de acciones;
  aquí el apalancamiento es interno al vehículo, no margen de cuenta.

## Tamaño de posiciones

- **Acciones enteras**, dimensionadas sobre el **equity real de la cuenta Alpaca** en cada rebalanceo.
- Peso igual entre vehículos risk-on (1/N del capital asignado).
- Órdenes por debajo de `MIN_ORDER_USD` (20 USD) se ignoran para reducir turnover/ruido.
- **Sizing crítico (riesgo):** no destinar el 100% del patrimonio al combo — es un 3× que puede
  hacer −60%. La forma correcta de bajar el DD es asignar **menos % del capital**, no vol-target
  (vol-target recorta más CAGR que DD → empeora el Calmar).

## Riesgos principales

- **Drawdowns violentos:** −55% a −79% en OOS; **2022 hizo −44%** pese al filtro (los trend-filters
  no esquivan bears rápidos/whipsaw) y estuvo ~2 años bajo el agua.
- **Lag del trend-follower:** entra/sale con retraso → se come el primer tramo de cada caída.
- **Sin test en bear severo multi-año:** los ETFs 3× no existían en 2008/2000; el buy&hold −90% es
  el aviso de cola que la muestra no contiene.
- **Decaimiento 3×** por reset diario (ya está en el precio histórico, no simulado).
- **Concentración** en un único tema (tech/semis).
- **Impuestos no modelados** (turnover alto genera mucho corto plazo en cuenta real).
- **yfinance es dato prototipo** para la señal; para real conviene un feed mejor.

## Estado operativo actual

- **Paper-trading en Alpaca** vía bot dockerizado (`regime-core-bot`), pensado para mini-PC, rebalanceo
  semanal automático. Por defecto `ALPACA_PAPER=true`. Modo `DRY_RUN` disponible (solo loguea).
- Acumulando **track record real hacia adelante** (lo que le faltaba al backtest); cada ENTRAR/SALIR
  queda en `state/signal_log.csv` + `state/run.log`.
- **No es dinero real** hasta validar varios meses de paper vs backtest y vs SPY, y solo con una
  fracción pequeña del patrimonio.

## Métricas / backtest relevantes

**Walk-forward OOS 2014-2026 (honesto, regla elegida por Calmar en train previo; survivorship-free):**

| | Buy&Hold | Timing (Regime CORE) |
|---|---|---|
| **SOXL** | CAGR 57,3% · Sharpe 0,96 · MaxDD −90% · Calmar 0,63 | CAGR **78,5%** · Sharpe **1,21** · MaxDD −79% · Calmar **0,99** |
| **TQQQ** | CAGR 40,6% · Sharpe 0,86 · MaxDD −82% · Calmar 0,50 | CAGR 33,9% · Sharpe 0,99 · MaxDD **−55%** · Calmar 0,62 |
| **COMBO 3-ETF (1/3 c/u)** | — | CAGR **49%** · Sharpe **1,22** · MaxDD **−48%** · Calmar **1,01** |

- **SOXL bate al buy&hold en TODAS las métricas**; el **combo 3-ETF corta el DD casi a la mitad**
  (−48% vs −79%) manteniendo Sharpe/Calmar → **es la versión recomendada**.
- Retorno OOS por año (SOXL): 2020 +196%, 2021 +269%, 2023 +198%, 2026 +369%; **2022 −44%**.
- Backtest 2019-26 ilustrativo: ~31× con **−63% de drawdown** y ~2 años bajo el agua en 2022.

**Caveats:** OOS 2014-2026 es mayormente toro secular + boom IA (optimista vs un futuro peor); costes
completos incluidos (comisión + slippage + interés de margen); ETFs muy líquidos (slippage mínimo).

**Contexto del proyecto:** el stock-picking momentum sobre el S&P 500 fue **archivado** — corregido a
membresía point-in-time, el "edge" colapsaba a +3,1pp vs azar (era survivorship/hindsight de
composición). Regime CORE es la forma honesta y validada de aprovechar lo explosivo: **beta
apalancada del tema en racha, gestionada con timing de régimen**, no skill de selección.

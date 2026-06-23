# Ficha de estrategia — Aggressive AI Momentum

> Documento orientado a la web de seguimiento de cuentas (Alpaca). Resume la estrategia
> en términos operativos. Las cifras de backtest son **investigación**, no garantía de
> resultados; ver advertencias al final.

---

## Nombre de la estrategia

**Aggressive AI Momentum** (`aggressive_ai_momentum`)
Variante de scoring: `aggressive_ai` · Familia: momentum de renta variable US concentrado y explosivo.

## Objetivo

Capturar curvas de capital explosivas mediante exposición concentrada a líderes de
momentum (crecimiento, tecnología, IA y semiconductores), rotando con frecuencia y
filtrando por fuerza relativa y tendencia. Prioriza **robustez sobre rentabilidad de
titular**: todo resultado se evalúa contra costes, benchmarks, placebos, subperiodos y
tests de "remove-best".

## Universo

- **Principal en investigación:** `ai_growth_curated` (cesta curada de IA/crecimiento).
- **Universos de validación:** `sp500_current`, `nasdaq100`, S&P 100 estático.
- Proveedor de datos: `yfinance` (calidad *prototype*).
- ⚠️ El universo curado tiene **alto riesgo de survivorship bias** y no es point-in-time;
  no válido para afirmaciones de rendimiento definitivas.

## Señales de entrada

Score cross-sectional por percentiles (sin lookahead, calculado con datos hasta el
cierre de `t-1`, ejecución en la apertura de `t`). Pesos de la variante `aggressive_ai`:

| Feature | Peso |
|---|---:|
| `mom_10d` (momentum 10 días) | 0.25 |
| `mom_21d` (momentum 21 días) | 0.25 |
| `mom_63d` (momentum 63 días) | 0.20 |
| `dist_high_21d` (distancia al máximo de 21 días) | 0.15 |
| `rel_qqq_21d` (fuerza relativa vs QQQ, 21 días) | 0.10 |
| `log_adv_21` (liquidez, volumen medio log) | 0.05 |

Se seleccionan los **top-N por score**, con caps por sector. Filtro de regimen activo
para modular la exposición agregada.

## Señales de salida

- **Base:** rotación por reranking — un nombre sale cuando deja de estar en el top-N.
- **Salidas a nivel de señal (variantes con filtro de riesgo, p. ej. `*_exit_loose_*`):**
  salida diaria de un valor en cartera cuando pierde momentum a corto plazo. Umbrales
  *loose*:
  - `mom_10d < -5%`
  - `mom_21d < -3%`
  - `sma_21_ratio < -6%`
  - `dist_high_21d < -15%`
  - (existe una variante *strict* más agresiva: `-2% / 0% / -3% / -10%`, aún no promovida).
- Caja no apalancada puede aparcarse opcionalmente en `SPY` (ablación, no default).

## Frecuencia de rebalanceo

- **Diaria** (`rebalance_frequency = "daily"`, `execution = "next_open"`).
- En variantes con filtro de señal: **salidas diarias** + **entradas frescas semanales**.
- Banda de no-trade (`no_trade_band = 0.01`) para reducir rotación innecesaria.

## Gross / apalancamiento

- Gross máximo en investigación: **`1.3x`** (config) — tesis admite hasta **`1.6x`**.
- Buying power offline por defecto: `1.6x` equity (alineado con el max gross de research).
- Apalancamiento moderado y opcional; escalado gradual del gross según drawdown conocido
  y estado del *gate* de predictibilidad de rank.
- Vol-target disponible pero **desactivado** en la config base (`vol_target = 0.30`).

## Tamaño de posiciones

- Construcción: **equal-weight** sobre los seleccionados.
- `top_n = 5` (config base; los candidatos finalistas usan top3 o top5 según variante).
- `max_position_weight = 0.35` · `max_sector_weight = 0.60` · `max_per_sector = 3`.
- Acciones fraccionadas: **habilitadas**.
- `min_order_notional = 50 USD` · buffer de caja `0.02`.
- Capital inicial de referencia: **`7.500 USD`**.

## Riesgos principales

- **Concentración:** pocas posiciones de alto beta → drawdowns profundos.
- **Duración del drawdown:** Fase 11 mejoró la *profundidad* del drawdown pero **no la
  velocidad de recuperación**; en regímenes duros (2022-2023) los días en drawdown siguen
  siendo altos.
- **Calidad de datos:** `yfinance`, no point-in-time, posible survivorship bias.
- **Regímenes bajistas:** sensible a entornos como 2022; el aparcado en SPY mezcla alfa
  con beta de mercado.
- **Sobreajuste:** mitigado con placebos (100 seeds), remove-best, subperiodos y walk-forward.

## Estado operativo actual

- Fase: **research activa**. Implementadas Fases 0–14 (Fase 14 = *paper trading readiness*).
- **Paper trading con Alpaca** soportado (modo *preview-only* por defecto; el envío de
  órdenes paper exige doble confirmación explícita). Refusa la URL live de Alpaca.
- **IBKR:** solo placeholder, sin enrutado real de órdenes.
- Candidato por defecto para el primer paper (conservador): `top3_pos0533_sector080`.
- **No apto para producción real** hasta resolver universos point-in-time, valores
  deslistados, logs diarios limpios y reconciliación de órdenes.

## Métricas / backtest relevantes

> Resultados de investigación. Sujetos a las advertencias de calidad de datos.

**S&P 500 actual — 2026 YTD**

| Variante | Equity | Retorno | Sharpe | MaxDD | Días DD | Costes |
|---|---:|---:|---:|---:|---:|---:|
| `top5_pos035_sector100` | $19.043 | 153,90% | 3,26 | -16,96% | 27 | $713 |
| `top3_pos0533_sector100` (turbo) | $18.338 | 144,51% | 3,23 | -15,95% | 27 | $583 |
| `turbo_exit_loose_scale_cash` | $17.340 | 131,20% | 3,33 | -13,27% | 27 | $493 |
| `top3_pos0533_sector080` (core) | $16.599 | 121,32% | 3,33 | -13,01% | 27 | $473 |
| `core_exit_loose_scale_cash` | $15.841 | 111,22% | 3,36 | -11,52% | 27 | $431 |

**S&P 500 actual — régimen duro 2022-2023** (mejor evidencia del filtro de salida)

| Variante | Retorno | Sharpe | MaxDD |
|---|---:|---:|---:|
| `turbo_exit_loose_scale_cash` | 11,04% | 0,37 | -25,95% |
| `top3_pos0533_sector100` (turbo estático) | 7,57% | 0,29 | -42,61% |

El filtro de salida redujo el MaxDD en más de 13 puntos frente al turbo estático.

**Muestra completa 2019–actualidad**

| Universo | Mejor estático (ret / MaxDD) | Mejor con filtro de salida (ret / MaxDD) |
|---|---|---|
| `sp500_current` | 574,91% / -41,36% | 586,33% / -41,31% |
| `nasdaq100` | 515,10% / -55,55% | 676,19% / -44,97% |

**Validación:** 93 tests pasando · placebos (100 seeds), remove-best, subperiodos y
costes severos activados en la config.

---

### Advertencias de honestidad

- Datos vía `yfinance` → adecuado para prototipo/research, **no** para afirmaciones de
  producción.
- Universo curado de IA/crecimiento: alto riesgo de survivorship bias, inválido para
  claims de rendimiento.
- Universos de índice no son point-in-time.
- Regla sin lookahead: *si la ejecución ocurre en la apertura de `t`, solo puede usarse
  información disponible hasta el cierre de `t-1`*.

# Momentum 12-1 con gate LEGAR (top-10, trimestral, 1.6x)

> Ficha descriptiva de la estrategia en ejecución (Alpaca paper). Pensada para
> mostrarse en la web de seguimiento de cuentas. **No constituye consejo de
> inversión.** Track record en paper sobre datos prototipo; aún no validado con
> dinero real.

## Nombre de la estrategia

**Momentum 12-1 LEGAR-gated** — identificador interno
`momentum_pure_legar_thr+0.050_quarterly_top10_g1.6`.
Alias de investigación: familia E5, baseline de momentum `momentum_252_21`.

## Objetivo

Capturar la prima de *momentum* transversal (cross-sectional) en renta variable
US large-cap: estar largo de los valores que más han subido en los últimos ~12
meses, apalancando moderadamente para amplificar el retorno, y **desconectar el
rebalanceo cuando la señal pierde poder predictivo** (gate LEGAR) para evitar
reconstruir cartera en regímenes donde el momentum no discrimina ganadores de
perdedores.

## Universo

- **Acciones del S&P 500 con composición point-in-time** (`data/processed/sp500_membership.csv`):
  cada fecha de rebalanceo sólo es seleccionable lo que pertenecía al índice ese día,
  para reducir *survivorship bias*.
- Histórico cubierto: ~837 tickers a lo largo de 2010–2026 (834 con precio usable).
- **Se excluyen ETFs índice** (SPY/QQQ) del conjunto seleccionable; SPY se usa sólo como benchmark.
- Fuente de precios: EODHD con *fallback* a yfinance (datos prototipo, ver Riesgos).

## Señales de entrada

- **Feature:** `momentum_252_21` = `close[t-21] / close[t-252] - 1`
  (rendimiento de 12 meses saltando el último mes, el clásico "12-1" que evita la reversión de corto plazo).
- Calculado sobre precios ya laggeados (`as_of_lag=1`): sólo usa información disponible **antes** del rebalanceo.
- **Selección:** ranking descendente por momentum → se toman los **top 10**.
- **Restricción sectorial:** máximo 3 nombres por sector (`max_per_sector=3`) para no concentrar todo en un sector ganador.
- **Gate LEGAR (condición de operar):** se calcula un LEGAR rolling (acuerdo entre
  el orden predicho por el momentum y el orden real de retornos, `horizon=21`,
  `smooth_window=63`, laggeado 1 sesión). **Sólo se rebalancea si LEGAR ≥ +0.05.**
  Si el gate está por debajo del umbral en el día de rebalanceo, **no se reconstruye
  cartera** (se mantienen las posiciones previas).

## Señales de salida

- **No hay stop-loss ni trailing stop.** Una posición sólo se vende cuando deja de
  estar en el top-10 en el siguiente rebalanceo trimestral (o por reducción de
  exposición para respetar el cap de apalancamiento).
- Cualquier evento intra-trimestre (earnings, gaps) **se aguanta** hasta el próximo rebalanceo.
- Salida total sólo de forma **manual** (no hay DD-gate automático que liquide la cuenta).

## Frecuencia de rebalanceo

- **Trimestral.** Primer día hábil de enero, abril, julio y octubre.
- El loop diario calcula NAV/exposición todos los días hábiles, pero **sólo envía órdenes en el día de rebalanceo** (y si el gate LEGAR pasa).
- ~4 rebalanceos/año × ~10 órdenes = ~40 trades/año.

## Gross / apalancamiento

- **Gross objetivo: 1.6x** vía margen de Alpaca (long-only, sin cortos).
- Cap duro de apalancamiento `max_gross_leverage = 1.6`; si se supera, el motor
  *desapalanca* vendiendo las posiciones largas mayores.
- Coste de margen modelado a **6.5% anual** sobre el exceso sobre 1x.
- **No se invierte la estrategia ni se va corto** en ningún régimen.

## Tamaño de posiciones

- **Equal weight** entre los 10 nombres seleccionados (peso objetivo ≈ 16% × gross).
- **Acciones enteras** (sin fraccionarios): los nombres caros pueden quedar ligeramente
  infraponderados. Existe la mejora opcional `affordable_substitution` (saltar nombres
  cuyo precio exceda el presupuesto por slot) para evitar el artefacto de "0 acciones".
- Buffer de caja `cash_buffer_pct = 2%`; posición mínima ~$350; orden mínima ~$50.

## Riesgos principales

- **Drawdowns profundos:** el backtest muestra max drawdown de **~-57%** (top-10) — estrategia
  concentrada y apalancada, no apta para perfil conservador.
- **Concentración:** sólo 10 nombres; alta dispersión idiosincrática (visible en el track paper,
  con días de ±8%).
- **Apalancamiento 1.6x:** amplifica pérdidas y añade coste de margen; riesgo de *margin call* en caídas bruscas.
- **Sin stops:** no hay protección intra-trimestre; un crash entre rebalanceos se sufre completo.
- **Riesgo de datos:** EODHD/yfinance son datos prototipo; survivorship bias residual;
  `allow_final_alpha_claims=false`.
- **Slippage overnight:** órdenes market calculadas con `close[t]` pero ejecutadas al `open[t+1]` (~±0.3–0.8%, drag estimado 20–30 bps/año).
- **Riesgo de régimen:** el umbral LEGAR +0.05 se halló en 2015–2026; aún no validado por CPCV/PBO/DSR (es un baseline puntual, no una familia validada).

## Estado operativo actual

- **Modo: Alpaca paper trading** (sin dinero real), loop diario en Docker sobre minipc 24/7.
- Ejecución a las 22:00 UTC (post-cierre NYSE) cada día hábil; notificaciones por Telegram.
- Track en vivo desde **2026-05-27** (ventana muy corta, ruido, no señal).
- Sin stop-loss, sin DD-gate, sin fraccionarios — todo control de riesgo es manual.
- **Decisión de capital real pendiente** de ver 6+ meses de paper coherente con el backtest OOS (revisión en hito mes 6 / mes 12).

## Métricas / backtest relevantes

Backtest LEGAR-gated 2010-01-05 → 2026-05-21 (4113 sesiones, membership point-in-time):

| Métrica | top-10 (config live) | top-5 (variante alta convicción) |
| --- | --- | --- |
| CAGR | **21.1%** | 30.0% |
| Sharpe | 0.65 | 0.73 |
| Sortino | 0.84 | 0.94 |
| Max drawdown | -56.9% | -61.7% |
| Calmar | 0.37 | 0.49 |
| Nº órdenes | 940 | 572 |
| Turnover | 86 | 95 |

Efecto del gate LEGAR (medianas, mismo grid): el gate `thr+0.05` sube CAGR
(~25.5% vs ~19.7%) y reduce el max drawdown (~-59% vs ~-70%) frente a no usar gate.

**Track en vivo (paper, 2026-05-27 → 2026-06-12, 13 días):** retorno acumulado
+4.04% vs SPY -1.16% (+5.20 pp), pero con max drawdown del periodo -17.17% vs -4.49%
de SPY. *Ventana demasiado corta para concluir nada — la estrategia rebalancea trimestralmente.*

---

*Fuentes: `docs/BASELINE_STRONG_MOMENTUM_12_1.md`, `docs/LIVE_DEPLOYMENT.md`,
`reports/top5_vs_top10.md`, `reports/live_vs_benchmark.md`. Métricas sobre datos
prototipo; no son claims finales de alpha.*

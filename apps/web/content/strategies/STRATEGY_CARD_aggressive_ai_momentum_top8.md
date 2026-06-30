# Ficha de estrategia — Aggressive AI Momentum Top8

> Documento operativo para el dashboard de seguimiento. Estrategia en Alpaca paper,
> read-only desde la web. No constituye consejo de inversión.

## Nombre de la estrategia

**Aggressive AI Momentum Top8** (`aggressive_ai_momentum_top8`)

Variante de la familia de momentum explosivo. Frente a la versión concentrada, esta
cuenta opera una cartera más diversificada:

- `top_n = 8`
- gross objetivo aproximado `1.3x`
- long-only
- cuenta Alpaca paper independiente

## Objetivo

Capturar subidas fuertes en acciones con momentum explosivo, manteniendo algo más de
diversificación que las variantes top3/top5. La intención es suavizar concentración
sin abandonar el carácter agresivo de la estrategia.

## Universo y señal

Misma tesis que la estrategia **Aggressive AI Momentum**:

- líderes growth, IA, tecnología y semiconductores;
- ranking cross-sectional por momentum y fuerza relativa;
- ejecución en paper;
- enfoque de validación progresiva, no claim definitivo de alpha.

## Frecuencia de rebalanceo

- Revisión frecuente de señal.
- Rotación por reranking.
- Salidas por pérdida de momentum según configuración del bot.

## Gross / apalancamiento

- Gross objetivo: **1.3x**.
- Long-only, sin cortos.
- Uso de margen moderado frente a variantes de gross superior.

## Riesgos principales

- Alta beta y alta volatilidad.
- Posible concentración temática pese a top8.
- Dependencia de calidad de datos y ejecución paper.
- Track record real todavía corto.

## Estado operativo

Cuenta Alpaca paper añadida al dashboard como cuarta estrategia para seguimiento
comparativo junto a CORE, LEGAR y Aggressive AI Momentum.

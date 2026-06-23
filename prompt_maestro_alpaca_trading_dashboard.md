# PROMPT MAESTRO — Alpaca Trading Command Center

## 0. Cómo debes trabajar

Actúa simultáneamente como:

1. **Desarrollador senior full-stack**, especializado en TypeScript, React, Next.js, Python y APIs financieras.
2. **Arquitecto de sistemas cloud**, con experiencia en Vercel, servicios serverless, procesos persistentes, PostgreSQL, WebSockets, observabilidad y seguridad.
3. **Experto en trading y gestión del riesgo**, capaz de interpretar posiciones, órdenes, ejecuciones, P&L, drawdown, exposición y métricas de rendimiento.
4. **Especialista en ejecución bursátil**, conocedor de órdenes market, limit, stop, stop-limit, trailing stop, bracket, OCO/OTO, sesiones de mercado y restricciones operativas.
5. **Ingeniero de seguridad**, responsable de que ninguna clave, secreto, token, dato de cuenta o acción peligrosa se exponga al navegador, al repositorio o a los logs.
6. **QA lead y DevOps**, responsable de pruebas, CI/CD, documentación, despliegue reproducible y criterios de aceptación.

No te limites a producir una maqueta visual. Debes construir una aplicación real, útil, segura, comprobable y desplegable.

Trabaja **iterativamente, fase por fase**. No intentes implementar todo de una sola vez. Antes de modificar código:

- inspecciona el repositorio;
- consulta la documentación oficial vigente;
- explica el plan inmediato;
- implementa una unidad pequeña y verificable;
- ejecuta lint, typecheck y tests;
- corrige los errores;
- resume los cambios;
- espera confirmación antes de pasar a una fase nueva, salvo que se te indique expresamente que continúes.

Cuando una decisión no esté clara, elige la alternativa más segura y fácil de mantener. Solo pregunta cuando la ambigüedad bloquee realmente el desarrollo.

---

# 1. Objetivo del producto

Construye un **dashboard privado de trading conectado a mi cuenta de Alpaca**, con una experiencia de uso similar a una combinación de:

- panel de broker;
- terminal de mercado;
- analítica de cartera;
- gestor de riesgo;
- diario de operaciones;
- panel de monitorización del sistema.

Nombre provisional:

```text
Alpaca Trading Command Center
```

El dashboard debe permitir inicialmente:

- consultar el estado real de una cuenta Alpaca Paper;
- visualizar cartera, posiciones, órdenes, ejecuciones y actividad;
- consultar datos de mercado históricos y actuales;
- analizar rendimiento y riesgo;
- gestionar watchlists;
- consultar noticias y screeners disponibles en Alpaca;
- preparar y enviar órdenes en **paper trading**, solamente cuando se habilite explícitamente;
- registrar todas las acciones sensibles;
- desplegar preferentemente la aplicación web en **Vercel**.

La primera versión operativa será:

```text
private + single-user + paper-first + equities/ETF + long-only + no overnight
```

No debe incluir inicialmente:

- trading live activado;
- opciones;
- criptomonedas;
- venta en corto;
- apalancamiento deliberado;
- operativa overnight;
- ejecución automática de estrategias;
- recomendaciones de inversión generadas por IA.

Deja una arquitectura extensible para incorporar estos elementos más adelante, pero no los actives.

---

# 2. Principios no negociables

## 2.1 Seguridad de credenciales

Las claves de Alpaca nunca deben:

- aparecer en el código;
- incluirse en Git;
- enviarse al navegador;
- estar en variables `NEXT_PUBLIC_*`;
- aparecer en logs, trazas, errores, screenshots o respuestas HTTP;
- almacenarse en localStorage, sessionStorage o IndexedDB;
- mostrarse total o parcialmente en la interfaz.

Usa variables de entorno server-side:

```bash
ALPACA_API_KEY=
ALPACA_API_SECRET=
ALPACA_ENV=paper
ALPACA_DATA_FEED=iex
```

Crea:

```text
.env.example
```

solo con nombres y valores ficticios. Añade `.env*` al `.gitignore`, excepto `.env.example`.

Valida las variables de entorno al arrancar mediante un esquema tipado. La aplicación debe fallar de forma segura y con un mensaje útil si falta una configuración obligatoria.

## 2.2 Paper trading como valor predeterminado

El valor predeterminado debe ser:

```bash
ALPACA_ENV=paper
TRADING_MODE=read_only
```

Estados posibles:

```text
read_only
paper_enabled
live_locked
live_enabled
```

Requisitos:

- `read_only`: no existe ninguna ruta capaz de enviar, reemplazar o cancelar órdenes.
- `paper_enabled`: permite operaciones solo contra Alpaca Paper.
- `live_locked`: puede mostrar una cuenta live, pero no operar.
- `live_enabled`: no debe implementarse ni activarse hasta una fase independiente de hardening, revisión manual y aprobación expresa.

Añade un distintivo visual permanente y muy visible:

```text
PAPER / LIVE
READ ONLY / TRADING ENABLED
```

## 2.3 Sin falsas garantías

No presentar métricas, señales o estadísticas como garantía de rentabilidad. Diferenciar claramente:

- datos;
- cálculos;
- estimaciones;
- señales;
- decisiones manuales;
- errores o datos incompletos.

## 2.4 Precisión financiera

- Usa `Decimal`, enteros escalados o una librería decimal; no uses aritmética monetaria ingenua con `number`.
- Conserva los valores originales recibidos de Alpaca.
- Almacena tiempos en UTC.
- Muestra tiempos de mercado también en `America/New_York`.
- Muestra la interfaz principal en `Europe/Madrid`.
- Documenta todos los redondeos.
- No mezcles P&L realizado y no realizado.
- No confundas cash, equity, portfolio value, buying power y market value.
- Indica la frescura del dato y el feed utilizado.

---

# 3. Investigación obligatoria antes de programar

Antes de fijar dependencias o endpoints:

1. Revisa la documentación oficial actual de:
   - Alpaca Trading API;
   - Alpaca Market Data API;
   - Alpaca WebSocket streams;
   - Alpaca Paper Trading;
   - SDK oficial `alpaca-py`;
   - Vercel Functions, límites, Cron Jobs y variables sensibles;
   - Next.js App Router;
   - Lightweight Charts.
2. Confirma:
   - endpoints actuales;
   - versiones compatibles;
   - límites y restricciones del plan;
   - disponibilidad de IEX, SIP u otros feeds;
   - tipos de órdenes válidos;
   - restricciones de extended hours;
   - campos de account, position, order, activity y portfolio history.
3. No inventes campos de API.
4. No uses tutoriales antiguos como autoridad si contradicen la documentación oficial.
5. Registra decisiones relevantes en:

```text
docs/DECISIONS.md
docs/API_CAPABILITIES.md
```

---

# 4. Arquitectura propuesta

Construye un monorepo limpio. Usa `pnpm`.

```text
/
├─ apps/
│  ├─ web/                   # Next.js desplegado en Vercel
│  └─ stream-worker/         # Worker persistente opcional/recomendado
├─ packages/
│  ├─ alpaca-client/         # Clientes REST, DTOs, mappers, errores
│  ├─ trading-domain/        # Riesgo, P&L, sizing, métricas
│  ├─ shared/                # Esquemas, tipos y utilidades
│  ├─ ui/                    # Componentes reutilizables
│  └─ config/                # ESLint, TSConfig, tooling
├─ db/
│  ├─ migrations/
│  └─ seeds/
├─ docs/
├─ tests/
├─ .github/workflows/
├─ .env.example
├─ docker-compose.yml
├─ pnpm-workspace.yaml
└─ README.md
```

## 4.1 Aplicación web

Tecnologías preferidas:

- Next.js con App Router;
- TypeScript en modo estricto;
- React;
- Tailwind CSS;
- shadcn/ui o componentes accesibles equivalentes;
- TanStack Query;
- TanStack Table;
- Zod;
- Lightweight Charts para gráficos financieros;
- Recharts o una librería similar para analítica no financiera;
- React Hook Form;
- Vitest;
- Playwright;
- ESLint y Prettier.

Evita dependencias innecesarias. Antes de añadir una librería, justifica qué problema resuelve.

## 4.2 Persistencia

Usa PostgreSQL compatible con despliegue serverless. Preferencia:

```text
Neon Postgres mediante integración de Vercel
```

Usa Drizzle ORM o Prisma, seleccionando una sola opción y documentando el motivo.

La base de datos no debe sustituir a Alpaca como fuente de verdad de cuenta. Debe almacenar:

- snapshots normalizados;
- caché persistente;
- preferencias;
- watchlists locales;
- alertas;
- diario;
- etiquetas;
- notas;
- configuraciones;
- auditoría;
- métricas calculadas;
- estado de sincronización.

## 4.3 Dos modos de tiempo real

### Modo A — Vercel puro

Debe funcionar sin worker persistente:

- Next.js en Vercel;
- datos REST bajo demanda;
- polling controlado;
- caché;
- sincronizaciones programadas;
- refresco manual;
- sin prometer streaming continuo.

Debe ser la primera arquitectura funcional.

### Modo B — Híbrido recomendado

Para WebSockets reales:

- web y APIs HTTP en Vercel;
- pequeño worker persistente en Railway, Render, Fly.io o servicio equivalente;
- worker conectado a los WebSockets de Alpaca;
- reconexión automática;
- heartbeat;
- backoff exponencial;
- resuscripción;
- deduplicación;
- publicación de eventos saneados;
- navegador conectado al worker con token efímero firmado;
- ninguna credencial de Alpaca en el cliente.

El worker puede usar:

- Python;
- FastAPI;
- `alpaca-py`;
- WebSocket propio;
- PostgreSQL compartido;
- Redis opcional si aporta valor real.

No añadas Redis por inercia. Incorpóralo solo si es necesario para pub/sub, rate limiting o coordinación.

## 4.4 Autenticación

Es una aplicación privada de un solo usuario.

Implementa autenticación robusta mediante Auth.js o una solución mantenida equivalente.

Requisitos:

- usuario administrador único;
- allowlist por email;
- cookie `httpOnly`, `secure`, `sameSite`;
- sesiones con expiración;
- cierre de sesión;
- protección de todas las páginas y APIs privadas;
- rate limiting en login;
- CSRF/origin checks en mutaciones;
- no permitir registro público.

Variables orientativas:

```bash
AUTH_SECRET=
ADMIN_EMAIL=
ADMIN_PASSWORD_HASH=
ALLOWED_EMAILS=
```

No guardes una contraseña en texto plano.

---

# 5. Modelo de integración con Alpaca

Crea una capa anticorrupción: la UI nunca debe depender directamente de las respuestas crudas de Alpaca.

Capas:

```text
Alpaca HTTP/WebSocket
        ↓
DTO externo
        ↓
mapper validado
        ↓
modelo de dominio interno
        ↓
servicio de aplicación
        ↓
API/UI
```

## 5.1 Capacidades que deben integrarse

### Trading y cuenta

- account;
- account configuration;
- market clock;
- market calendar;
- assets;
- positions;
- orders;
- order by ID;
- replace order;
- cancel order;
- portfolio history;
- account activities;
- watchlists;
- trade updates stream.

### Market Data

- historical bars;
- latest bars;
- trades;
- quotes;
- snapshots;
- realtime stock stream;
- historical news;
- realtime news, si el plan lo permite;
- market movers;
- most active stocks;
- corporate actions.

Cada capacidad debe declarar:

- endpoint o SDK usado;
- plan requerido;
- caché;
- frecuencia de refresco;
- manejo de errores;
- estado de dato retrasado/no disponible.

## 5.2 Resiliencia

Implementa:

- timeout explícito;
- cancelación;
- retry solo en errores transitorios;
- backoff exponencial con jitter;
- respeto a `Retry-After`;
- circuit breaker básico;
- protección contra thundering herd;
- deduplicación de peticiones;
- caché por endpoint;
- errores tipados;
- correlation ID;
- mensajes de UI comprensibles;
- fallback al último dato válido con indicador de obsolescencia.

No reintentes automáticamente:

- errores de validación;
- órdenes rechazadas;
- errores 4xx no transitorios;
- mutaciones financieras ambiguas.

## 5.3 Idempotencia

Toda orden debe llevar un `client_order_id` único y trazable.

Guarda:

- payload solicitado;
- validaciones;
- usuario;
- timestamp;
- respuesta;
- estado;
- errores;
- correlation ID.

Ante un timeout después de enviar una orden, no vuelvas a enviarla a ciegas. Primero reconcilia por `client_order_id`.

---

# 6. Navegación y experiencia de usuario

Interfaz:

- desktop-first;
- responsive;
- accesible;
- modo oscuro y claro;
- locale principal `es-ES`;
- textos técnicos claros;
- navegación lateral;
- command palette;
- buscador global de símbolos;
- estados de loading mediante skeletons;
- empty states útiles;
- errores recuperables;
- tooltips;
- atajos de teclado documentados.

No uses exclusivamente rojo y verde para expresar pérdidas y ganancias. Añade iconos, signos y texto.

Rutas propuestas:

```text
/dashboard
/portfolio
/positions
/orders
/trade
/markets
/symbol/[symbol]
/watchlists
/analytics
/journal
/risk
/alerts
/settings
/system
```

---

# 7. Pantallas y funcionalidades

## 7.1 Dashboard principal

Debe ofrecer una vista ejecutiva inmediata.

### Cabecera de estado

- entorno PAPER/LIVE;
- modo READ ONLY/TRADING ENABLED;
- mercado abierto/cerrado;
- siguiente apertura/cierre;
- hora de Nueva York;
- hora de Madrid;
- estado REST;
- estado WebSocket;
- feed de datos;
- última actualización;
- botón de refresco;
- indicador de datos stale.

### Tarjetas principales

- equity;
- cash;
- buying power;
- portfolio value;
- long market value;
- short market value, aunque inicialmente sea cero;
- P&L diario;
- P&L no realizado;
- P&L realizado;
- cambio diario porcentual;
- número de posiciones;
- órdenes abiertas;
- day trade count;
- exposición;
- drawdown actual.

### Gráficos

- curva de equity;
- benchmark SPY y QQQ opcional;
- drawdown;
- distribución de cartera;
- P&L diario;
- exposición/cash;
- evolución de buying power.

Rangos:

```text
1D / 5D / 1M / 3M / YTD / 1Y / ALL
```

### Bloques operativos

- posiciones con mayor ganancia/pérdida;
- órdenes abiertas;
- ejecuciones recientes;
- alertas;
- noticias relacionadas con posiciones;
- movimientos de watchlist;
- resumen de riesgo;
- estado del sistema.

## 7.2 Portfolio

- curva de equity;
- curva de cash;
- benchmark;
- drawdown;
- tabla de retornos;
- retornos diarios, semanales y mensuales;
- calendario de P&L;
- heatmap mensual;
- distribución por activo;
- peso de cada posición;
- concentración top 1, top 3 y top 5;
- turnover;
- exposición media;
- rendimiento con y sin flujos externos;
- depósitos y retiradas separados del rendimiento;
- exportación CSV.

No atribuyas depósitos a rentabilidad.

## 7.3 Posiciones

Tabla con:

- símbolo;
- nombre;
- asset class;
- exchange;
- side;
- cantidad;
- fraccional o entera;
- precio medio;
- último precio;
- bid/ask;
- spread;
- cost basis;
- market value;
- peso;
- cambio diario;
- P&L diario;
- P&L total;
- P&L porcentual;
- ATR;
- stop configurado;
- distancia al stop;
- riesgo estimado;
- fecha aproximada de apertura;
- acciones.

Funciones:

- ordenar;
- filtrar;
- ocultar columnas;
- guardar vistas;
- abrir detalle;
- añadir nota;
- establecer alerta;
- cerrar parcialmente;
- cerrar completamente;
- cancelar órdenes vinculadas.

Las acciones de cierre requieren confirmación reforzada.

## 7.4 Órdenes y ejecuciones

Pestañas:

```text
Open / Pending / Filled / Canceled / Rejected / All
```

Columnas:

- hora;
- símbolo;
- side;
- tipo;
- TIF;
- cantidad;
- filled quantity;
- limit;
- stop;
- trailing;
- promedio de ejecución;
- estado;
- extended hours;
- client order ID;
- origen;
- estrategia/tag;
- mensaje de rechazo.

Incluye:

- timeline por orden;
- cancelación;
- replace;
- filtros;
- detalles crudos saneados;
- exportación;
- reconciliación con fills;
- latencia aproximada de submit a fill;
- slippage frente a bid/ask o señal, cuando pueda calcularse.

## 7.5 Ticket de órdenes

Soporte progresivo:

1. market;
2. limit;
3. stop;
4. stop-limit;
5. trailing stop;
6. bracket;
7. OCO/OTO si Alpaca lo permite para el activo y entorno.

Campos:

- símbolo;
- buy/sell;
- shares/notional;
- order type;
- price;
- stop;
- trail percent/price;
- TIF;
- extended hours;
- take profit;
- stop loss;
- tag/setup;
- nota;
- riesgo máximo.

Antes de habilitar “Enviar”:

- validar que el mercado y sesión son compatibles;
- validar asset tradable;
- validar fractionable;
- validar buying power;
- validar cantidad y precisión;
- validar límites internos;
- calcular notional;
- calcular pérdida estimada hasta stop;
- calcular peso resultante;
- advertir de concentración;
- mostrar resumen completo;
- requerir confirmación.

El botón final debe indicar claramente:

```text
Enviar orden PAPER
```

No usar textos ambiguos.

## 7.6 Detalle de símbolo

### Gráfico principal

Candlesticks con:

```text
1m / 5m / 15m / 30m / 1h / 1D
```

Rangos:

```text
1D / 5D / 1M / 3M / 6M / 1Y / 5Y
```

Capas opcionales:

- volumen;
- SMA 20/50/200;
- EMA 9/21;
- VWAP;
- RSI 14;
- MACD;
- ATR 14;
- Bollinger Bands;
- premarket high/low;
- previous day high/low;
- apertura;
- órdenes;
- fills;
- stops;
- alertas;
- corporate actions.

No recalcules toda la serie para cada tick. Usa actualización incremental.

### Información lateral

- último;
- bid/ask;
- spread;
- OHLC;
- volumen;
- average volume si está disponible;
- posición actual;
- órdenes abiertas;
- buying power estimado;
- asset status;
- tradable;
- fractionable;
- shortable, solo informativo;
- marginable, solo informativo;
- session;
- noticias;
- corporate actions.

## 7.7 Markets

- market clock;
- principales benchmarks;
- top gainers;
- top losers;
- most active by volume;
- most active by trade count;
- premarket/after-hours cuando el feed lo permita;
- noticias;
- filtros;
- acceso al detalle del símbolo;
- botón para watchlist.

Indica si el screener depende de SIP u otro plan.

## 7.8 Watchlists

Soporta:

- watchlists de Alpaca;
- watchlists locales con metadata adicional;
- crear;
- renombrar;
- eliminar;
- añadir/quitar símbolos;
- ordenar manualmente;
- notas;
- tags;
- alertas;
- columnas configurables;
- sparkline;
- último precio;
- cambio;
- volumen;
- spread;
- noticias recientes.

## 7.9 Analytics

Calcula con metodología documentada:

- retorno acumulado;
- CAGR cuando el periodo sea suficiente;
- volatilidad anualizada;
- Sharpe;
- Sortino;
- Calmar;
- max drawdown;
- current drawdown;
- recovery time;
- win rate;
- loss rate;
- profit factor;
- expectancy;
- average win;
- average loss;
- payoff ratio;
- best/worst trade;
- best/worst day;
- rachas;
- holding time;
- turnover;
- exposure;
- slippage;
- P&L por símbolo;
- P&L por día de semana;
- P&L por hora;
- P&L por setup;
- P&L long/short, aunque short esté desactivado;
- comparación SPY/QQQ.

Muestra:

- fórmula;
- ventana;
- frecuencia;
- muestra;
- limitaciones.

No muestres Sharpe o CAGR como significativos cuando haya pocos datos.

## 7.10 Diario de trading

Importa automáticamente fills y reconstruye operaciones.

Permite:

- agrupar fills en trades;
- metodología FIFO documentada;
- editar apertura/cierre lógico;
- setup;
- catalyst;
- timeframe;
- plan;
- stop;
- target;
- riesgo previsto;
- resultado;
- MFE;
- MAE;
- slippage;
- notas;
- errores;
- emoción;
- disciplina;
- screenshot;
- tags;
- puntuación;
- lección aprendida.

Incluye:

- buscador;
- filtros;
- calendario;
- estadísticas por tag;
- exportación Markdown/CSV.

El screenshot puede usar Vercel Blob o almacenamiento equivalente, de forma privada.

## 7.11 Risk Center

Panel específico con:

- exposición bruta y neta;
- porcentaje invertido;
- cash buffer;
- buying power;
- concentración;
- riesgo por posición;
- riesgo total estimado;
- drawdown;
- daily loss;
- límites configurados;
- utilización de límites;
- alertas;
- stress test simple;
- kill switch.

Límites iniciales configurables:

```bash
RISK_MAX_POSITION_PCT=25
RISK_MAX_TOTAL_EXPOSURE_PCT=100
RISK_MAX_RISK_PER_TRADE_PCT=0.50
RISK_MAX_DAILY_LOSS_PCT=2
RISK_MAX_OPEN_POSITIONS=8
RISK_ALLOW_SHORTS=false
RISK_ALLOW_OPTIONS=false
RISK_ALLOW_CRYPTO=false
RISK_ALLOW_EXTENDED_HOURS=false
RISK_ALLOW_OVERNIGHT=false
```

No asumas que estos valores son adecuados para todos. Son defaults de seguridad editables.

## 7.12 Alertas

Tipos:

- precio cruza nivel;
- variación porcentual;
- volumen;
- spread;
- P&L posición;
- P&L diario;
- drawdown;
- buying power;
- orden filled;
- orden partial fill;
- orden rejected;
- desconexión del stream;
- dato stale;
- mercado abre/cierra;
- corporate action;
- noticia de símbolo en cartera/watchlist.

Canales:

- in-app;
- email opcional;
- Telegram opcional.

Variables opcionales:

```bash
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
```

## 7.13 System

Debe mostrar:

- versión;
- commit;
- entorno;
- región;
- uptime lógico;
- salud de APIs;
- salud de base de datos;
- estado del worker;
- WebSocket;
- última sincronización;
- jobs;
- errores recientes saneados;
- latencias;
- rate-limit state;
- data feed;
- feature flags.

Endpoints:

```text
/api/health/live
/api/health/ready
```

No deben revelar secretos.

---

# 8. Gestión de riesgo y protección operativa

## 8.1 Pre-trade risk checks

Toda orden debe pasar por un motor de validación central:

1. modo de trading;
2. entorno paper/live;
3. usuario autenticado;
4. kill switch;
5. mercado/sesión;
6. activo válido;
7. side permitido;
8. tipo de orden permitido;
9. notional;
10. buying power;
11. max position size;
12. max exposure;
13. max open positions;
14. max risk per trade;
15. daily loss limit;
16. duplicate order;
17. stale quote;
18. spread excesivo configurable;
19. confirmación del usuario.

Devuelve una lista estructurada:

```ts
type RiskCheck = {
  code: string;
  severity: "info" | "warning" | "block";
  passed: boolean;
  message: string;
  value?: string;
  limit?: string;
};
```

## 8.2 Kill switch

Implementa:

- bloquear nuevas órdenes;
- opcionalmente cancelar órdenes abiertas;
- no liquidar posiciones automáticamente por defecto;
- registrar quién, cuándo y por qué;
- mostrar un banner global.

La liquidación total debe ser una acción separada, especialmente protegida y no implementarse en la primera iteración.

## 8.3 Protección live

Aunque exista soporte futuro:

- live debe estar desactivado en código mediante feature flag;
- requiere variables específicas;
- requiere verificación del account endpoint;
- requiere aceptación manual;
- requiere una frase de confirmación;
- requiere límite de notional live;
- requiere revisión independiente de seguridad;
- no debe activarse durante este proyecto salvo instrucción expresa posterior.

---

# 9. Cálculo de rendimiento y reconstrucción de operaciones

Crea servicios de dominio puros y testeados.

## 9.1 Equity y retornos

Distingue:

- equity;
- cash;
- market value;
- depósitos;
- retiradas;
- dividendos;
- intereses;
- fees;
- P&L realizado;
- P&L no realizado.

Cuando haya flujos externos:

- muestra retorno simple;
- calcula una métrica ajustada por flujos cuando sea posible;
- documenta el método;
- no inventes rentabilidad si faltan datos.

## 9.2 Trades

Reconstruye round trips a partir de fills:

- orden cronológico;
- FIFO como default;
- soporte partial fills;
- soporte scale-in/scale-out;
- timestamps;
- comisiones/fees si existen;
- slippage;
- MFE/MAE usando market data;
- duración;
- tags manuales.

Todos los cálculos deben tener tests con casos borde.

---

# 10. Integraciones opcionales y abstracción de proveedores

La aplicación debe funcionar solo con Alpaca.

Diseña interfaces para proveedores adicionales:

```ts
interface FundamentalsProvider {}
interface NewsProvider {}
interface FxProvider {}
interface NotificationsProvider {}
```

Integra EODHD únicamente si existe:

```bash
EODHD_API_KEY=
```

Usos opcionales:

- fundamentales;
- sector/industria;
- calendario;
- noticias adicionales;
- datos históricos complementarios.

Reglas:

- Alpaca sigue siendo la fuente de verdad para cuenta y órdenes;
- identifica la fuente de cada dato;
- no mezcles valores de dos feeds sin indicarlo;
- el fallo de EODHD no debe romper el dashboard;
- nunca acoples la UI a un proveedor concreto.

---

# 11. Seguridad de aplicación

Implementa como mínimo:

- autenticación;
- autorización;
- validación Zod;
- CSP;
- HSTS;
- secure headers;
- cookies seguras;
- CSRF/origin validation;
- rate limiting;
- protección de rutas;
- sanitización;
- no secretos en cliente;
- no secretos en logs;
- bloqueo de stack traces en producción;
- dependabot o Renovate;
- auditoría de dependencias;
- secret scanning;
- CodeQL;
- protección contra clickjacking;
- límites de payload;
- timeouts;
- control de CORS;
- auditoría de mutaciones;
- cifrado en tránsito;
- mínimos privilegios.

Añade:

```text
docs/SECURITY.md
docs/THREAT_MODEL.md
```

El threat model debe cubrir:

- robo de credenciales;
- XSS;
- CSRF;
- sesión secuestrada;
- exposición en logs;
- replay de orden;
- doble envío;
- dependencia comprometida;
- WebSocket no autorizado;
- usuario accediendo a live por error;
- dato stale usado para operar.

---

# 12. Observabilidad

Implementa:

- logs JSON estructurados;
- niveles;
- request ID;
- correlation ID;
- métricas básicas;
- health checks;
- error tracking opcional;
- panel de estado;
- medición de latencia;
- contador de errores Alpaca;
- reconexiones;
- fallos de jobs;
- datos stale;
- auditoría.

No registres:

- API keys;
- secrets;
- cookies;
- auth headers;
- payload completo de credenciales;
- información innecesaria de cuenta.

---

# 13. Testing

## 13.1 Unit tests

Cobertura prioritaria:

- mappers;
- schemas;
- money/decimal;
- P&L;
- returns;
- drawdown;
- risk checks;
- position sizing;
- order validation;
- reconstruction FIFO;
- timezone;
- stale data;
- idempotency;
- feature flags.

## 13.2 Integration tests

- Alpaca client con fixtures;
- errores 401/403/422/429/5xx;
- timeout;
- retry;
- pagination;
- partial fills;
- rejected orders;
- portfolio history vacío;
- mercado cerrado;
- base de datos;
- auth;
- audit log.

Las fixtures deben estar totalmente saneadas.

## 13.3 E2E

Playwright:

- login;
- dashboard;
- cambio de rango;
- posiciones;
- filtros de órdenes;
- detalle de símbolo;
- watchlist;
- journal;
- risk center;
- read-only blocking;
- paper order review;
- cancel dialog;
- permisos;
- responsive.

## 13.4 Contract tests

Mantén snapshots de contratos externos saneados y detecta cambios incompatibles.

## 13.5 Smoke tests contra Paper

No envíes órdenes automáticamente.

Solo cuando:

```bash
ALLOW_PAPER_ORDER_TESTS=true
```

podrás ejecutar un test manual y explícito de crear/cancelar una orden Paper. Antes de hacerlo:

- mostrar el payload;
- pedir confirmación;
- usar un notional mínimo configurable;
- verificar que el mercado y activo son compatibles;
- reconciliar el resultado.

---

# 14. CI/CD

GitHub Actions:

1. install;
2. lint;
3. typecheck;
4. unit tests;
5. integration tests;
6. build;
7. Playwright;
8. dependency audit;
9. secret scan;
10. deploy preview.

Ramas:

```text
main
develop opcional
feature/*
```

No desplegar producción si falla cualquier quality gate.

Añade:

- preview deployments;
- migraciones controladas;
- rollback documentado;
- changelog;
- release notes.

---

# 15. Despliegue

## 15.1 Aplicación web

Objetivo:

```text
Vercel
```

Configura:

- variables sensibles;
- producción/preview separadas;
- dominio;
- deployment protection cuando proceda;
- región cercana adecuada sin romper el acceso a Alpaca;
- logs;
- cron;
- límites;
- health checks.

## 15.2 Base de datos

Provisiona PostgreSQL mediante una integración actual de Vercel Marketplace, preferentemente Neon.

Incluye:

- migraciones;
- pooling serverless;
- backups;
- retención;
- procedimiento de restore.

## 15.3 Worker

Despliega solo a partir de la fase de tiempo real.

Debe incluir:

- Dockerfile;
- health check;
- restart policy;
- variables separadas;
- TLS;
- autenticación;
- límites de conexiones;
- observabilidad;
- reconexión;
- graceful shutdown.

## 15.4 Cron jobs

Jobs candidatos:

- snapshot de cuenta;
- sincronización de activities;
- reconciliación de órdenes;
- importación de fills;
- cierre diario;
- recomputación de métricas;
- limpieza de caché;
- verificación de alertas no realtime;
- backup lógico.

Adapta la frecuencia al plan real de Vercel. Protege los endpoints cron con secreto.

---

# 16. Rendimiento

Objetivos:

- dashboard útil antes de cargar todos los módulos;
- server components donde convenga;
- client components solo donde sean necesarios;
- lazy loading de gráficos;
- virtualización para tablas grandes;
- paginación;
- consultas indexadas;
- caching;
- no refrescar endpoints costosos sin necesidad;
- no descargar años de bars para una vista intradía;
- downsampling si es necesario;
- evitar re-render masivo por cada tick.

Mide y documenta:

- LCP;
- latencia de API;
- tiempo de primera carga;
- tamaño de bundle;
- tiempo de render de charts;
- frecuencia de polling.

---

# 17. Feature flags

Implementa flags tipadas:

```text
ENABLE_TRADING
ENABLE_LIVE_VIEW
ENABLE_LIVE_TRADING
ENABLE_REALTIME_WORKER
ENABLE_NEWS
ENABLE_SCREENERS
ENABLE_JOURNAL
ENABLE_EODHD
ENABLE_TELEGRAM
ENABLE_OPTIONS
ENABLE_CRYPTO
ENABLE_SHORTS
ENABLE_EXTENDED_HOURS
ENABLE_STRATEGY_LAB
```

Defaults seguros:

```text
false
```

salvo módulos read-only básicos.

---

# 18. Fases de implementación

## Fase 0 — Discovery y diseño

Entregables:

- auditoría del repositorio;
- documentación oficial revisada;
- arquitectura;
- ADRs;
- modelo de amenazas;
- mapa de endpoints;
- esquema de datos;
- wireframe textual;
- backlog;
- variables de entorno;
- criterios de aceptación.

No programes funcionalidades complejas todavía.

Cierre:

- decisiones explícitas;
- sin dudas críticas;
- plan aprobado.

## Fase 1 — Foundation

Implementa:

- monorepo;
- Next.js;
- tooling;
- tema;
- layout;
- auth;
- env validation;
- database;
- CI;
- health checks;
- Alpaca connection test;
- modo read-only.

Pantalla mínima útil:

- account;
- market clock;
- equity;
- cash;
- buying power;
- estado de conexión.

Cierre:

- deploy preview funcional;
- secrets seguros;
- tests verdes.

## Fase 2 — Portfolio, posiciones y órdenes read-only

Implementa:

- portfolio history;
- positions;
- orders;
- activities;
- tablas;
- filtros;
- equity chart;
- caché;
- errores;
- exportación.

Cierre:

- datos reales de Paper visibles y reconciliados.

## Fase 3 — Market workspace

Implementa:

- búsqueda;
- symbol detail;
- historical bars;
- snapshots;
- quotes;
- candlesticks;
- volumen;
- indicadores;
- watchlists;
- movers;
- most active;
- news;
- corporate actions.

Cierre:

- gráfico robusto;
- estados de feed y frescura.

## Fase 4 — Paper trading protegido

Implementa:

- ticket;
- risk engine;
- review;
- confirmación;
- create/cancel/replace;
- idempotency;
- audit;
- kill switch;
- `paper_enabled`.

Cierre:

- test manual controlado en Paper;
- cero rutas live operables.

## Fase 5 — Analytics y journal

Implementa:

- reconstrucción de trades;
- métricas;
- heatmaps;
- drawdown;
- benchmark;
- journal;
- tags;
- notas;
- exportación.

Cierre:

- metodología documentada y testeada.

## Fase 6 — Tiempo real híbrido

Implementa:

- worker;
- streams;
- reconexión;
- token efímero;
- broadcast saneado;
- realtime charts;
- trade updates;
- estado del stream.

Cierre:

- recuperación después de desconexión;
- sin secretos en cliente.

## Fase 7 — Alertas e integraciones opcionales

Implementa:

- alerts engine;
- Telegram;
- EODHD opcional;
- provider interfaces;
- jobs.

Cierre:

- degradación elegante sin proveedores opcionales.

## Fase 8 — Hardening y producción

- pentest básico;
- threat model final;
- load test;
- accessibility;
- observability;
- backups;
- restore drill;
- runbook;
- deployment;
- manual de usuario.

Cierre:

- checklist firmado;
- paper estable.

## Fase 9 — Live readiness, sin activación

Prepara únicamente:

- checklist;
- límites;
- doble confirmación;
- rollback;
- incident response;
- notional cap;
- shadow mode.

No actives live.

## Fase 10 — Strategy Lab opcional

Solo después del dashboard estable.

Objetivo:

- visualizar señales, no autoejecutarlas;
- event/catalyst + context + technical confirmation + risk;
- ORB 5/15;
- VWAP reclaim/pullback;
- premarket high breakout;
- relative strength vs SPY/QQQ;
- backtest separado;
- shadow mode;
- explicación y trazabilidad.

No mezclar señales experimentales con el núcleo de órdenes.

---

# 19. Documentación obligatoria

Crea y mantén:

```text
README.md
docs/ARCHITECTURE.md
docs/DECISIONS.md
docs/API_CAPABILITIES.md
docs/SECURITY.md
docs/THREAT_MODEL.md
docs/RISK_MODEL.md
docs/METRICS.md
docs/DEPLOYMENT.md
docs/RUNBOOK.md
docs/TESTING.md
docs/USER_GUIDE.md
docs/CHANGELOG.md
docs/TASKS.md
```

El README debe permitir a una persona nueva:

1. clonar;
2. instalar;
3. configurar `.env`;
4. arrancar;
5. probar;
6. desplegar.

---

# 20. Contrato de trabajo para cada iteración

Al inicio de cada iteración responde con:

```text
FASE:
OBJETIVO:
ARCHIVOS A INSPECCIONAR:
CAMBIOS PROPUESTOS:
RIESGOS:
PRUEBAS:
CRITERIO DE CIERRE:
```

Después de implementar responde con:

```text
IMPLEMENTADO:
ARCHIVOS MODIFICADOS:
COMANDOS EJECUTADOS:
RESULTADO DE LINT:
RESULTADO DE TYPECHECK:
RESULTADO DE TESTS:
RESULTADO DE BUILD:
RIESGOS PENDIENTES:
DECISIONES TOMADAS:
SIGUIENTE PASO PROPUESTO:
```

Reglas:

- No afirmes que algo funciona si no lo has ejecutado.
- No ocultes tests fallidos.
- No desactives tests para conseguir verde.
- No uses `any` sin justificación.
- No dejes TODOs silenciosos.
- No añadas mocks en producción.
- No cambies de arquitectura sin registrar la decisión.
- No borres trabajo previo sin explicar el motivo.
- Realiza commits lógicos si tienes acceso a Git.
- Para cambios visuales, genera screenshot o describe cómo verificarlo.
- Detente al final de cada fase.

---

# 21. Criterios globales de aceptación

El proyecto se considera aceptable cuando:

- conecta con Alpaca Paper;
- muestra datos reales de cuenta;
- las credenciales permanecen server-side;
- funciona desplegado en Vercel;
- soporta read-only;
- las mutaciones paper están bloqueadas por defecto;
- no existe ejecución live accidental;
- portfolio, posiciones, órdenes y actividad están reconciliados;
- los gráficos son interactivos;
- las tablas son filtrables;
- el riesgo se calcula antes de una orden;
- las acciones sensibles se auditan;
- hay tests;
- CI está verde;
- hay documentación;
- existe monitorización;
- los fallos de Alpaca se muestran correctamente;
- los datos stale se identifican;
- la interfaz es útil en desktop y móvil;
- el sistema puede degradarse de realtime a polling;
- el modo paper se distingue visualmente en todo momento.

---

# 22. Primera instrucción

Empieza ahora por la **Fase 0**.

No escribas todavía toda la aplicación.

Realiza:

1. inspección del repositorio;
2. comprobación de herramientas instaladas;
3. revisión de documentación oficial;
4. propuesta de arquitectura definitiva;
5. árbol de carpetas;
6. listado de dependencias con justificación;
7. variables de entorno;
8. modelo de datos inicial;
9. mapa de endpoints;
10. plan de fases;
11. riesgos;
12. criterios de cierre.

Termina mostrando el plan y esperando mi aprobación para iniciar la Fase 1.

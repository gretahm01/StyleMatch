# StyleMatch AI

Proyecto académico con React, TypeScript, Tailwind CSS 4 y Express. La carga y el análisis de fotografías continúan sin cambios: la imagen se procesa en memoria y nunca se guarda permanentemente.

## Perfil y recomendaciones personalizadas

Antes del análisis puedes guardar, sin registro ni correo, un alias opcional y preferencias de estilos, colores favoritos, colores a evitar y materiales. El navegador crea un UUID local no sensible en `localStorage`; el perfil se guarda en SQLite en `backend/data/stylematch.db`. Solo se persisten esas preferencias y el UUID, nunca fotografías. Puedes actualizarlo pulsando **Guardar gustos** o eliminarlo con **Eliminar datos**.

El formulario diferencia Moda y Hogar: en Moda hay estilos visuales, prioridades, cortes y estampados; en Hogar se muestran estilos decorativos y materiales, sin campos de prendas. Los estilos por categoría se guardan por separado. Los perfiles existentes conservan `preferredStyles` y el motor los usa como compatibilidad cuando aún no se han elegido estilos nuevos.

También se selecciona una ocasión compatible con Moda u Hogar y un rango opcional en MXN. El selector **Productos a recomendar** permite elegir entre solo artículos verificados de tiendas reales o incluir DEMO cuando falten alternativas. Después de Gemini (o del resultado DEMO), el botón **Actualizar recomendaciones** usa el análisis que permanece solo en memoria de la sesión: no reenvía la fotografía ni realiza otra consulta a Gemini. El backend aplica disponibilidad y presupuesto antes de puntuar, normaliza equivalencias de color/estilo, evita subcategorías repetidas y devuelve hasta tres productos.

La puntuación determinista es: compatibilidad visual 35% (color, estilo y material probable), gustos 30%, ocasión 20% y complementariedad 15%. Si no hay tres candidatos compatibles, se devuelven menos y se explica la causa. El modo DEMO sigue identificado visualmente y no contacta Gemini.

## Evaluaciones y aprendizaje local

Cada tarjeta recomendada permite calificar de 1 a 5 estrellas, marcar favorito o indicar **No me interesa**. La retroalimentación se guarda en `product_feedback` de SQLite, con una sola fila por combinación de perfil local y producto. Puedes consultar y borrar las evaluaciones desde **Mis evaluaciones**.

Las preferencias explícitas del formulario nunca se modifican. Con dos o más productos evaluados, el sistema calcula señales moderadas de colores, estilos, materiales y subcategorías: 4–5 estrellas y favoritos suman; 1–2 estrellas y “No me interesa” restan. Esas señales solo ajustan la parte de gustos, que sigue limitada a 30 puntos. Un solo producto evaluado se muestra como evidencia insuficiente y no modifica el ranking. Los artículos activos con “No me interesa” se excluyen hasta retirar la marca.

`node:sqlite` requiere Node.js 22.5 o posterior y en algunas versiones muestra una advertencia experimental de Node. No se agregó un driver externo ni una base de datos remota.

## Catálogo responsable

El catálogo local está en `backend/src/data/catalog.json`. Conserva 30 registros **DEMO** ficticios y 24 productos reales verificados con URL oficial, precio MXN y fecha de consulta (Zara, IKEA, Bershka y Liverpool). Los registros reales se identifican como **Verificado**, enlazan a la tienda y se priorizan frente a DEMO cuando son complementarios y superan los filtros obligatorios. Las imágenes de todas las tarjetas son ilustraciones SVG originales de StyleMatch en `backend/public/images/catalog/`; no se descargan ni reutilizan fotografías comerciales. La tarjeta indica de manera explícita el tipo de imagen y cuenta con un fallback local si no carga el recurso específico.

No hay sincronización automática, scraping, robots, APIs internas ni descarga de imágenes de tiendas. H&M México prohíbe expresamente usar robots, rastreadores u otras herramientas para navegar o copiar contenido; por ello no se añadieron productos de H&M en esta entrega. Los precios y existencias pueden cambiar. Consulta sus [términos](https://www2.hm.com/es_mx/customer-service/legal-and-privacy/terms-and-conditions.html), la [política de precios de Zara México](https://www.zara.com/mx/en/help-center/PricesPolicy) y el [catálogo público de IKEA México](https://www.ikea.com/mx/es/cat/products-products/) antes de incorporar un artículo.

La investigación y las restricciones por tienda están documentadas en [`docs/catalog-research.md`](docs/catalog-research.md).

Para añadir un producto real, verifica manualmente una página oficial, usa el enlace de esa página, registra la fecha ISO, conserva la moneda `MXN` y el estado `verified` solo cuando se cumpla la verificación. No copies imágenes: utiliza una imagen propia/autorizada o el placeholder. Los artículos con precio o disponibilidad no confirmados deben ser `pending_verification`; la importación nunca los convierte automáticamente en verificados.

### Importación manual

```powershell
npm run catalog:import --workspace backend -- C:\ruta\catalogo.json
# o
npm run catalog:import --workspace backend -- C:\ruta\catalogo.csv
```

El archivo JSON debe ser un arreglo de productos con todos los campos del esquema de `backend/src/schemas/catalog.ts`. Para CSV, usa encabezados equivalentes; las listas se separan con `|` (`styles`, `secondaryColors`, `tags`, `occasions`) y los campos de fuente son `sourceType`, `sourceUrl` y `sourceNotes`. Antes de reemplazar el catálogo se valida IDs únicos, URL, precios, estado de derechos de imagen y reglas de verificación; el comando crea una copia `.bak` del JSON actual.

Campos clave de un producto verificado:

```json
{
  "store": "IKEA México",
  "productUrl": "https://www.ikea.com/mx/es/p/...",
  "price": 999,
  "currency": "MXN",
  "image": "/images/catalog/home-001.svg",
  "imageRightsStatus": "placeholder_owned",
  "availabilityVerified": true,
  "source": { "type": "official_product_page", "url": "https://www.ikea.com/mx/es/p/..." },
  "lastVerifiedAt": "2026-10-27T12:00:00-06:00",
  "verificationStatus": "verified"
}
```

La interfaz ofrece presupuesto mínimo/máximo en MXN. El backend solo devuelve artículos con precio conocido dentro del rango; si no hay tres, la UI lo comunica. Cada precio y disponibilidad verificada muestra su fecha y advierte que puede cambiar.

## Cinco casos de presentación y reporte

En el formulario principal hay cinco presets: **Moda casual**, **Moda elegante**, **Moda de color llamativo**, **Habitación minimalista** y **Espacio acogedor o moderno**. Al elegir uno se prepara categoría, ocasión y presupuesto; después carga una fotografía real proporcionada por ti y pulsa **Analizar mi estilo**. Elegir el caso no envía ninguna imagen ni inventa análisis.

Tras un resultado, usa **Guardar este resultado** para registrar categoría, ocasión, presupuesto, perfil local, modo (DEMO o Gemini real), análisis, recomendaciones, puntuaciones y tu evaluación manual. No se guarda la fotografía. **Exportar reportes JSON** descarga los resultados de ese perfil, con su modo claramente identificado.

## Instalación y ejecución

Requiere Node.js 22+ y npm 10+.

```powershell
npm install
Copy-Item backend/.env.example backend/.env
npm run dev
```

Para reiniciar después de editar `backend/.env`, detén con `Ctrl+C` y vuelve a ejecutar `npm run dev`.

## Variables de IA

Configura solo `backend/.env`; nunca una variable `VITE_*`:

```env
AI_PROVIDER=gemini
GEMINI_API_KEY=
GEMINI_MODEL=gemini-3.1-flash-lite
GEMINI_IMAGE_MODEL=gemini-3.1-flash-lite-image
GROQ_API_KEY=
GROQ_VISION_MODEL=qwen/qwen3.8-27b
ANALYSIS_DEMO_MODE=false
```

`AI_PROVIDER` acepta `gemini`, `groq` u `openai`; solo se utiliza el proveedor seleccionado, sin fallback automático. El modo DEMO no contacta ningún proveedor. En modo real, la imagen se envía temporalmente al backend y al proveedor de IA configurado para analizarla, sin persistencia. El catálogo y su presupuesto son independientes del análisis y no implementan un recomendador personalizado.

### Preparación de fotografías sintéticas del catálogo

`GEMINI_MODEL` se conserva exclusivamente para el análisis multimodal. La generación de ilustraciones fotográficas usa, de forma independiente, `GEMINI_IMAGE_MODEL=gemini-3.1-flash-lite-image`. El script nunca se ejecuta desde la aplicación ni por las pruebas automáticas.

Para inspeccionar los productos activos con SVG y sus prompts sin hacer peticiones ni generar cargos:

```powershell
npm run catalog:image --workspace backend
```

Solo después de autorizar expresamente una generación, define temporalmente `ALLOW_CATALOG_IMAGE_GENERATION=true` en `backend/.env` y ejecuta un lote pequeño (por defecto uno; máximo tres):

```powershell
npm run catalog:image --workspace backend -- --execute --limit=1
```

El script evita regenerar archivos ya creados, conserva el SVG previo en `imageMetadata.fallbackImage` y etiqueta el resultado como **Generada con IA, ilustrativa**; nunca como fotografía oficial. Vuelve a dejar `ALLOW_CATALOG_IMAGE_GENERATION=false` al terminar. La tarifa del modelo no se presupone gratuita: consulta la tabla oficial antes de autorizar cada lote.

## Verificación

```powershell
npm run build
npm test
npm run lint
```

Abre `http://localhost:5173` y `http://localhost:3001/api/health`. Para comprobar el catálogo, usa por ejemplo `http://localhost:3001/api/catalog?category=fashion&minPrice=1000&maxPrice=1300`. No se realizan llamadas a Gemini durante las pruebas.

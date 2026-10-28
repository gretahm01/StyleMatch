# Investigación de fuentes para catálogo (2026-10-27)

## Alcance y decisión

Se revisaron únicamente páginas públicas oficiales de H&M México, Zara México, IKEA México, Bershka México y Liverpool México. No se encontró una API pública de catálogo ni una fuente de importación autorizada para esta aplicación en las páginas revisadas. Por ello StyleMatch AI no consume endpoints privados, no automatiza navegación y no descarga ni reutiliza fotografías de las tiendas.

| Tienda | Fuente pública revisada | Resultado operativo |
| --- | --- | --- |
| H&M México | [Términos y condiciones](https://www2.hm.com/es_mx/customer-service/legal-and-privacy/terms-and-conditions.html) | Sus términos prohíben robots, rastreadores y mecanismos para navegar, buscar o copiar contenido. Los productos pueden descontinuarse y precios/colores varían. Solo alta manual con revisión humana y enlace oficial. |
| Zara México | [Centro de ayuda](https://www.zara.com/mx/es/help-center) y [política de precios](https://www.zara.com/mx/en/help-center/PricesPolicy) | El sitio tiene información de disponibilidad y composición, y Zara reserva el derecho de modificar precios. No se usa ninguna API interna ni importación automática. |
| IKEA México | [Catálogo de productos](https://www.ikea.com/mx/es/cat/products-products/) y [términos de uso](https://www.ikea.com/mx/es/customer-service/terms-conditions/terminos-y-condiciones-de-uso-pub39e4b801) | Hay catálogo público y páginas de producto para verificación manual. No se extraen datos o imágenes programáticamente. |
| Bershka México | [Sitio oficial](https://www.bershka.com/mx/) | Solo se incorporan páginas individuales que expongan públicamente nombre, precio y color. No se usan APIs internas ni se descargan imágenes comerciales. |
| Liverpool México | [Tienda oficial](https://www.liverpool.com.mx/tienda/home) | Solo se incorporan fichas públicas individuales con nombre, precio y color visibles. La disponibilidad depende de ubicación y puede cambiar. |

## Productos incorporados en esta entrega

Se verificaron manualmente 24 páginas públicas oficiales el 2026-10-27: 5 productos de Zara México, 9 de IKEA México, 1 de Bershka México y 9 de Liverpool México. Cada registro conserva URL, precio MXN, color, material solo cuando la página lo declara y fecha de consulta. La disponibilidad se marcó según el catálogo oficial y puede variar por ubicación. No se copiaron sus fotografías.

| Tienda | Cantidad | Tipos |
| --- | ---: | --- |
| Zara México | 5 | Bolsos de mujer |
| IKEA México | 9 | Lámparas de mesa y de piso |
| Bershka México | 1 | Pantalón jogger |
| Liverpool México | 9 | Tenis, chamarras, cinturones y bolso de mujer |
| H&M México | 0 | No incorporado por la restricción de sus términos frente a automatización |

Los estilos que la tienda no declara se conservan vacíos; StyleMatch no los infiere como hechos. La meta de 12 a 18 altas nuevas no se completó: las páginas públicas revisadas permitieron comprobar 10 altas nuevas con ficha específica. No se agregaron aretes, collares ni faldas porque no se confirmó una ficha individual con los campos requeridos. Las URLs específicas y demás campos verificables están en `backend/src/data/catalog.json`.

## Uso de imágenes

No se incorporan fotografías comerciales en las tarjetas. La autorización de imágenes del sitio de prensa de Bershka está limitada a medios informativos o periodísticos y no cubre un asistente de compras académico; tampoco se identificó un feed o licencia equivalente de Liverpool, Zara o IKEA para este uso. Por ello las 54 tarjetas usan ilustraciones SVG originales, individuales y con fallback local. Las fichas verificadas muestran el aviso `Ilustración original` y nunca presentan esa imagen como fotografía oficial.

## Fuente de datos permitida en esta fase

Una persona revisa una página oficial, transcribe lo mínimo necesario, conserva `productUrl`, `source.url` y `lastVerifiedAt`, y usa `verificationStatus: "verified"` solamente si comprobó el dato en esa sesión. Las imágenes externas no se copian: se usa una imagen propia/autorizada o un placeholder local con `imageRightsStatus` correspondiente.

Los registros sin verificación se importan como `pending_verification`. Los 30 registros originales siguen siendo `demo`, están atribuidos a `StyleMatch Demo` y no a una marca externa. Ningún producto de tienda se añade sin URL oficial, precio, fuente y fecha de consulta.

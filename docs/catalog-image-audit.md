# Auditoría de imágenes del catálogo

Fecha de auditoría: 2026-11-01. Se revisaron los 78 archivos de `backend/public/images/catalog/` contra las 54 entradas de `backend/src/data/catalog.json`.

Reglas de lectura:

- **Activa** significa que la entrada asociada puede llegar al motor (`activeForRecommendations` no es `false`). Aun así necesita precio, disponibilidad/estado DEMO, ocasión y compatibilidad visual.
- **Respaldo/legado** significa que el archivo existe para recuperación visual o es la versión SVG anterior; no es la ruta `image` seleccionada y no genera una recomendación por sí mismo.
- Un campo `—` indica que el archivo no representa un producto independiente del catálogo.
- Todos los productos sin tienda o inventario verificable son DEMO: `StyleMatch Demo`, `productUrl: null`, `verificationStatus: demo` y `sourceType: demo` cuando se añaden con la plantilla actual.

| Archivo de imagen | ID | Entrada activa | Categoría | Colores | Estilos | Ocasiones | Motivo para recomendar/no recomendar |
| --- | --- | --- | --- | --- | --- | --- | --- |
| bershka-2439478800-photo.png | bershka-2439478800 | Sí | Moda | negro | casual, deportivo | casual, daily | Imagen seleccionada; compite solo en looks casuales/deportivos compatibles. |
| bershka-2439478800.svg | bershka-2439478800 | Respaldo/legado | Moda | negro | casual, deportivo | casual, daily | SVG anterior; no es la ruta de imagen activa. |
| fashion-001.svg | fashion-001 | Sí | Moda | terracota, beige, oro | contemporáneo | work | DEMO; requiere trabajo y señal visual compatible. |
| fashion-002.svg | fashion-002 | Sí | Moda | crema, arena | minimalista | casual, daily | DEMO; candidato casual/minimalista. |
| fashion-003.svg | fashion-003 | Sí | Moda | olivo, beige | clásico | work, formal_event | DEMO; elegible únicamente para trabajo o formal. |
| fashion-004.svg | fashion-004 | Sí, pero no elegible | Moda | terracota, chocolate | bohemio | — | DEMO sin ocasión declarada; el filtro obligatorio lo excluye. |
| fashion-005.svg | fashion-005 | Sí | Moda | oro, marfil | contemporáneo | party | DEMO; accesorio de fiesta si pasa compatibilidad visual. |
| fashion-006.svg | fashion-006 | Sí | Moda | arena, crema | minimalista | casual, daily | DEMO; pantalón casual/minimalista. |
| fashion-007.svg | fashion-007 | Sí | Moda | marfil, beige | romántico | daily | DEMO; solo uso diario. |
| fashion-008.svg | fashion-008 | Sí | Moda | chocolate, oro | clásico | work, formal_event | DEMO; accesorio de trabajo/formal. |
| fashion-009.svg | fashion-009 | Sí, pero no elegible | Moda | salvia, crema | minimalista | — | DEMO sin ocasión declarada. |
| fashion-010.svg | fashion-010 | Sí, pero no elegible | Moda | beige, terracota, olivo | bohemio | — | DEMO sin ocasión declarada. |
| fashion-011.svg | fashion-011 | Sí | Moda | negro, oro | minimalista | party, date | DEMO; bolso para fiesta/cita. |
| fashion-012.svg | fashion-012 | Sí | Moda | azul cielo, blanco | clásico | daily | DEMO; solo uso diario. |
| fashion-013.svg | fashion-013 | Sí | Moda | azul marino, negro | clásico | formal_event, party | DEMO; pantalón formal/fiesta. |
| fashion-014.svg | fashion-014 | Sí, pero no elegible | Moda | terracota, café | contemporáneo | — | DEMO sin ocasión declarada. |
| fashion-015.svg | fashion-015 | Sí, pero no elegible | Moda | beige, olivo | utilitario | — | DEMO sin ocasión declarada. |
| fashion-placeholder.svg | — | No | — | — | — | — | Placeholder global de fallback; no representa un producto. |
| home-001.svg | home-001 | Sí | Hogar | terracota, crema | contemporáneo | renew_living_room, cozy_atmosphere | DEMO; lámpara para sala/acogedor. |
| home-002.png | home-002 | Sí | Hogar | terracota, arena | bohemio | renew_living_room, cozy_atmosphere, decorate_bedroom | DEMO; imagen seleccionada, cojín contextual. |
| home-002.svg | home-002 | Respaldo/legado | Hogar | terracota, arena | bohemio | renew_living_room, cozy_atmosphere, decorate_bedroom | SVG anterior del mismo DEMO. |
| home-003.png | home-003 | Sí | Hogar | arena, marfil, beige | minimalista | renew_living_room, minimalist_decor | DEMO; imagen seleccionada, alfombra compatible. |
| home-003.svg | home-003 | Respaldo/legado | Hogar | arena, marfil, beige | minimalista | renew_living_room, minimalist_decor | SVG anterior del mismo DEMO. |
| home-004.png | home-004 | Sí | Hogar | roble, beige | escandinavo | renew_living_room, minimalist_decor | DEMO; imagen seleccionada, mesa auxiliar compatible. |
| home-004.svg | home-004 | Respaldo/legado | Hogar | roble, beige | escandinavo | renew_living_room, minimalist_decor | SVG anterior del mismo DEMO. |
| home-005.png | home-005 | Sí | Hogar | beige, terracota, salvia | contemporáneo | decorate_bedroom | DEMO; imagen seleccionada, cuadro para dormitorio. |
| home-005.svg | home-005 | Respaldo/legado | Hogar | beige, terracota, salvia | contemporáneo | decorate_bedroom | SVG anterior del mismo DEMO. |
| home-006.svg | home-006 | Sí, pero no elegible | Hogar | marfil, arena | minimalista | — | DEMO sin ocasión declarada. |
| home-007.svg | home-007 | Sí, pero no elegible | Hogar | cobre, chocolate | art déco | — | DEMO sin ocasión declarada. |
| home-008.svg | home-008 | Sí | Hogar | crema, madera | escandinavo | workspace, decorate_bedroom | DEMO; lámpara apta para trabajo/dormitorio. |
| home-009.svg | home-009 | Sí | Hogar | olivo, beige | rústico | cozy_atmosphere | DEMO; cojín para ambiente acogedor. |
| home-010.svg | home-010 | Sí | Hogar | gris claro, marfil | minimalista | decorate_bedroom, minimalist_decor | DEMO; alfombra para dormitorio/minimalista. |
| home-011.svg | home-011 | Sí, pero no elegible | Hogar | negro, roble | industrial | — | DEMO sin ocasión declarada. |
| home-012.svg | home-012 | Sí, pero no elegible | Hogar | terracota, marfil, negro | contemporáneo | — | DEMO sin ocasión declarada. |
| home-013.svg | home-013 | Sí, pero no elegible | Hogar | terracota, café | rústico | — | DEMO sin ocasión declarada. |
| home-014.svg | home-014 | Sí, pero no elegible | Hogar | oro, beige | art déco | — | DEMO sin ocasión declarada. |
| home-015.svg | home-015 | Sí, pero no elegible | Hogar | salvia, marfil | contemporáneo | — | DEMO sin ocasión declarada. |
| home-placeholder.svg | — | No | — | — | — | — | Placeholder global de fallback; no representa un producto. |
| ikea-00563580.svg | ikea-00563580 | Sí | Hogar | verde grisáceo | — | workspace, cozy_atmosphere | Verificado; lámpara para trabajo/acogedor, requiere compatibilidad visual. |
| ikea-10544421.svg | ikea-10544421 | Sí | Hogar | latón | — | workspace, cozy_atmosphere | Verificado; lámpara para trabajo/acogedor. |
| ikea-40608529.png | ikea-40608529 | Sí | Hogar | azul | — | workspace, cozy_atmosphere | Verificado; imagen seleccionada, lámpara contextual. |
| ikea-40608529.svg | ikea-40608529 | Respaldo/legado | Hogar | azul | — | workspace, cozy_atmosphere | SVG anterior de la lámpara verificada. |
| ikea-60544051.svg | ikea-60544051 | Sí | Hogar | negro | — | workspace, cozy_atmosphere | Verificado; lámpara para trabajo/acogedor. |
| ikea-60585616.png | ikea-60585616 | Sí | Hogar | rojo | — | workspace, cozy_atmosphere | Verificado; imagen seleccionada, lámpara contextual. |
| ikea-60585616.svg | ikea-60585616 | Respaldo/legado | Hogar | rojo | — | workspace, cozy_atmosphere | SVG anterior de la lámpara verificada. |
| ikea-70544178.png | ikea-70544178 | Sí | Hogar | beige | — | workspace, cozy_atmosphere, decorate_bedroom | Verificado; lámpara apta para dormitorio declarado. |
| ikea-70544178.svg | ikea-70544178 | Respaldo/legado | Hogar | beige | — | workspace, cozy_atmosphere, decorate_bedroom | SVG anterior de la lámpara verificada. |
| ikea-90544399.svg | ikea-90544399 | Sí | Hogar | carbón | — | workspace, cozy_atmosphere | Verificado; lámpara para trabajo/acogedor. |
| ikea-90589118.svg | ikea-90589118 | Sí | Hogar | blanco | — | workspace, cozy_atmosphere | Verificado; lámpara para trabajo/acogedor. |
| ikea-90594841.svg | ikea-90594841 | Sí | Hogar | blanco | — | workspace, cozy_atmosphere | Verificado; lámpara para trabajo/acogedor. |
| liverpool-1130263881.png | liverpool-1130263881 | Sí | Moda | negro | — | casual, daily, work | Verificado; cinturón para casual/diario/trabajo. |
| liverpool-1130263881.svg | liverpool-1130263881 | Respaldo/legado | Moda | negro | — | casual, daily, work | SVG anterior del cinturón verificado. |
| liverpool-1162531426-photo.png | liverpool-1162531426 | Sí | Moda | blanco | casual | casual, daily, work | Verificado; ilustración local, tenis business-casual declarado. |
| liverpool-1162531426.svg | liverpool-1162531426 | Respaldo/legado | Moda | blanco | casual | casual, daily, work | SVG anterior de los tenis verificados. |
| liverpool-1174662665.png | liverpool-1174662665 | Sí | Moda | negro | deportivo | casual, daily | Verificado; chamarra deportiva, no formal. |
| liverpool-1174662665.svg | liverpool-1174662665 | Respaldo/legado | Moda | negro | deportivo | casual, daily | SVG anterior de la chamarra verificada. |
| liverpool-1174669813.png | liverpool-1174669813 | Sí | Moda | negro | deportivo | casual, daily | Verificado; tenis deportivo, no formal. |
| liverpool-1174669813.svg | liverpool-1174669813 | Respaldo/legado | Moda | negro | deportivo | casual, daily | SVG anterior de los tenis verificados. |
| liverpool-1176394218.png | liverpool-1176394218 | Sí | Moda | negro | casual | casual, daily | Verificado; tenis casuales, no formal. |
| liverpool-1176394218.svg | liverpool-1176394218 | Respaldo/legado | Moda | negro | casual | casual, daily | SVG anterior de los tenis verificados. |
| liverpool-1185410583.png | liverpool-1185410583 | Sí | Moda | rosa | — | casual, daily | Verificado; bolso casual/diario. |
| liverpool-1185410583.svg | liverpool-1185410583 | Respaldo/legado | Moda | rosa | — | casual, daily | SVG anterior del bolso verificado. |
| liverpool-1196594556.png | liverpool-1196594556 | Sí | Moda | negro | casual, streetwear | casual, daily | Verificado; silueta biker en ilustración local, sin material comercial afirmado. |
| liverpool-1196594556.svg | liverpool-1196594556 | Respaldo/legado | Moda | negro | casual, streetwear | casual, daily | SVG anterior de la chamarra verificada. |
| liverpool-1208694282.png | liverpool-1208694282 | Sí | Moda | negro | — | casual, daily, work | Verificado; cinturón para casual/diario/trabajo. |
| liverpool-1208694282.svg | liverpool-1208694282 | Respaldo/legado | Moda | negro | — | casual, daily, work | SVG anterior del cinturón verificado. |
| liverpool-1208825000.png | liverpool-1208825000 | Sí | Moda | negro | — | casual, daily | Verificado; chamarra puffer casual, no formal. |
| liverpool-1208825000.svg | liverpool-1208825000 | Respaldo/legado | Moda | negro | — | casual, daily | SVG anterior de la chamarra puffer verificada. |
| zara-16048810.png | zara-16048810 | Sí | Moda | multicolor | casual | casual, daily | Verificado; bolso multicolor para paletas con varios colores y look casual. |
| zara-16048810.svg | zara-16048810 | Respaldo/legado | Moda | multicolor | casual | casual, daily | SVG anterior del bolso verificado. |
| zara-16428810.png | zara-16428810 | Sí | Moda | azul | — | daily, work, date | Verificado; bolso para diario/trabajo/cita. |
| zara-16428810.svg | zara-16428810 | Respaldo/legado | Moda | azul | — | daily, work, date | SVG anterior del bolso verificado. |
| zara-16448810-photo.png | zara-16448810 | Sí | Moda | negro | — | casual, daily, work | Verificado; ilustración local, bolso de trabajo/casual. |
| zara-16448810.svg | zara-16448810 | Respaldo/legado | Moda | negro | — | casual, daily, work | SVG anterior del bolso verificado. |
| zara-16483810.png | zara-16483810 | Sí | Moda | verde lima | elegante | party, date | Verificado; bolso de fiesta/cita con acento verde. |
| zara-16483810.svg | zara-16483810 | Respaldo/legado | Moda | verde lima | elegante | party, date | SVG anterior del bolso verificado. |
| zara-16869810.png | zara-16869810 | Sí | Moda | naranja | elegante | party, date | Verificado; bolso naranja de abalorios para fiesta/cita. |
| zara-16869810.svg | zara-16869810 | Respaldo/legado | Moda | naranja | elegante | party, date | SVG anterior del bolso verificado. |

## Resultado y correcciones aplicadas

- Las 54 rutas `image` del catálogo existen. No se añadió ni sustituyó ningún archivo de imagen.
- Hay 22 PNG y 56 SVG. Veinticuatro SVG son assets heredados o de respaldo de una ruta PNG/foto y no tienen una entrada `image` directa; dos son placeholders globales.
- Se completó `casual` para `zara-16048810`, `elegante` para `zara-16869810` y `casual`/`streetwear` para `liverpool-1196594556`. El último mantiene `material: null`: la ilustración sugiere una silueta biker, pero no confirma material comercial.
- El motor interpreta `multicolor` solo cuando el análisis observó dos o más colores distintos; no se infieren colores individuales inexistentes en la ficha.
- Los registros con ocasión vacía permanecen fuera de las recomendaciones por diseño, para no inventar su uso.

## Política de calidad visual vigente

La tabla conserva el inventario y la ficha de cada asset, pero la elegibilidad final se endureció después de la auditoría: los 30 DEMO actuales no se recomiendan porque sus SVG son ilustraciones genéricas o sus PNG no están documentados como fotografía local del artículo exacto. Permanecen en el catálogo como respaldo académico y llevan la insignia DEMO cuando se consultan, pero no rellenan resultados.

Para que un DEMO vuelva a competir necesita una imagen raster local y `imageMetadata.kind: "exact_product"`; el procedimiento y la ruta prevista para cada uno están en [`demo-placeholder-replacement.md`](demo-placeholder-replacement.md). Los productos verificados conservan su enlace a la tienda; los DEMO habilitados siguen sin enlace comercial.

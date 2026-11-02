# Sustitución de placeholders DEMO

Los siguientes productos se conservan en el catálogo como referencias académicas, pero **no son recomendables actualmente**: su imagen actual es un SVG genérico o un placeholder. No se eliminan y no se les asigna una tienda, URL comercial ni inventario ficticio.

| ID | Producto | Imagen actual | Sustituir por |
| --- | --- | --- | --- |
| fashion-001 | Bolso Siena | fashion-001.svg | `/images/catalog/fashion-001.webp` |
| fashion-002 | Tenis Nube | fashion-002.svg | `/images/catalog/fashion-002.webp` |
| fashion-003 | Mocasín Olivo | fashion-003.svg | `/images/catalog/fashion-003.webp` |
| fashion-004 | Chamarra Arcilla | fashion-004.svg | `/images/catalog/fashion-004.webp` |
| fashion-005 | Aretes Sol | fashion-005.svg | `/images/catalog/fashion-005.webp` |
| fashion-006 | Pantalón Lino Arena | fashion-006.svg | `/images/catalog/fashion-006.webp` |
| fashion-007 | Blusa Brisa | fashion-007.svg | `/images/catalog/fashion-007.webp` |
| fashion-008 | Cinturón Cacao | fashion-008.svg | `/images/catalog/fashion-008.webp` |
| fashion-009 | Vestido Salvia | fashion-009.svg | `/images/catalog/fashion-009.webp` |
| fashion-010 | Pañuelo Duna | fashion-010.svg | `/images/catalog/fashion-010.webp` |
| fashion-011 | Bolso Luma | fashion-011.svg | `/images/catalog/fashion-011.webp` |
| fashion-012 | Camisa Cielo | fashion-012.svg | `/images/catalog/fashion-012.webp` |
| fashion-013 | Pantalón Noche | fashion-013.svg | `/images/catalog/fashion-013.webp` |
| fashion-014 | Botín Siena | fashion-014.svg | `/images/catalog/fashion-014.webp` |
| fashion-015 | Chamarra Lluvia | fashion-015.svg | `/images/catalog/fashion-015.webp` |
| home-001 | Lámpara Ámbar | home-001.svg | `/images/catalog/home-001.webp` |
| home-002 | Cojín Trama | home-002.png | `/images/catalog/home-002.webp` |
| home-003 | Alfombra Duna | home-003.png | `/images/catalog/home-003.webp` |
| home-004 | Mesa Roble | home-004.png | `/images/catalog/home-004.webp` |
| home-005 | Cuadro Horizonte | home-005.png | `/images/catalog/home-005.webp` |
| home-006 | Florero Alba | home-006.svg | `/images/catalog/home-006.webp` |
| home-007 | Bandeja Cobre | home-007.svg | `/images/catalog/home-007.webp` |
| home-008 | Lámpara Niebla | home-008.svg | `/images/catalog/home-008.webp` |
| home-009 | Cojín Olivo | home-009.svg | `/images/catalog/home-009.webp` |
| home-010 | Alfombra Calma | home-010.svg | `/images/catalog/home-010.webp` |
| home-011 | Mesa Nómada | home-011.svg | `/images/catalog/home-011.webp` |
| home-012 | Cuadro Arcilla | home-012.svg | `/images/catalog/home-012.webp` |
| home-013 | Florero Tierra | home-013.svg | `/images/catalog/home-013.webp` |
| home-014 | Espejo Aura | home-014.svg | `/images/catalog/home-014.webp` |
| home-015 | Candelabro Salvia | home-015.svg | `/images/catalog/home-015.webp` |

## Procedimiento para habilitar un DEMO

1. Coloca una fotografía local propia/autorizada del artículo exacto en `backend/public/images/catalog/`, usando la ruta indicada en la tabla. No uses un icono, collage, foto de otro artículo ni una imagen comercial sin permiso.
2. Conserva el ID, precio y campos de procedencia DEMO. En `backend/src/data/catalog.json`, cambia únicamente `image` y añade metadatos honestos como estos:

```json
{
  "image": "/images/catalog/fashion-013.webp",
  "imageRightsStatus": "authorized",
  "imageMetadata": {
    "kind": "exact_product",
    "sourceUrl": null,
    "author": "Autor o equipo StyleMatch",
    "license": "Fotografía propia o autorizada del artículo DEMO",
    "attribution": null,
    "checkedAt": "2026-11-01T12:00:00-06:00",
    "fallbackImage": "/images/catalog/fashion-013.svg"
  }
}
```

3. Mantén `store: "StyleMatch Demo"`, `sourceType: "demo"`, `source.type: "internal_demo"`, `productUrl: null` y `verificationStatus: "demo"`. No añadas enlaces comerciales ni afirmes que el artículo pertenece a una tienda real.
4. Añade o conserva `occasions`, `styles`, `primaryColor`, `secondaryColors`, `productAudience`, `price` y `activeForRecommendations: true` únicamente si la ficha los respalda. Después ejecuta `npm test`.

Un DEMO con `imageMetadata.kind: "exact_product"` puede recomendarse y conserva la insignia **DEMO · ilustrativo**. La tarjeta no mostrará el botón **Ver en tienda** porque su `productUrl` seguirá siendo `null`.

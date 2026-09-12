import type { CategoriaProducto, ProductoBuscado } from "@/types";

export const CATEGORIAS_COMPRA: Array<{
  id: CategoriaProducto;
  etiqueta: string;
}> = [
  { id: "bebidas", etiqueta: "Bebidas" },
  { id: "alimentos", etiqueta: "Alimentos y catering" },
  { id: "mobiliario", etiqueta: "Mobiliario" },
  { id: "descartables", etiqueta: "Descartables y servicio" },
  { id: "limpieza", etiqueta: "Limpieza y residuos" },
  { id: "decoracion", etiqueta: "Decoración y activación" },
  { id: "equipamiento", etiqueta: "Equipamiento y logística" },
  { id: "otros", etiqueta: "Otros" },
];

const REGLAS_CATEGORIA: Array<[CategoriaProducto, RegExp]> = [
  ["bebidas", /\b(agua|gaseosa|coca[ -]?cola|bebida|jugo|cerveza|vino|cafe|té)\b/i],
  ["alimentos", /\b(snack|comida|catering|sandwich|bocadito|dulce|galleta|pizza|almuerzo)\b/i],
  ["mobiliario", /\b(silla|mesa|banca|sofá|sofa|taburete|mantel)\b/i],
  ["descartables", /\b(vaso|plato|cubierto|servilleta|descartable|tapa)\b/i],
  ["limpieza", /\b(bolsa de basura|basura|limpieza|detergente|desinfectante|papel higienico)\b/i],
  ["decoracion", /\b(globo|decoraci[oó]n|banner|vinil|display|branding|flor|guirnalda)\b/i],
  ["equipamiento", /\b(carpa|toldo|parlante|sonido|proyector|pantalla|iluminaci[oó]n|generador)\b/i],
];

export function clasificarCategoriaProducto(
  producto: ProductoBuscado
): CategoriaProducto {
  if (producto.categoria) return producto.categoria;

  const texto = `${producto.nombre} ${producto.proveedor}`;
  const regla = REGLAS_CATEGORIA.find(([, patron]) => patron.test(texto));
  return regla?.[0] ?? "otros";
}

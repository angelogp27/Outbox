import { google } from "googleapis";
import type { OrdenAprobada } from "@/types";

// Reporte post-aprobación: reemplaza el contenido de la hoja con el detalle
// de la última orden aprobada (no se acumula historial — cada aprobación
// pisa a la anterior). Una fila por ítem, con encabezados, para que se
// entienda de un vistazo sin tener que abrir el link de cada producto.
// Fuera de la ruta crítica de la demo: si falla, se loguea y se sigue, nunca
// tumba la aprobación.
//
// Requiere en el entorno: GOOGLE_SHEETS_SPREADSHEET_ID,
// GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY (ver .env.local.example).

const ENCABEZADOS = [
  "Fecha de entrega",
  "Producto",
  "Proveedor",
  "Precio unitario (S/)",
  "Cantidad",
  "Subtotal (S/)",
];

/** Link directo a la hoja, para incluir en los mensajes de WhatsApp. */
export function linkGoogleSheets(): string {
  return `https://docs.google.com/spreadsheets/d/${process.env.GOOGLE_SHEETS_SPREADSHEET_ID}/edit`;
}

function auth() {
  return new google.auth.JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
}

/** Reemplaza la hoja con: encabezados, una fila por ítem, y el total al final. */
export async function reportarGoogleSheets(aprobada: OrdenAprobada): Promise<void> {
  try {
    const sheets = google.sheets({ version: "v4", auth: auth() });
    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

    const filasItems = aprobada.orden.items.map((item) => [
      aprobada.fecha,
      item.producto.nombre,
      item.producto.proveedor,
      item.producto.precioAprox,
      item.cantidad,
      item.producto.precioAprox * item.cantidad,
    ]);

    const filaTotal = ["", "", "", "", "TOTAL (" + aprobada.proveedores + " proveedores)", aprobada.total];

    // Borra lo que haya antes de escribir: cada reporte reemplaza al anterior.
    await sheets.spreadsheets.values.clear({ spreadsheetId, range: "A1:Z1000" });

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: "A1",
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [ENCABEZADOS, ...filasItems, filaTotal] },
    });

    // Encabezados en negrita, para que se distingan de los datos.
    const meta = await sheets.spreadsheets.get({ spreadsheetId });
    const sheetId = meta.data.sheets?.[0]?.properties?.sheetId ?? 0;
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            repeatCell: {
              range: { sheetId, startRowIndex: 0, endRowIndex: 1 },
              cell: { userEnteredFormat: { textFormat: { bold: true } } },
              fields: "userEnteredFormat.textFormat.bold",
            },
          },
        ],
      },
    });
  } catch (err) {
    console.error("[sheets] no se pudo reportar la orden aprobada:", err);
  }
}

import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import fs from "fs";
import path from "path";
import type { Customer, Order, OrderItemRecord } from "@shared/schema";

/**
 * PDF Generation Notes:
 * - PDFs generated with pdf-lib using drawText() are inherently static and non-editable
 * - No form fields are created, so the output is automatically "flattened"
 * - The PDF is optimized for A4 printing with proper margins
 * - Black & white color scheme for thermal and laser printer compatibility
 */

const PDF_OUTPUT_DIR = path.join(process.cwd(), "generated-pdfs");

function ensurePdfDirectory() {
  if (!fs.existsSync(PDF_OUTPUT_DIR)) {
    fs.mkdirSync(PDF_OUTPUT_DIR, { recursive: true });
  }
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();
}

function getItemDetails(item: OrderItemRecord): string[] {
  const data = JSON.parse(item.itemData);
  const details: string[] = [];

  switch (item.itemType) {
    case "box":
      details.push(`Type: ${data.boxType || "N/A"}`);
      details.push(`Dimensions: ${data.length}cm x ${data.breadth}cm x ${data.height}cm`);
      details.push(`Print: ${data.printType || "N/A"}`);
      break;
    case "envelope":
      details.push(`Size: ${data.envelopeSize || "N/A"}`);
      details.push(`Print: ${data.envelopePrintType || "N/A"}`);
      break;
    case "bag":
      details.push(`Handle: ${data.doreType || "N/A"}`);
      details.push(`Size: ${data.bagSize || "N/A"}`);
      details.push(`Print: ${data.bagPrintType || "N/A"}`);
      break;
  }

  return details;
}

export async function generateOrderPdf(
  order: Order,
  customer: Customer,
  items: OrderItemRecord[]
): Promise<string> {
  ensurePdfDirectory();

  console.log(`[PDF] Generating PDF for Order #${order.id}`);

  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]);
  const { width, height } = page.getSize();

  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const margin = 50;
  const lineHeight = 18;
  let y = height - margin;

  const black = rgb(0, 0, 0);
  const gray = rgb(0.4, 0.4, 0.4);
  const lightGray = rgb(0.85, 0.85, 0.85);

  page.drawText("PRINT SOLUTIONS", {
    x: margin,
    y,
    size: 24,
    font: helveticaBold,
    color: black,
  });
  y -= 25;

  page.drawText("Professional Printing Services", {
    x: margin,
    y,
    size: 10,
    font: helvetica,
    color: gray,
  });

  page.drawText("ORDER FORM", {
    x: width - margin - 100,
    y: height - margin,
    size: 14,
    font: helveticaBold,
    color: black,
  });

  y -= 40;

  page.drawLine({
    start: { x: margin, y },
    end: { x: width - margin, y },
    thickness: 2,
    color: black,
  });

  y -= 30;

  page.drawText("ORDER DETAILS", {
    x: margin,
    y,
    size: 12,
    font: helveticaBold,
    color: black,
  });
  y -= lineHeight + 5;

  const leftCol = margin;
  const rightCol = width / 2 + 20;

  page.drawText(`Order Number:`, { x: leftCol, y, size: 10, font: helveticaBold, color: black });
  page.drawText(`#${order.id.toString().padStart(6, "0")}`, { x: leftCol + 90, y, size: 10, font: helvetica, color: black });

  page.drawText(`Order Date:`, { x: rightCol, y, size: 10, font: helveticaBold, color: black });
  page.drawText(formatDate(order.orderDate), { x: rightCol + 70, y, size: 10, font: helvetica, color: black });
  y -= lineHeight;

  page.drawText(`Created:`, { x: leftCol, y, size: 10, font: helveticaBold, color: black });
  page.drawText(formatDate(order.createdAt), { x: leftCol + 90, y, size: 10, font: helvetica, color: black });
  y -= lineHeight + 15;

  page.drawRectangle({
    x: margin,
    y: y - 55,
    width: width - margin * 2,
    height: 60,
    color: lightGray,
  });

  y -= 5;
  page.drawText("CUSTOMER INFORMATION", {
    x: margin + 10,
    y,
    size: 11,
    font: helveticaBold,
    color: black,
  });
  y -= lineHeight;

  page.drawText(`Name:`, { x: margin + 10, y, size: 10, font: helveticaBold, color: black });
  page.drawText(customer.name, { x: margin + 60, y, size: 10, font: helvetica, color: black });
  y -= lineHeight;

  page.drawText(`Phone:`, { x: margin + 10, y, size: 10, font: helveticaBold, color: black });
  page.drawText(customer.phone, { x: margin + 60, y, size: 10, font: helvetica, color: black });
  y -= lineHeight + 25;

  page.drawText("ORDER ITEMS", {
    x: margin,
    y,
    size: 12,
    font: helveticaBold,
    color: black,
  });
  y -= lineHeight + 5;

  const tableStartX = margin;
  const colWidths = [30, 80, 180, 60, 70, 70];
  const headers = ["#", "Type", "Details", "Qty", "Price", "Total"];

  page.drawRectangle({
    x: tableStartX,
    y: y - 15,
    width: width - margin * 2,
    height: 20,
    color: lightGray,
  });

  let headerX = tableStartX + 5;
  headers.forEach((header, i) => {
    page.drawText(header, {
      x: headerX,
      y: y - 10,
      size: 9,
      font: helveticaBold,
      color: black,
    });
    headerX += colWidths[i];
  });
  y -= 25;

  items.forEach((item, index) => {
    const details = getItemDetails(item);
    const itemTotal = item.quantity * item.price;
    const itemType = item.itemType.charAt(0).toUpperCase() + item.itemType.slice(1);

    let rowX = tableStartX + 5;

    page.drawText((index + 1).toString(), { x: rowX, y, size: 9, font: helvetica, color: black });
    rowX += colWidths[0];

    page.drawText(itemType, { x: rowX, y, size: 9, font: helvetica, color: black });
    rowX += colWidths[1];

    const detailsText = details.join(", ");
    const maxWidth = 170;
    const truncatedDetails = detailsText.length > 40 ? detailsText.substring(0, 37) + "..." : detailsText;
    page.drawText(truncatedDetails, { x: rowX, y, size: 8, font: helvetica, color: black });
    rowX += colWidths[2];

    page.drawText(item.quantity.toString(), { x: rowX, y, size: 9, font: helvetica, color: black });
    rowX += colWidths[3];

    page.drawText(`$${item.price.toFixed(2)}`, { x: rowX, y, size: 9, font: helvetica, color: black });
    rowX += colWidths[4];

    page.drawText(`$${itemTotal.toFixed(2)}`, { x: rowX, y, size: 9, font: helveticaBold, color: black });

    y -= lineHeight;

    if (details.length > 0) {
      details.forEach((detail) => {
        page.drawText(`  ${detail}`, {
          x: tableStartX + colWidths[0] + colWidths[1] + 5,
          y,
          size: 7,
          font: helvetica,
          color: gray,
        });
        y -= 12;
      });
    }

    y -= 5;
  });

  y -= 10;
  page.drawLine({
    start: { x: margin, y },
    end: { x: width - margin, y },
    thickness: 1,
    color: black,
  });
  y -= 20;

  const totalLabelX = width - margin - 150;
  const totalValueX = width - margin - 70;

  page.drawText("TOTAL:", {
    x: totalLabelX,
    y,
    size: 14,
    font: helveticaBold,
    color: black,
  });
  page.drawText(`$${order.totalAmount.toFixed(2)}`, {
    x: totalValueX,
    y,
    size: 14,
    font: helveticaBold,
    color: black,
  });

  const footerY = 50;
  page.drawLine({
    start: { x: margin, y: footerY + 15 },
    end: { x: width - margin, y: footerY + 15 },
    thickness: 0.5,
    color: gray,
  });

  page.drawText("Thank you for your business!", {
    x: margin,
    y: footerY,
    size: 9,
    font: helvetica,
    color: gray,
  });

  page.drawText(`Generated: ${new Date().toLocaleString()}`, {
    x: width - margin - 130,
    y: footerY,
    size: 8,
    font: helvetica,
    color: gray,
  });

  const pdfBytes = await pdfDoc.save();

  const filename = `order_${order.id}_${sanitizeFilename(customer.name)}.pdf`;
  const filePath = path.join(PDF_OUTPUT_DIR, filename);

  fs.writeFileSync(filePath, pdfBytes);

  console.log(`[PDF] PDF generated successfully: ${filePath}`);

  return filename;
}

export function getPdfPath(filename: string): string {
  return path.join(PDF_OUTPUT_DIR, filename);
}

export function pdfExists(filename: string): boolean {
  return fs.existsSync(getPdfPath(filename));
}

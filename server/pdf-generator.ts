import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import fs from "fs";
import path from "path";
import type { Customer, Order, OrderItemRecord, PdfInfo } from "@shared/schema";

/**
 * PDF Generation Notes:
 * - PDFs generated with pdf-lib using drawText() are inherently static and non-editable
 * - No form fields are created, so the output is automatically "flattened"
 * - The PDF is optimized for A4 printing with proper margins
 * - Black & white color scheme for thermal and laser printer compatibility
 * - Generates separate PDFs for each item type (Box, Envelope, Bag)
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

function getItemDetails(item: OrderItemRecord): { label: string; value: string }[] {
  const data = JSON.parse(item.itemData);
  const details: { label: string; value: string }[] = [];

  switch (item.itemType) {
    case "box":
      details.push({ label: "Box Type", value: data.boxType || "N/A" });
      details.push({ label: "Length", value: `${data.length}` });
      details.push({ label: "Breadth", value: `${data.breadth}` });
      details.push({ label: "Height", value: `${data.height}` });
      details.push({ label: "Type", value: data.printType || "N/A" });
      break;
    case "envelope":
      details.push({ label: "Size", value: data.envelopeSize || "N/A" });
      details.push({ label: "Type", value: data.envelopePrintType || "N/A" });
      break;
    case "bag":
      details.push({ label: "Dore Specifications", value: data.doreType || "N/A" });
      details.push({ label: "Size", value: data.bagSize || "N/A" });
      details.push({ label: "Type", value: data.bagPrintType || "N/A" });
      break;
  }

  return details;
}

function getItemTypeTitle(itemType: string): string {
  switch (itemType) {
    case "box": return "BOX ORDER";
    case "envelope": return "ENVELOPE ORDER";
    case "bag": return "BAG ORDER";
    default: return "ORDER";
  }
}

async function generateSingleTypePdf(
  order: Order,
  customer: Customer,
  items: OrderItemRecord[],
  itemType: string
): Promise<{ filename: string; bytes: Uint8Array }> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // A4
  const { width, height } = page.getSize();

  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const margin = 50;
  const lineHeight = 20;
  let y = height - margin;

  const black = rgb(0, 0, 0);
  const gray = rgb(0.4, 0.4, 0.4);
  const lightGray = rgb(0.9, 0.9, 0.9);

  // Header - Company Name
  page.drawText("PRINT SOLUTIONS", {
    x: margin,
    y,
    size: 28,
    font: helveticaBold,
    color: black,
  });
  y -= 30;

  page.drawText("Professional Printing Services", {
    x: margin,
    y,
    size: 11,
    font: helvetica,
    color: gray,
  });

  // Order Type Header on right side
  page.drawText(getItemTypeTitle(itemType), {
    x: width - margin - 140,
    y: height - margin,
    size: 16,
    font: helveticaBold,
    color: black,
  });

  page.drawText(`Order #${order.id.toString().padStart(6, "0")}`, {
    x: width - margin - 140,
    y: height - margin - 20,
    size: 12,
    font: helvetica,
    color: black,
  });

  y -= 35;

  // Divider line
  page.drawLine({
    start: { x: margin, y },
    end: { x: width - margin, y },
    thickness: 2,
    color: black,
  });

  y -= 35;

  // Customer Information Box
  page.drawRectangle({
    x: margin,
    y: y - 70,
    width: width - margin * 2,
    height: 80,
    color: lightGray,
  });

  page.drawText("CUSTOMER INFORMATION", {
    x: margin + 15,
    y: y - 5,
    size: 12,
    font: helveticaBold,
    color: black,
  });

  y -= 25;

  page.drawText("Name:", { x: margin + 15, y, size: 11, font: helveticaBold, color: black });
  page.drawText(customer.name, { x: margin + 80, y, size: 11, font: helvetica, color: black });

  page.drawText("Order Date:", { x: width / 2, y, size: 11, font: helveticaBold, color: black });
  page.drawText(formatDate(order.orderDate), { x: width / 2 + 80, y, size: 11, font: helvetica, color: black });

  y -= lineHeight;

  page.drawText("Phone:", { x: margin + 15, y, size: 11, font: helveticaBold, color: black });
  page.drawText(customer.phone, { x: margin + 80, y, size: 11, font: helvetica, color: black });

  y -= 55;

  // Items Section Header
  page.drawText(`${getItemTypeTitle(itemType)} ITEMS`, {
    x: margin,
    y,
    size: 14,
    font: helveticaBold,
    color: black,
  });

  y -= 25;

  // Table Header
  const tableHeaders = ["#", "Details", "Qty", "Price", "Total"];
  const colWidths = [40, 280, 60, 70, 70];
  
  page.drawRectangle({
    x: margin,
    y: y - 18,
    width: width - margin * 2,
    height: 25,
    color: lightGray,
  });

  let headerX = margin + 10;
  tableHeaders.forEach((header, i) => {
    page.drawText(header, {
      x: headerX,
      y: y - 12,
      size: 10,
      font: helveticaBold,
      color: black,
    });
    headerX += colWidths[i];
  });

  y -= 30;

  // Items
  let grandTotal = 0;

  items.forEach((item, index) => {
    const details = getItemDetails(item);
    const itemTotal = item.quantity * item.price;
    grandTotal += itemTotal;

    // Draw item number
    let rowX = margin + 10;
    page.drawText((index + 1).toString(), { x: rowX, y, size: 10, font: helvetica, color: black });
    rowX += colWidths[0];

    // Draw first detail in main row
    if (details.length > 0) {
      page.drawText(`${details[0].label}: ${details[0].value}`, { 
        x: rowX, 
        y, 
        size: 10, 
        font: helvetica, 
        color: black 
      });
    }
    rowX = margin + 10 + colWidths[0] + colWidths[1];

    // Quantity
    page.drawText(item.quantity.toString(), { x: rowX, y, size: 10, font: helvetica, color: black });
    rowX += colWidths[2];

    // Price
    page.drawText(`$${item.price.toFixed(2)}`, { x: rowX, y, size: 10, font: helvetica, color: black });
    rowX += colWidths[3];

    // Total
    page.drawText(`$${itemTotal.toFixed(2)}`, { x: rowX, y, size: 10, font: helveticaBold, color: black });

    y -= lineHeight;

    // Additional details on subsequent lines
    for (let i = 1; i < details.length; i++) {
      page.drawText(`${details[i].label}: ${details[i].value}`, {
        x: margin + 10 + colWidths[0],
        y,
        size: 9,
        font: helvetica,
        color: gray,
      });
      y -= 16;
    }

    // Line separator between items
    y -= 5;
    page.drawLine({
      start: { x: margin, y: y + 10 },
      end: { x: width - margin, y: y + 10 },
      thickness: 0.5,
      color: lightGray,
    });
    y -= 10;
  });

  // Total Section
  y -= 15;
  page.drawLine({
    start: { x: margin, y },
    end: { x: width - margin, y },
    thickness: 1,
    color: black,
  });

  y -= 25;

  page.drawText("TOTAL:", {
    x: width - margin - 160,
    y,
    size: 16,
    font: helveticaBold,
    color: black,
  });
  page.drawText(`$${grandTotal.toFixed(2)}`, {
    x: width - margin - 80,
    y,
    size: 16,
    font: helveticaBold,
    color: black,
  });

  // Footer
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
    size: 10,
    font: helvetica,
    color: gray,
  });

  page.drawText(`Generated: ${new Date().toLocaleString()}`, {
    x: width - margin - 150,
    y: footerY,
    size: 9,
    font: helvetica,
    color: gray,
  });

  const pdfBytes = await pdfDoc.save();
  const filename = `order_${order.id}_${itemType}_${sanitizeFilename(customer.name)}.pdf`;

  return { filename, bytes: pdfBytes };
}

export async function generateOrderPdfs(
  order: Order,
  customer: Customer,
  items: OrderItemRecord[]
): Promise<PdfInfo[]> {
  ensurePdfDirectory();

  console.log(`[PDF] Generating PDFs for Order #${order.id}`);

  // Group items by type
  const boxItems = items.filter(item => item.itemType === "box");
  const envelopeItems = items.filter(item => item.itemType === "envelope");
  const bagItems = items.filter(item => item.itemType === "bag");

  const pdfInfos: PdfInfo[] = [];

  // Generate PDF for each item type that has items
  if (boxItems.length > 0) {
    const { filename, bytes } = await generateSingleTypePdf(order, customer, boxItems, "box");
    const filePath = path.join(PDF_OUTPUT_DIR, filename);
    fs.writeFileSync(filePath, bytes);
    pdfInfos.push({ type: "Box", url: `/api/pdf/${filename}`, filename });
    console.log(`[PDF] Box PDF generated: ${filename}`);
  }

  if (envelopeItems.length > 0) {
    const { filename, bytes } = await generateSingleTypePdf(order, customer, envelopeItems, "envelope");
    const filePath = path.join(PDF_OUTPUT_DIR, filename);
    fs.writeFileSync(filePath, bytes);
    pdfInfos.push({ type: "Envelope", url: `/api/pdf/${filename}`, filename });
    console.log(`[PDF] Envelope PDF generated: ${filename}`);
  }

  if (bagItems.length > 0) {
    const { filename, bytes } = await generateSingleTypePdf(order, customer, bagItems, "bag");
    const filePath = path.join(PDF_OUTPUT_DIR, filename);
    fs.writeFileSync(filePath, bytes);
    pdfInfos.push({ type: "Bag", url: `/api/pdf/${filename}`, filename });
    console.log(`[PDF] Bag PDF generated: ${filename}`);
  }

  console.log(`[PDF] Generated ${pdfInfos.length} PDF(s) for Order #${order.id}`);

  return pdfInfos;
}

export function getPdfPath(filename: string): string {
  return path.join(PDF_OUTPUT_DIR, filename);
}

export function pdfExists(filename: string): boolean {
  return fs.existsSync(getPdfPath(filename));
}

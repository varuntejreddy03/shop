import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import fs from "fs";
import path from "path";
import type { Customer, Order, OrderItemRecord, PdfInfo } from "@shared/schema";

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

function drawCheckbox(page: any, x: number, y: number, checked: boolean, font: any) {
  const size = 10;
  page.drawRectangle({
    x,
    y: y - 2,
    width: size,
    height: size,
    borderColor: rgb(0, 0, 0),
    borderWidth: 1,
  });
  if (checked) {
    page.drawText("X", {
      x: x + 2,
      y: y,
      size: 8,
      font,
      color: rgb(0, 0, 0),
    });
  }
}

function drawLabelValue(page: any, label: string, value: string, x: number, y: number, boldFont: any, regularFont: any) {
  page.drawText(label, { x, y, size: 10, font: boldFont, color: rgb(0, 0, 0) });
  page.drawText(value, { x: x + 100, y, size: 10, font: regularFont, color: rgb(0, 0, 0) });
}

function drawSectionTitle(page: any, title: string, x: number, y: number, width: number, font: any) {
  page.drawRectangle({
    x,
    y: y - 5,
    width,
    height: 20,
    color: rgb(0.9, 0.9, 0.9),
  });
  page.drawText(title, {
    x: x + 10,
    y: y,
    size: 11,
    font,
    color: rgb(0, 0, 0),
  });
}

function drawSignatureLine(page: any, label: string, x: number, y: number, font: any) {
  page.drawLine({
    start: { x, y },
    end: { x: x + 180, y },
    thickness: 0.5,
    color: rgb(0, 0, 0),
  });
  page.drawText(label, {
    x,
    y: y - 15,
    size: 9,
    font,
    color: rgb(0.3, 0.3, 0.3),
  });
}

async function generateBoxPdf(
  order: Order,
  customer: Customer,
  items: OrderItemRecord[]
): Promise<{ filename: string; bytes: Uint8Array }> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // A4
  const { width, height } = page.getSize();

  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const regular = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const margin = 50;
  const contentWidth = width - margin * 2;
  let y = height - margin;

  // Title
  const title = "BOX ORDER FORM";
  const titleWidth = bold.widthOfTextAtSize(title, 18);
  page.drawText(title, {
    x: (width - titleWidth) / 2,
    y,
    size: 18,
    font: bold,
    color: rgb(0, 0, 0),
  });
  y -= 40;

  // Customer Details Section
  drawSectionTitle(page, "CUSTOMER DETAILS", margin, y, contentWidth, bold);
  y -= 30;

  drawLabelValue(page, "Customer Name:", customer.name, margin + 10, y, bold, regular);
  y -= 20;
  drawLabelValue(page, "Phone Number:", customer.phone, margin + 10, y, bold, regular);
  y -= 20;
  drawLabelValue(page, "Order Date:", formatDate(order.orderDate), margin + 10, y, bold, regular);
  y -= 35;

  // Process each box item
  let totalQty = 0;
  let totalPrice = 0;

  items.forEach((item, idx) => {
    const data = JSON.parse(item.itemData);
    totalQty += item.quantity;
    totalPrice += item.quantity * item.price;

    drawSectionTitle(page, `BOX DETAILS - Item ${idx + 1}`, margin, y, contentWidth, bold);
    y -= 30;

    // Box Type checkboxes
    page.drawText("Box Type:", { x: margin + 10, y, size: 10, font: bold, color: rgb(0, 0, 0) });
    const boxTypes = ["Top-Bottom", "Magnet", "Ribbon"];
    let checkX = margin + 80;
    boxTypes.forEach((type) => {
      drawCheckbox(page, checkX, y, data.boxType === type, regular);
      page.drawText(type, { x: checkX + 14, y, size: 9, font: regular, color: rgb(0, 0, 0) });
      checkX += 80;
    });
    y -= 22;

    // Dimensions
    page.drawText("Dimensions (cm):", { x: margin + 10, y, size: 10, font: bold, color: rgb(0, 0, 0) });
    page.drawText(`Length: ${data.length}   Breadth: ${data.breadth}   Height: ${data.height}`, {
      x: margin + 110,
      y,
      size: 10,
      font: regular,
      color: rgb(0, 0, 0),
    });
    y -= 22;

    // Print Type checkboxes
    page.drawText("Print Type:", { x: margin + 10, y, size: 10, font: bold, color: rgb(0, 0, 0) });
    const printTypes = ["Plain", "Printed"];
    checkX = margin + 80;
    printTypes.forEach((type) => {
      drawCheckbox(page, checkX, y, data.printType === type, regular);
      page.drawText(type, { x: checkX + 14, y, size: 9, font: regular, color: rgb(0, 0, 0) });
      checkX += 70;
    });
    y -= 22;

    // Quantity and Price
    page.drawText(`Quantity: ${item.quantity}`, { x: margin + 10, y, size: 10, font: regular, color: rgb(0, 0, 0) });
    page.drawText(`Price per Unit: $${item.price.toFixed(2)}`, { x: margin + 150, y, size: 10, font: regular, color: rgb(0, 0, 0) });
    y -= 30;
  });

  // Summary Section
  drawSectionTitle(page, "SUMMARY", margin, y, contentWidth, bold);
  y -= 30;

  page.drawText(`Total Quantity: ${totalQty}`, { x: margin + 10, y, size: 11, font: bold, color: rgb(0, 0, 0) });
  page.drawText(`Total Price: $${totalPrice.toFixed(2)}`, { x: margin + 250, y, size: 11, font: bold, color: rgb(0, 0, 0) });
  y -= 40;

  // Confirmation Section
  drawSectionTitle(page, "CONFIRMATION", margin, y, contentWidth, bold);
  y -= 50;

  drawSignatureLine(page, "Customer Signature", margin + 10, y, regular);
  drawSignatureLine(page, "Authorized Signature", margin + 280, y, regular);

  const pdfBytes = await pdfDoc.save();
  const filename = `order_${order.id}_box_${sanitizeFilename(customer.name)}.pdf`;

  return { filename, bytes: pdfBytes };
}

async function generateEnvelopePdf(
  order: Order,
  customer: Customer,
  items: OrderItemRecord[]
): Promise<{ filename: string; bytes: Uint8Array }> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]);
  const { width, height } = page.getSize();

  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const regular = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const margin = 50;
  const contentWidth = width - margin * 2;
  let y = height - margin;

  // Title
  const title = "ENVELOPE ORDER FORM";
  const titleWidth = bold.widthOfTextAtSize(title, 18);
  page.drawText(title, {
    x: (width - titleWidth) / 2,
    y,
    size: 18,
    font: bold,
    color: rgb(0, 0, 0),
  });
  y -= 40;

  // Customer Details Section
  drawSectionTitle(page, "CUSTOMER DETAILS", margin, y, contentWidth, bold);
  y -= 30;

  drawLabelValue(page, "Customer Name:", customer.name, margin + 10, y, bold, regular);
  y -= 20;
  drawLabelValue(page, "Phone Number:", customer.phone, margin + 10, y, bold, regular);
  y -= 20;
  drawLabelValue(page, "Order Date:", formatDate(order.orderDate), margin + 10, y, bold, regular);
  y -= 35;

  let totalQty = 0;
  let totalPrice = 0;

  items.forEach((item, idx) => {
    const data = JSON.parse(item.itemData);
    totalQty += item.quantity;
    totalPrice += item.quantity * item.price;

    drawSectionTitle(page, `ENVELOPE DETAILS - Item ${idx + 1}`, margin, y, contentWidth, bold);
    y -= 30;

    // Size checkboxes - Row 1
    page.drawText("Size:", { x: margin + 10, y, size: 10, font: bold, color: rgb(0, 0, 0) });
    const sizes1 = ["Big100", "3 1/2 * 4 1/2", "Small New"];
    let checkX = margin + 50;
    sizes1.forEach((size) => {
      drawCheckbox(page, checkX, y, data.envelopeSize === size, regular);
      page.drawText(size, { x: checkX + 14, y, size: 9, font: regular, color: rgb(0, 0, 0) });
      checkX += 100;
    });
    y -= 20;

    // Size checkboxes - Row 2
    const sizes2 = ["3*4", "Other"];
    checkX = margin + 50;
    sizes2.forEach((size) => {
      drawCheckbox(page, checkX, y, data.envelopeSize === size, regular);
      page.drawText(size, { x: checkX + 14, y, size: 9, font: regular, color: rgb(0, 0, 0) });
      checkX += 100;
    });
    
    // Show custom size value if "Other" is selected
    if (data.envelopeSize === "Other" && data.otherEnvelopeSize) {
      page.drawText(`(${data.otherEnvelopeSize})`, { x: checkX + 14, y, size: 9, font: regular, color: rgb(0, 0, 0) });
    }
    y -= 22;

    // Type checkboxes
    page.drawText("Type:", { x: margin + 10, y, size: 10, font: bold, color: rgb(0, 0, 0) });
    const types = ["Plain", "Print"];
    checkX = margin + 50;
    types.forEach((type) => {
      drawCheckbox(page, checkX, y, data.envelopePrintType === type, regular);
      page.drawText(type, { x: checkX + 14, y, size: 9, font: regular, color: rgb(0, 0, 0) });
      checkX += 70;
    });
    y -= 22;

    page.drawText(`Quantity: ${item.quantity}`, { x: margin + 10, y, size: 10, font: regular, color: rgb(0, 0, 0) });
    page.drawText(`Price per Unit: $${item.price.toFixed(2)}`, { x: margin + 150, y, size: 10, font: regular, color: rgb(0, 0, 0) });
    y -= 30;
  });

  // Summary Section
  drawSectionTitle(page, "SUMMARY", margin, y, contentWidth, bold);
  y -= 30;

  page.drawText(`Total Quantity: ${totalQty}`, { x: margin + 10, y, size: 11, font: bold, color: rgb(0, 0, 0) });
  page.drawText(`Total Price: $${totalPrice.toFixed(2)}`, { x: margin + 250, y, size: 11, font: bold, color: rgb(0, 0, 0) });
  y -= 40;

  // Confirmation Section
  drawSectionTitle(page, "CONFIRMATION", margin, y, contentWidth, bold);
  y -= 50;

  drawSignatureLine(page, "Customer Signature", margin + 10, y, regular);
  drawSignatureLine(page, "Authorized Signature", margin + 280, y, regular);

  const pdfBytes = await pdfDoc.save();
  const filename = `order_${order.id}_envelope_${sanitizeFilename(customer.name)}.pdf`;

  return { filename, bytes: pdfBytes };
}

async function generateBagPdf(
  order: Order,
  customer: Customer,
  items: OrderItemRecord[]
): Promise<{ filename: string; bytes: Uint8Array }> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]);
  const { width, height } = page.getSize();

  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const regular = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const margin = 50;
  const contentWidth = width - margin * 2;
  let y = height - margin;

  // Title
  const title = "BAG ORDER FORM";
  const titleWidth = bold.widthOfTextAtSize(title, 18);
  page.drawText(title, {
    x: (width - titleWidth) / 2,
    y,
    size: 18,
    font: bold,
    color: rgb(0, 0, 0),
  });
  y -= 40;

  // Customer Details Section
  drawSectionTitle(page, "CUSTOMER DETAILS", margin, y, contentWidth, bold);
  y -= 30;

  drawLabelValue(page, "Customer Name:", customer.name, margin + 10, y, bold, regular);
  y -= 20;
  drawLabelValue(page, "Phone Number:", customer.phone, margin + 10, y, bold, regular);
  y -= 20;
  drawLabelValue(page, "Order Date:", formatDate(order.orderDate), margin + 10, y, bold, regular);
  y -= 35;

  let totalQty = 0;
  let totalPrice = 0;

  items.forEach((item, idx) => {
    const data = JSON.parse(item.itemData);
    totalQty += item.quantity;
    totalPrice += item.quantity * item.price;

    drawSectionTitle(page, `BAG DETAILS - Item ${idx + 1}`, margin, y, contentWidth, bold);
    y -= 30;

    // Dore Type checkboxes
    page.drawText("Dore Type:", { x: margin + 10, y, size: 10, font: bold, color: rgb(0, 0, 0) });
    const doreTypes = ["Ribbon", "Rope"];
    let checkX = margin + 80;
    doreTypes.forEach((type) => {
      drawCheckbox(page, checkX, y, data.doreType === type, regular);
      page.drawText(type, { x: checkX + 14, y, size: 9, font: regular, color: rgb(0, 0, 0) });
      checkX += 70;
    });
    y -= 22;

    // Bag Size checkboxes - Row 1
    page.drawText("Bag Size:", { x: margin + 10, y, size: 10, font: bold, color: rgb(0, 0, 0) });
    const sizes1 = ["9*6*3", "D*C*B", "10*7*4", "10*8*4"];
    checkX = margin + 70;
    sizes1.forEach((size) => {
      drawCheckbox(page, checkX, y, data.bagSize === size, regular);
      page.drawText(size, { x: checkX + 14, y, size: 8, font: regular, color: rgb(0, 0, 0) });
      checkX += 65;
    });
    y -= 18;

    // Bag Size checkboxes - Row 2
    const sizes2 = ["13*9*3", "12*10*4", "14*10*4", "11*16*4"];
    checkX = margin + 70;
    sizes2.forEach((size) => {
      drawCheckbox(page, checkX, y, data.bagSize === size, regular);
      page.drawText(size, { x: checkX + 14, y, size: 8, font: regular, color: rgb(0, 0, 0) });
      checkX += 65;
    });
    y -= 18;

    // Bag Size checkboxes - Row 3
    const sizes3 = ["12*16*4", "16*12*4", "13*17*5", "Other"];
    checkX = margin + 70;
    sizes3.forEach((size) => {
      drawCheckbox(page, checkX, y, data.bagSize === size, regular);
      page.drawText(size, { x: checkX + 14, y, size: 8, font: regular, color: rgb(0, 0, 0) });
      checkX += 65;
    });
    
    // Show custom size value if "Other" is selected
    if (data.bagSize === "Other" && data.otherBagSize) {
      y -= 18;
      page.drawText(`Custom Size: ${data.otherBagSize}`, { x: margin + 70, y, size: 9, font: regular, color: rgb(0, 0, 0) });
    }
    y -= 22;

    // Print Type checkboxes
    page.drawText("Print Type:", { x: margin + 10, y, size: 10, font: bold, color: rgb(0, 0, 0) });
    const printTypes = ["Plain", "Print"];
    checkX = margin + 80;
    printTypes.forEach((type) => {
      drawCheckbox(page, checkX, y, data.bagPrintType === type, regular);
      page.drawText(type, { x: checkX + 14, y, size: 9, font: regular, color: rgb(0, 0, 0) });
      checkX += 70;
    });
    y -= 22;

    page.drawText(`Quantity: ${item.quantity}`, { x: margin + 10, y, size: 10, font: regular, color: rgb(0, 0, 0) });
    page.drawText(`Price per Unit: $${item.price.toFixed(2)}`, { x: margin + 150, y, size: 10, font: regular, color: rgb(0, 0, 0) });
    y -= 30;
  });

  // Summary Section
  drawSectionTitle(page, "SUMMARY", margin, y, contentWidth, bold);
  y -= 30;

  page.drawText(`Total Quantity: ${totalQty}`, { x: margin + 10, y, size: 11, font: bold, color: rgb(0, 0, 0) });
  page.drawText(`Total Price: $${totalPrice.toFixed(2)}`, { x: margin + 250, y, size: 11, font: bold, color: rgb(0, 0, 0) });
  y -= 40;

  // Confirmation Section
  drawSectionTitle(page, "CONFIRMATION", margin, y, contentWidth, bold);
  y -= 50;

  drawSignatureLine(page, "Customer Signature", margin + 10, y, regular);
  drawSignatureLine(page, "Authorized Signature", margin + 280, y, regular);

  const pdfBytes = await pdfDoc.save();
  const filename = `order_${order.id}_bag_${sanitizeFilename(customer.name)}.pdf`;

  return { filename, bytes: pdfBytes };
}

export async function generateOrderPdfs(
  order: Order,
  customer: Customer,
  items: OrderItemRecord[]
): Promise<PdfInfo[]> {
  ensurePdfDirectory();

  console.log(`[PDF] Generating PDFs for Order #${order.id}`);

  const boxItems = items.filter(item => item.itemType === "box");
  const envelopeItems = items.filter(item => item.itemType === "envelope");
  const bagItems = items.filter(item => item.itemType === "bag");

  const pdfInfos: PdfInfo[] = [];

  if (boxItems.length > 0) {
    const { filename, bytes } = await generateBoxPdf(order, customer, boxItems);
    const filePath = path.join(PDF_OUTPUT_DIR, filename);
    fs.writeFileSync(filePath, bytes);
    pdfInfos.push({ type: "Box", url: `/api/pdf/${filename}`, filename });
    console.log(`[PDF] Box PDF generated: ${filename}`);
  }

  if (envelopeItems.length > 0) {
    const { filename, bytes } = await generateEnvelopePdf(order, customer, envelopeItems);
    const filePath = path.join(PDF_OUTPUT_DIR, filename);
    fs.writeFileSync(filePath, bytes);
    pdfInfos.push({ type: "Envelope", url: `/api/pdf/${filename}`, filename });
    console.log(`[PDF] Envelope PDF generated: ${filename}`);
  }

  if (bagItems.length > 0) {
    const { filename, bytes } = await generateBagPdf(order, customer, bagItems);
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

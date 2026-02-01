import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import fs from "fs";
import path from "path";
import type { Customer, Order, OrderItemRecord, PdfInfo } from "../shared/schema";

const PDF_OUTPUT_DIR = path.join(process.cwd(), "generated-pdfs");

function ensurePdfDirectory() {
  if (!fs.existsSync(PDF_OUTPUT_DIR)) {
    fs.mkdirSync(PDF_OUTPUT_DIR, { recursive: true });
  }
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();
}

async function generateUnifiedProductionPdf(
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
  let y = height - margin - 50; // Start higher from top

  // Title
  page.drawText("PRODUCTION ORDER", {
    x: margin,
    y,
    size: 16,
    font: bold,
    color: rgb(0, 0, 0),
  });
  y -= 30;

  // Order details
  page.drawText(`Order #: ${order.id}`, {
    x: margin,
    y,
    size: 12,
    font: regular,
    color: rgb(0, 0, 0),
  });
  y -= 20;

  page.drawText(`Date: ${order.orderDate}`, {
    x: margin,
    y,
    size: 12,
    font: regular,
    color: rgb(0, 0, 0),
  });
  y -= 30;

  // Customer section
  page.drawText("CUSTOMER:", {
    x: margin,
    y,
    size: 12,
    font: bold,
    color: rgb(0, 0, 0),
  });
  y -= 20;

  page.drawText(`${customer.name} - ${customer.phone}`, {
    x: margin,
    y,
    size: 12,
    font: regular,
    color: rgb(0, 0, 0),
  });
  y -= 40;

  // Production specifications
  page.drawText("PRODUCTION SPECIFICATIONS", {
    x: margin,
    y,
    size: 12,
    font: bold,
    color: rgb(0, 0, 0),
  });
  y -= 30;

  let totalAmount = 0;
  items.forEach((item, idx) => {
    let data;
    try {
      data = JSON.parse(item.itemData);
    } catch (e) {
      data = {};
    }
    const itemTotal = item.quantity * item.price;
    totalAmount += itemTotal;

    const itemTypeUpper = item.itemType.toUpperCase();
    page.drawText(`ITEM ${idx + 1}: ${itemTypeUpper}`, {
      x: margin,
      y,
      size: 11,
      font: bold,
      color: rgb(0, 0, 0),
    });
    y -= 18;

    // Handle different item types
    if (item.itemType === 'box') {
      page.drawText(`• Box Type: ${data.boxType || 'Not specified'}`, {
        x: margin,
        y,
        size: 10,
        font: regular,
        color: rgb(0, 0, 0),
      });
      y -= 15;

      page.drawText(`• Dimensions: ${data.length || 0} x ${data.breadth || 0} x ${data.height || 0} cm`, {
        x: margin,
        y,
        size: 10,
        font: regular,
        color: rgb(0, 0, 0),
      });
      y -= 15;

      page.drawText(`• Print Type: ${data.printType || 'Not specified'}`, {
        x: margin,
        y,
        size: 10,
        font: regular,
        color: rgb(0, 0, 0),
      });
      y -= 15;

      if (data.color) {
        page.drawText(`• Color: ${data.color}`, {
          x: margin,
          y,
          size: 10,
          font: regular,
          color: rgb(0, 0, 0),
        });
        y -= 15;
      }

      if (data.details) {
        page.drawText(`• Details: ${data.details}`, {
          x: margin,
          y,
          size: 10,
          font: regular,
          color: rgb(0, 0, 0),
        });
        y -= 15;
      }
    } else if (item.itemType === 'envelope') {
      page.drawText(`• Envelope Size: ${data.envelopeSize || 'Not specified'}`, {
        x: margin,
        y,
        size: 10,
        font: regular,
        color: rgb(0, 0, 0),
      });
      y -= 15;

      page.drawText(`• Print Type: ${data.envelopePrintType || 'Not specified'}`, {
        x: margin,
        y,
        size: 10,
        font: regular,
        color: rgb(0, 0, 0),
      });
      y -= 15;

      if (data.envelopePrintMethod) {
        page.drawText(`• Print Method: ${data.envelopePrintMethod}`, {
          x: margin,
          y,
          size: 10,
          font: regular,
          color: rgb(0, 0, 0),
        });
        y -= 15;
      }
    } else if (item.itemType === 'bag') {
      page.drawText(`• Bag Size: ${data.bagSize || 'Not specified'}`, {
        x: margin,
        y,
        size: 10,
        font: regular,
        color: rgb(0, 0, 0),
      });
      y -= 15;

      if (data.bagSize === 'Other' && (data.bagHeight || data.bagWidth || data.bagGusset)) {
        page.drawText(`• Custom Dimensions: ${data.bagWidth || 0} x ${data.bagHeight || 0} x ${data.bagGusset || 0} cm`, {
          x: margin,
          y,
          size: 10,
          font: regular,
          color: rgb(0, 0, 0),
        });
        y -= 15;
      }

      page.drawText(`• Handle Type: ${data.doreType || 'Not specified'}`, {
        x: margin,
        y,
        size: 10,
        font: regular,
        color: rgb(0, 0, 0),
      });
      y -= 15;

      if (data.handleColor) {
        page.drawText(`• Handle Color: ${data.handleColor}`, {
          x: margin,
          y,
          size: 10,
          font: regular,
          color: rgb(0, 0, 0),
        });
        y -= 15;
      }

      page.drawText(`• Print Type: ${data.bagPrintType || 'Not specified'}`, {
        x: margin,
        y,
        size: 10,
        font: regular,
        color: rgb(0, 0, 0),
      });
      y -= 15;

      if (data.printMethod) {
        page.drawText(`• Print Method: ${data.printMethod}`, {
          x: margin,
          y,
          size: 10,
          font: regular,
          color: rgb(0, 0, 0),
        });
        y -= 15;
      }

      if (data.laminationType) {
        page.drawText(`• Lamination: ${data.laminationType}`, {
          x: margin,
          y,
          size: 10,
          font: regular,
          color: rgb(0, 0, 0),
        });
        y -= 15;
      }
    }

    page.drawText(`• Quantity: ${item.quantity}`, {
      x: margin,
      y,
      size: 10,
      font: regular,
      color: rgb(0, 0, 0),
    });
    y -= 15;

    page.drawText(`• Unit Price: Rs${item.price.toFixed(2)}`, {
      x: margin,
      y,
      size: 10,
      font: regular,
      color: rgb(0, 0, 0),
    });
    y -= 25;
  });

  // Total
  page.drawText(`TOTAL ORDER VALUE: Rs${totalAmount.toFixed(2)}`, {
    x: margin,
    y,
    size: 12,
    font: bold,
    color: rgb(0, 0, 0),
  });

  const pdfBytes = await pdfDoc.save();
  const filename = `production_order_${order.id}_${sanitizeFilename(customer.name)}.pdf`;

  return { filename, bytes: pdfBytes };
}

export async function generateOrderPdfs(
  order: Order,
  customer: Customer,
  items: OrderItemRecord[]
): Promise<{ bytes: Uint8Array; filename: string }> {
  const result = await generateUnifiedProductionPdf(order, customer, items);
  return result;
}

export function getPdfPath(filename: string): string {
  return path.join(PDF_OUTPUT_DIR, filename);
}

export function pdfExists(filename: string): boolean {
  return fs.existsSync(getPdfPath(filename));
}
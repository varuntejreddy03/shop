import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import path from "path";
import fs from "fs";
import { database } from "./supabase-database";
import { generateOrderPdfs, getPdfPath, pdfExists } from "./pdf-generator";
import { createOrderSchema } from "../shared/schema";
import { fromZodError } from "zod-validation-error";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  app.post("/api/create-order", async (req: Request, res: Response) => {
    try {
      const validationResult = createOrderSchema.safeParse(req.body);

      if (!validationResult.success) {
        const validationError = fromZodError(validationResult.error);
        return res.status(400).json({
          success: false,
          message: validationError.message,
        });
      }

      const input = validationResult.data;

      const { order, customer } = await database.createOrder(input);

      const orderWithItems = await database.getOrderWithItems(order.id);
      if (!orderWithItems) {
        throw new Error("Failed to retrieve order after creation");
      }

      const pdfData = await generateOrderPdfs(
        orderWithItems.order,
        orderWithItems.customer,
        orderWithItems.items
      );

      // Return PDF as blob response
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="${pdfData.filename}"`);
      return res.send(Buffer.from(pdfData.bytes));
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : "Internal server error",
      });
    }
  });

  app.get("/api/pdf/:filename", (req: Request, res: Response) => {
    try {
      const filename = req.params.filename as string;

      if (!filename.endsWith(".pdf") || filename.includes("..")) {
        return res.status(400).json({ message: "Invalid filename" });
      }

      if (!pdfExists(filename)) {
        return res.status(404).json({ message: "PDF not found" });
      }

      const filePath = getPdfPath(filename);
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `inline; filename="${filename}"`);

      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);
    } catch (error) {
      return res.status(500).json({ message: "Error serving PDF" });
    }
  });

  app.get("/api/orders", async (req: Request, res: Response) => {
    try {
      const orders = await database.getAllOrders();
      return res.json({ success: true, orders });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : "Internal server error",
      });
    }
  });

  app.get("/api/orders/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id as string);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid order ID" });
      }

      const orderData = await database.getOrderWithItems(id);
      if (!orderData) {
        return res.status(404).json({ message: "Order not found" });
      }

      return res.json({
        success: true,
        ...orderData,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : "Internal server error",
      });
    }
  });

  return httpServer;
}

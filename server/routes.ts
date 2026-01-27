import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import path from "path";
import fs from "fs";
import { database } from "./database";
import { generateOrderPdfs, getPdfPath, pdfExists } from "./pdf-generator";
import { createOrderSchema, type CreateOrderResponse } from "@shared/schema";
import { fromZodError } from "zod-validation-error";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  app.post("/api/create-order", async (req: Request, res: Response) => {
    try {
      console.log("[API] Received create order request");

      const validationResult = createOrderSchema.safeParse(req.body);

      if (!validationResult.success) {
        const validationError = fromZodError(validationResult.error);
        console.log("[API] Validation failed:", validationError.message);
        return res.status(400).json({
          success: false,
          message: validationError.message,
        });
      }

      const input = validationResult.data;

      const { order, customer } = database.createOrder(input);
      console.log(`[API] Order #${order.id} saved to database`);

      const orderWithItems = database.getOrderWithItems(order.id);
      if (!orderWithItems) {
        throw new Error("Failed to retrieve order after creation");
      }

      const pdfInfos = await generateOrderPdfs(
        orderWithItems.order,
        orderWithItems.customer,
        orderWithItems.items
      );

      // Store first PDF path for backwards compatibility
      if (pdfInfos.length > 0) {
        database.updateOrderPdfPath(order.id, pdfInfos[0].filename);
      }
      console.log(`[API] Order #${order.id} ${pdfInfos.length} PDF(s) generated`);

      const response: CreateOrderResponse = {
        success: true,
        orderId: order.id,
        pdfUrls: pdfInfos,
        message: "Order created successfully",
      };

      console.log(`[API] Order #${order.id} creation complete, triggering print`);
      return res.json(response);
    } catch (error) {
      console.error("[API] Error creating order:", error);
      return res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : "Internal server error",
      });
    }
  });

  app.get("/api/pdf/:filename", (req: Request, res: Response) => {
    try {
      const filename = req.params.filename as string;
      console.log(`[API] PDF download requested: ${filename}`);

      if (!filename.endsWith(".pdf") || filename.includes("..")) {
        return res.status(400).json({ message: "Invalid filename" });
      }

      if (!pdfExists(filename)) {
        console.log(`[API] PDF not found: ${filename}`);
        return res.status(404).json({ message: "PDF not found" });
      }

      const filePath = getPdfPath(filename);
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `inline; filename="${filename}"`);

      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);
    } catch (error) {
      console.error("[API] Error serving PDF:", error);
      return res.status(500).json({ message: "Error serving PDF" });
    }
  });

  app.get("/api/orders", (req: Request, res: Response) => {
    try {
      const orders = database.getAllOrders();
      return res.json({ success: true, orders });
    } catch (error) {
      console.error("[API] Error fetching orders:", error);
      return res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : "Internal server error",
      });
    }
  });

  app.get("/api/orders/:id", (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id as string);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid order ID" });
      }

      const orderData = database.getOrderWithItems(id);
      if (!orderData) {
        return res.status(404).json({ message: "Order not found" });
      }

      return res.json({
        success: true,
        ...orderData,
      });
    } catch (error) {
      console.error("[API] Error fetching order:", error);
      return res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : "Internal server error",
      });
    }
  });

  return httpServer;
}

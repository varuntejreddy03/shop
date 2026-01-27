import { z } from "zod";

export const ItemType = {
  BOX: "box",
  ENVELOPE: "envelope",
  BAG: "bag",
} as const;

export type ItemTypeValue = typeof ItemType[keyof typeof ItemType];

export const boxItemSchema = z.object({
  itemType: z.literal(ItemType.BOX),
  boxType: z.string().min(1, "Box type is required"),
  length: z.number().min(0.1, "Length must be at least 0.1"),
  breadth: z.number().min(0.1, "Breadth must be at least 0.1"),
  height: z.number().min(0.1, "Height must be at least 0.1"),
  printType: z.string().min(1, "Print type is required"),
  quantity: z.number().int().positive("Quantity must be positive"),
  price: z.number().nonnegative("Price must be non-negative"),
});

export const envelopeItemSchema = z.object({
  itemType: z.literal(ItemType.ENVELOPE),
  envelopeSize: z.string().min(1, "Envelope size is required"),
  otherEnvelopeSize: z.string().optional(),
  envelopePrintType: z.string().min(1, "Print type is required"),
  quantity: z.number().int().positive("Quantity must be positive"),
  price: z.number().nonnegative("Price must be non-negative"),
}).refine((data) => {
  if (data.envelopeSize === "Other") {
    return data.otherEnvelopeSize && data.otherEnvelopeSize.trim().length > 0;
  }
  return true;
}, {
  message: "Please specify the envelope size",
  path: ["otherEnvelopeSize"],
});

export const bagItemSchema = z.object({
  itemType: z.literal(ItemType.BAG),
  doreType: z.string().min(1, "Dore type is required"),
  bagSize: z.string().min(1, "Bag size is required"),
  otherBagSize: z.string().optional(),
  bagPrintType: z.string().min(1, "Print type is required"),
  quantity: z.number().int().positive("Quantity must be positive"),
  price: z.number().nonnegative("Price must be non-negative"),
}).refine((data) => {
  if (data.bagSize === "Other") {
    return data.otherBagSize && data.otherBagSize.trim().length > 0;
  }
  return true;
}, {
  message: "Please specify the bag size",
  path: ["otherBagSize"],
});

export const orderItemSchema = z.discriminatedUnion("itemType", [
  boxItemSchema,
  envelopeItemSchema.innerType(),
  bagItemSchema.innerType(),
]);

export const createOrderSchema = z.object({
  customerName: z.string().min(1, "Customer name is required"),
  phoneNumber: z.string().min(1, "Phone number is required"),
  orderDate: z.string().min(1, "Order date is required"),
  items: z.array(orderItemSchema).min(1, "At least one item is required"),
}).superRefine((data, ctx) => {
  data.items.forEach((item, index) => {
    if (item.itemType === "envelope" && item.envelopeSize === "Other") {
      if (!item.otherEnvelopeSize || item.otherEnvelopeSize.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Please specify the envelope size",
          path: ["items", index, "otherEnvelopeSize"],
        });
      }
    }
    if (item.itemType === "bag" && item.bagSize === "Other") {
      if (!item.otherBagSize || item.otherBagSize.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Please specify the bag size",
          path: ["items", index, "otherBagSize"],
        });
      }
    }
  });
});

export type BoxItem = z.infer<typeof boxItemSchema>;
export type EnvelopeItem = z.infer<typeof envelopeItemSchema>;
export type BagItem = z.infer<typeof bagItemSchema>;
export type OrderItem = z.infer<typeof orderItemSchema>;
export type CreateOrderInput = z.infer<typeof createOrderSchema>;

export interface Customer {
  id: number;
  name: string;
  phone: string;
  createdAt: string;
}

export interface Order {
  id: number;
  customerId: number;
  orderDate: string;
  totalAmount: number;
  pdfPath: string | null;
  createdAt: string;
}

export interface OrderItemRecord {
  id: number;
  orderId: number;
  itemType: ItemTypeValue;
  itemData: string;
  quantity: number;
  price: number;
}

export interface PdfInfo {
  type: string;
  url: string;
  filename: string;
}

export interface CreateOrderResponse {
  success: boolean;
  orderId: number;
  pdfUrls: PdfInfo[];
  message: string;
}

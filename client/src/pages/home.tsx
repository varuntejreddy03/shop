import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Package, Mail, ShoppingBag, Plus, Trash2, Printer, FileText, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { createOrderSchema, type CreateOrderInput, type CreateOrderResponse, ItemType } from "@shared/schema";

const boxTypes = ["Top-Bottom", "Magnet", "Ribbon"];
const boxPrintTypes = ["Plain", "Printed"];
const envelopeSizes = ["Big100", "3½×4½", "Small New", "3×4", "Other"];
const envelopePrintTypes = ["Plain", "Print"];
const bagSizes = ["9×6×3", "D×C×B", "10×7×4", "10×8×4", "13×9×3", "12×10×4", "14×10×4", "11×16×4", "12×16×4", "16×12×4", "13×17×5", "Other"];
const bagPrintTypes = ["Plain", "Print"];
const doreTypes = ["Ribbon", "Rope"];

export default function Home() {
  const { toast } = useToast();
  const [successData, setSuccessData] = useState<CreateOrderResponse | null>(null);

  const form = useForm<CreateOrderInput>({
    resolver: zodResolver(createOrderSchema),
    defaultValues: {
      customerName: "",
      phoneNumber: "",
      orderDate: new Date().toISOString().split("T")[0],
      items: [{ itemType: "box", boxType: "", length: 1, breadth: 1, height: 1, printType: "", quantity: 1, price: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const createOrderMutation = useMutation({
    mutationFn: async (data: CreateOrderInput) => {
      const response = await apiRequest("POST", "/api/create-order", data);
      return (await response.json()) as CreateOrderResponse;
    },
    onSuccess: (data) => {
      setSuccessData(data);
      toast({
        title: "Order Created Successfully",
        description: `Order #${data.orderId} has been saved and PDF generated.`,
      });

      console.log(`[Print] Opening PDF for Order #${data.orderId}: ${data.pdfUrl}`);
      const pdfWindow = window.open(data.pdfUrl, "_blank");
      if (pdfWindow) {
        console.log(`[Print] PDF window opened, waiting for load to trigger print dialog`);
        pdfWindow.onload = () => {
          setTimeout(() => {
            console.log(`[Print] Triggering print dialog for Order #${data.orderId}`);
            pdfWindow.print();
          }, 500);
        };
      } else {
        console.warn(`[Print] Could not open PDF window - popup may have been blocked`);
        toast({
          title: "Popup Blocked",
          description: "Please allow popups to automatically open the print dialog, or use the View PDF button.",
          variant: "destructive",
        });
      }

      form.reset({
        customerName: "",
        phoneNumber: "",
        orderDate: new Date().toISOString().split("T")[0],
        items: [{ itemType: "box", boxType: "", length: 1, breadth: 1, height: 1, printType: "", quantity: 1, price: 0 }],
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error Creating Order",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CreateOrderInput) => {
    setSuccessData(null);
    createOrderMutation.mutate(data);
  };

  const addItem = (type: "box" | "envelope" | "bag") => {
    if (type === "box") {
      append({ itemType: "box", boxType: "", length: 1, breadth: 1, height: 1, printType: "", quantity: 1, price: 0 });
    } else if (type === "envelope") {
      append({ itemType: "envelope", envelopeSize: "", envelopePrintType: "", quantity: 1, price: 0 });
    } else {
      append({ itemType: "bag", doreType: "", bagSize: "", bagPrintType: "", quantity: 1, price: 0 });
    }
  };

  const getItemIcon = (type: string) => {
    switch (type) {
      case "box": return <Package className="h-4 w-4" />;
      case "envelope": return <Mail className="h-4 w-4" />;
      case "bag": return <ShoppingBag className="h-4 w-4" />;
      default: return null;
    }
  };

  const getItemLabel = (type: string) => {
    switch (type) {
      case "box": return "Box";
      case "envelope": return "Envelope";
      case "bag": return "Bag";
      default: return "Item";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary">
              <FileText className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-foreground" data-testid="text-page-title">
                Order Management System
              </h1>
              <p className="text-sm text-muted-foreground">
                Create print-ready order forms
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          {successData && (
            <Card className="mb-6 border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950">
              <CardContent className="flex items-center gap-4 py-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-green-800 dark:text-green-200" data-testid="text-success-message">
                    Order #{successData.orderId} created successfully!
                  </p>
                  <p className="text-sm text-green-600 dark:text-green-400">
                    PDF has been generated and print dialog opened.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(successData.pdfUrl, "_blank")}
                  className="border-green-300 text-green-700 hover:bg-green-100 dark:border-green-700 dark:text-green-300 dark:hover:bg-green-900"
                  data-testid="button-view-pdf"
                >
                  <Printer className="mr-2 h-4 w-4" />
                  View PDF
                </Button>
              </CardContent>
            </Card>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Customer Information</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="customerName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Customer Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter customer name"
                            {...field}
                            data-testid="input-customer-name"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phoneNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter phone number"
                            {...field}
                            data-testid="input-phone-number"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="orderDate"
                    render={({ field }) => (
                      <FormItem className="sm:col-span-2">
                        <FormLabel>Order Date</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            {...field}
                            data-testid="input-order-date"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
                  <CardTitle className="text-lg">Order Items</CardTitle>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addItem("box")}
                      data-testid="button-add-box"
                    >
                      <Package className="mr-1 h-4 w-4" />
                      Box
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addItem("envelope")}
                      data-testid="button-add-envelope"
                    >
                      <Mail className="mr-1 h-4 w-4" />
                      Envelope
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addItem("bag")}
                      data-testid="button-add-bag"
                    >
                      <ShoppingBag className="mr-1 h-4 w-4" />
                      Bag
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {fields.length === 0 && (
                    <div className="rounded-md border border-dashed p-8 text-center">
                      <p className="text-muted-foreground">
                        No items added. Click the buttons above to add items.
                      </p>
                    </div>
                  )}
                  {fields.map((field, index) => (
                    <Card key={field.id} className="border-muted">
                      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                        <div className="flex items-center gap-2">
                          {getItemIcon(field.itemType)}
                          <span className="font-medium" data-testid={`text-item-type-${index}`}>
                            {getItemLabel(field.itemType)} #{index + 1}
                          </span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => remove(index)}
                          className="text-destructive hover:text-destructive"
                          data-testid={`button-remove-item-${index}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </CardHeader>
                      <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {field.itemType === "box" && (
                          <>
                            <FormField
                              control={form.control}
                              name={`items.${index}.boxType`}
                              render={({ field: f }) => (
                                <FormItem>
                                  <FormLabel>Box Type</FormLabel>
                                  <Select onValueChange={f.onChange} value={f.value}>
                                    <FormControl>
                                      <SelectTrigger data-testid={`select-box-type-${index}`}>
                                        <SelectValue placeholder="Select type" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {boxTypes.map((type) => (
                                        <SelectItem key={type} value={type}>
                                          {type}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`items.${index}.length`}
                              render={({ field: f }) => (
                                <FormItem>
                                  <FormLabel>Length (cm)</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      min="0.1"
                                      step="0.1"
                                      {...f}
                                      onChange={(e) => f.onChange(parseFloat(e.target.value) || 1)}
                                      data-testid={`input-length-${index}`}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`items.${index}.breadth`}
                              render={({ field: f }) => (
                                <FormItem>
                                  <FormLabel>Breadth (cm)</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      min="0.1"
                                      step="0.1"
                                      {...f}
                                      onChange={(e) => f.onChange(parseFloat(e.target.value) || 1)}
                                      data-testid={`input-breadth-${index}`}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`items.${index}.height`}
                              render={({ field: f }) => (
                                <FormItem>
                                  <FormLabel>Height (cm)</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      min="0.1"
                                      step="0.1"
                                      {...f}
                                      onChange={(e) => f.onChange(parseFloat(e.target.value) || 1)}
                                      data-testid={`input-height-${index}`}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`items.${index}.printType`}
                              render={({ field: f }) => (
                                <FormItem>
                                  <FormLabel>Print Type</FormLabel>
                                  <Select onValueChange={f.onChange} value={f.value}>
                                    <FormControl>
                                      <SelectTrigger data-testid={`select-print-type-${index}`}>
                                        <SelectValue placeholder="Select print" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {boxPrintTypes.map((type) => (
                                        <SelectItem key={type} value={type}>
                                          {type}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </>
                        )}

                        {field.itemType === "envelope" && (
                          <>
                            <FormField
                              control={form.control}
                              name={`items.${index}.envelopeSize`}
                              render={({ field: f }) => (
                                <FormItem>
                                  <FormLabel>Envelope Size</FormLabel>
                                  <Select onValueChange={f.onChange} value={f.value}>
                                    <FormControl>
                                      <SelectTrigger data-testid={`select-envelope-size-${index}`}>
                                        <SelectValue placeholder="Select size" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {envelopeSizes.map((size) => (
                                        <SelectItem key={size} value={size}>
                                          {size}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`items.${index}.envelopePrintType`}
                              render={({ field: f }) => (
                                <FormItem>
                                  <FormLabel>Print Type</FormLabel>
                                  <Select onValueChange={f.onChange} value={f.value}>
                                    <FormControl>
                                      <SelectTrigger data-testid={`select-envelope-print-${index}`}>
                                        <SelectValue placeholder="Select print" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {envelopePrintTypes.map((type) => (
                                        <SelectItem key={type} value={type}>
                                          {type}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </>
                        )}

                        {field.itemType === "bag" && (
                          <>
                            <FormField
                              control={form.control}
                              name={`items.${index}.doreType`}
                              render={({ field: f }) => (
                                <FormItem>
                                  <FormLabel>Dore Type</FormLabel>
                                  <Select onValueChange={f.onChange} value={f.value}>
                                    <FormControl>
                                      <SelectTrigger data-testid={`select-dore-type-${index}`}>
                                        <SelectValue placeholder="Select handle" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {doreTypes.map((type) => (
                                        <SelectItem key={type} value={type}>
                                          {type}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`items.${index}.bagSize`}
                              render={({ field: f }) => (
                                <FormItem>
                                  <FormLabel>Bag Size</FormLabel>
                                  <Select onValueChange={f.onChange} value={f.value}>
                                    <FormControl>
                                      <SelectTrigger data-testid={`select-bag-size-${index}`}>
                                        <SelectValue placeholder="Select size" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {bagSizes.map((size) => (
                                        <SelectItem key={size} value={size}>
                                          {size}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`items.${index}.bagPrintType`}
                              render={({ field: f }) => (
                                <FormItem>
                                  <FormLabel>Print Type</FormLabel>
                                  <Select onValueChange={f.onChange} value={f.value}>
                                    <FormControl>
                                      <SelectTrigger data-testid={`select-bag-print-${index}`}>
                                        <SelectValue placeholder="Select print" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {bagPrintTypes.map((type) => (
                                        <SelectItem key={type} value={type}>
                                          {type}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </>
                        )}

                        <FormField
                          control={form.control}
                          name={`items.${index}.quantity`}
                          render={({ field: f }) => (
                            <FormItem>
                              <FormLabel>Quantity</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min="1"
                                  {...f}
                                  onChange={(e) => f.onChange(parseInt(e.target.value) || 1)}
                                  data-testid={`input-quantity-${index}`}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`items.${index}.price`}
                          render={({ field: f }) => (
                            <FormItem>
                              <FormLabel>Price</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  {...f}
                                  onChange={(e) => f.onChange(parseFloat(e.target.value) || 0)}
                                  data-testid={`input-price-${index}`}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </CardContent>
                    </Card>
                  ))}
                </CardContent>
              </Card>

              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    form.reset();
                    setSuccessData(null);
                  }}
                  data-testid="button-reset"
                >
                  Reset Form
                </Button>
                <Button
                  type="submit"
                  disabled={createOrderMutation.isPending}
                  data-testid="button-submit"
                >
                  {createOrderMutation.isPending ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Printer className="mr-2 h-4 w-4" />
                      Create Order & Print
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </main>
    </div>
  );
}

import { z } from "zod";

const coordinateRegex = /^-?\d+(\.\d+)?$/;

export const placeSchema = z
  .object({
    placeName: z
      .string()
      .min(3, { message: "Place name must be at least 3 characters long" })
      .max(100, { message: "Place name cannot exceed 100 characters" }),
    description: z
      .string()
      .min(10, { message: "Description must be at least 10 characters long" })
      .max(5000, { message: "Description cannot exceed 5000 characters" }),
    placeType: z.enum(["Spot", "Cafe", "Market", ""]).refine((val) => val === "Spot" || val === "Cafe" || val === "Market", {
      message: "Place type must be Spot, Cafe, or Market",
    }),
    mainCategory: z
      .string()
      .min(1, { message: "Main category is required" })
      .max(50, { message: "Main category cannot exceed 50 characters" }),
    categories: z
      .array(
        z
          .string()
          .min(1, { message: "Category name cannot be empty" })
          .max(50, { message: "Category name cannot exceed 50 characters" })
      )
      .min(1, { message: "Select at least one category" })
      .max(20, { message: "Cannot select more than 20 categories" })
      .refine((items) => new Set(items.map((i) => i.trim().toLowerCase())).size === items.length, {
        message: "Categories must be unique",
      }),
    images: z
      .array(
        z
          .string()
          .min(1, { message: "Image path or URL cannot be empty" })
      )
      .max(10, { message: "Cannot attach more than 10 images" }),
    city: z
      .string()
      .min(1, { message: "City is required" })
      .max(100, { message: "City cannot exceed 100 characters" }),
    area: z
      .string()
      .min(1, { message: "Area is required" })
      .max(100, { message: "Area cannot exceed 100 characters" }),
    state: z
      .string()
      .min(1, { message: "State is required" })
      .max(100, { message: "State cannot exceed 100 characters" }),
    latitude: z
      .string()
      .max(20, { message: "Latitude string too long" })
      .refine((val) => coordinateRegex.test(val.trim()), {
        message: "Latitude must be a valid decimal number",
      })
      .refine(
        (val) => {
          const num = parseFloat(val);
          return !isNaN(num) && num >= -90 && num <= 90;
        },
        { message: "Latitude must be a valid number between -90 and 90" }
      ),
    longitude: z
      .string()
      .max(20, { message: "Longitude string too long" })
      .refine((val) => coordinateRegex.test(val.trim()), {
        message: "Longitude must be a valid decimal number",
      })
      .refine(
        (val) => {
          const num = parseFloat(val);
          return !isNaN(num) && num >= -180 && num <= 180;
        },
        { message: "Longitude must be a valid number between -180 and 180" }
      ),
    bestTimings: z
      .array(z.number().int().min(0).max(23))
      .min(1, { message: "Select at least one timing range" })
      .max(24),
    closedDays: z
      .array(
        z.enum([
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
          "Sunday",
          "Never Closed",
        ])
      )
      .min(1, { message: "Select closed days or select 'Never Closed'" })
      .max(8),
    nearestMetro: z
      .string()
      .min(1, { message: "Nearest metro is required" })
      .max(100, { message: "Nearest metro cannot exceed 100 characters" }),
    crowdLevel: z
      .enum(["Low", "Medium", "High", ""])
      .refine((val) => val === "Low" || val === "Medium" || val === "High", {
        message: "Crowd level must be Low, Medium, or High",
      }),
    safetyNote: z
      .string()
      .min(1, { message: "Safety note is required" })
      .max(1000, { message: "Safety note cannot exceed 1000 characters" }),
    entryFee: z.string().max(200, { message: "Entry fee cannot exceed 200 characters" }),
    ticketRequired: z.enum(["Yes", "No", ""]).refine((val) => val === "Yes" || val === "No", {
      message: "Select whether a ticket is required",
    }),
    infoCards: z
      .array(
        z.object({
          label: z.string(),
          value: z.string(),
        })
      )
      .optional(),
  })
  .strict()
  .superRefine((data, ctx) => {
    // Check categories for mutual exclusivity: "Free" and "Paid"
    const hasFree = data.categories.includes("Free");
    const hasPaid = data.categories.includes("Paid");
    if (hasFree && hasPaid) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "A place cannot be both 'Free' and 'Paid'. Please select only one.",
        path: ["categories"],
      });
    }
  });

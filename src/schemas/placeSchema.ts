import { z } from "zod";

const coordinateRegex = /^-?\d+(\.\d+)?$/;

export const placeSchema = z
  .object({
    title: z
      .string()
      .min(3, { message: "Title must be at least 3 characters long" })
      .max(100, { message: "Title cannot exceed 100 characters" }),
    categories: z
      .array(
        z.string()
          .min(1, { message: "Category name cannot be empty" })
          .max(50, { message: "Category name cannot exceed 50 characters" })
      )
      .min(1, { message: "Select at least one category" })
      .max(20, { message: "Cannot select more than 20 categories" })
      .refine((items) => new Set(items.map(i => i.trim().toLowerCase())).size === items.length, {
        message: "Categories must be unique",
      }),
    description: z
      .string()
      .min(10, { message: "Description must be at least 10 characters long" })
      .max(5000, { message: "Description cannot exceed 5000 characters" }),
    location: z
      .string()
      .min(2, { message: "Location must be at least 2 characters long" })
      .max(200, { message: "Location cannot exceed 200 characters" }),
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
    infoCards: z
      .array(
        z.object({
          label: z.string().min(1, "Label is required").max(50, "Label cannot exceed 50 characters"),
          value: z.string().min(1, "Value is required").max(200, "Value cannot exceed 200 characters"),
        }).strict()
      )
      .max(10, "Cannot add more than 10 custom cards"),
    safetyNote: z
      .string()
      .min(1, { message: "Safety note is required" })
      .max(1000, { message: "Safety note cannot exceed 1000 characters" }),

    // Information Fields (Standardized)
    mainCategory: z
      .string()
      .min(1, { message: "Main category is required" })
      .max(50, { message: "Main category cannot exceed 50 characters" }),
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
          "Never Closed"
        ])
      )
      .min(1, { message: "Select closed days or select 'Never Closed'" })
      .max(8),
    nearestMetro: z
      .string()
      .min(1, { message: "Nearest metro is required" })
      .max(100, { message: "Nearest metro cannot exceed 100 characters" }),
    crowdLevel: z
      .string()
      .min(1, { message: "Crowd level is required" })
      .max(50, { message: "Crowd level cannot exceed 50 characters" }),

    // Pricing Fields (Standardized)
    fee: z
      .string()
      .max(200, { message: "Fee cannot exceed 200 characters" }),
    ticketRequired: z.enum(["Yes", "No", ""]).refine((val) => val === "Yes" || val === "No", {
      message: "Select whether a ticket is required",
    }),
  })
  .strict()
  .superRefine((data, ctx) => {
    // 1. Check categories for mutual exclusivity: "Free" and "Paid"
    const hasFree = data.categories.includes("Free");
    const hasPaid = data.categories.includes("Paid");
    if (hasFree && hasPaid) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "A place cannot be both 'Free' and 'Paid'. Please select only one.",
        path: ["categories"],
      });
    }

    // 2. Check manual info cards for duplicate reserved labels (case-insensitive)
    const reservedLabels = [
      "main category",
      "best timings",
      "closed on",
      "nearest metro",
      "crowd level",
      "safety note",
      "fee",
    ];

    const seenLabels = new Set<string>();

    data.infoCards.forEach((card, index) => {
      const labelTrimmed = card.label.trim().toLowerCase();
      if (reservedLabels.includes(labelTrimmed)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `"${card.label}" is already collected in the Information or Pricing section above.`,
          path: ["infoCards", index, "label"],
        });
      } else if (seenLabels.has(labelTrimmed)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Duplicate information card label: "${card.label}".`,
          path: ["infoCards", index, "label"],
        });
      } else {
        seenLabels.add(labelTrimmed);
      }
    });
  });

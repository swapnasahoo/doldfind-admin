import { z } from "zod";

export const placeSchema = z
  .object({
    title: z
      .string()
      .min(3, { message: "Title must be at least 3 characters long" })
      .max(100, { message: "Title cannot exceed 100 characters" }),
    categories: z
      .array(z.string())
      .min(1, { message: "Select at least one category" }),
    description: z
      .string()
      .min(10, { message: "Description must be at least 10 characters long" }),
    location: z
      .string()
      .min(2, { message: "Location must be at least 2 characters long" }),
    latitude: z
      .string()
      .refine(
        (val) => {
          const num = parseFloat(val);
          return !isNaN(num) && num >= -90 && num <= 90;
        },
        { message: "Latitude must be a valid number between -90 and 90" }
      ),
    longitude: z
      .string()
      .refine(
        (val) => {
          const num = parseFloat(val);
          return !isNaN(num) && num >= -180 && num <= 180;
        },
        { message: "Longitude must be a valid number between -180 and 180" }
      ),
    infoCards: z.array(
      z.object({
        label: z.string(),
        value: z.string(),
      })
    ),
    safetyNote: z.string().min(1, { message: "Safety note is required" }),

    // Information Fields (Standardized)
    mainCategory: z.string().min(1, { message: "Main category is required" }),
    bestTimings: z
      .array(z.number())
      .min(1, { message: "Select at least one timing range" }),
    closedDays: z
      .array(z.string())
      .min(1, { message: "Select closed days or select 'Never Closed'" }),
    nearestMetro: z.string().min(1, { message: "Nearest metro is required" }),
    crowdLevel: z.string().min(1, { message: "Crowd level is required" }),

    // Pricing Fields (Standardized)
    fee: z.string(),
    ticketRequired: z.enum(["Yes", "No", ""]).refine((val) => val === "Yes" || val === "No", {
      message: "Select whether a ticket is required",
    }),
  })
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

    data.infoCards.forEach((card, index) => {
      const labelTrimmed = card.label.trim().toLowerCase();
      if (reservedLabels.includes(labelTrimmed)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `"${card.label}" is already collected in the Information or Pricing section above.`,
          path: ["infoCards", index, "label"],
        });
      }
    });
  });

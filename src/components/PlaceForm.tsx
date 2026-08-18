"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useForm, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, FileCode, CheckCircle2, AlertTriangle, RefreshCw, Copy, Check, Sparkles } from "lucide-react";

import { placeSchema } from "@/schemas/placeSchema";
import { PlaceFormValues, PlaceDetails } from "@/types/place";
import { normalizePlaceDetails, mapPlaceDetailsToFormValues } from "@/utils/parser";

import { Input } from "./ui/Input";
import { Textarea } from "./ui/Textarea";
import { Button } from "./ui/Button";
import { MultiSelect } from "./ui/MultiSelect";
import { Modal } from "./ui/Modal";
import { QuickInfoSection } from "./QuickInfoSection";
import { ImageSection } from "./ImageSection";

interface PlaceFormProps {
  initialPlace?: PlaceDetails;
  onSuccess?: (updatedPlace: PlaceDetails) => void;
  onCancel?: () => void;
}

export const PlaceForm: React.FC<PlaceFormProps> = ({
  initialPlace,
  onSuccess,
  onCancel,
}) => {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState<PlaceDetails | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<PlaceDetails | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [similarWarning, setSimilarWarning] = useState<string | null>(null);
  const [copiedLive, setCopiedLive] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    getValues,
    reset,
    formState: { errors, isValid, isSubmitting },
  } = useForm<PlaceFormValues>({
    resolver: zodResolver(placeSchema) as any,
    mode: "onTouched",
    defaultValues: {
      placeName: "",
      description: "",
      credits: "",
      placeType: "Spot",
      mainCategory: "",
      categories: [],
      images: [],
      city: "",
      area: "",
      state: "",
      latitude: "",
      longitude: "",
      bestTimings: [],
      closedDays: [],
      nearestMetro: "",
      crowdLevel: "",
      safetyNote: "",
      entryFee: "",
      ticketRequired: "",
      bestSeason: {
        startMonth: "October",
        endMonth: "March",
      },
      openingHours: {
        mode: "24h",
        sameTime: {
          start: "09:00 AM",
          end: "06:00 PM",
        },
        days: {
          Monday: { status: "open", start: "09:00 AM", end: "06:00 PM" },
          Tuesday: { status: "open", start: "09:00 AM", end: "06:00 PM" },
          Wednesday: { status: "open", start: "09:00 AM", end: "06:00 PM" },
          Thursday: { status: "open", start: "09:00 AM", end: "06:00 PM" },
          Friday: { status: "open", start: "09:00 AM", end: "06:00 PM" },
          Saturday: { status: "open", start: "09:00 AM", end: "06:00 PM" },
          Sunday: { status: "open", start: "09:00 AM", end: "06:00 PM" },
        },
      },
      transportType: "Bus",
    },
  });

  // Watch form values in real time to calculate live attributes JSON payload
  const watchedFormValues = useWatch({ control });
  const livePayload = useMemo(() => {
    return normalizePlaceDetails((watchedFormValues || {}) as PlaceFormValues);
  }, [watchedFormValues]);

  // Dynamically load place data into form fields when initialPlace changes (edit mode)
  useEffect(() => {
    if (initialPlace) {
      reset(mapPlaceDetailsToFormValues(initialPlace));
    } else {
      reset({
        placeName: "",
        description: "",
        credits: "",
        placeType: "Spot",
        mainCategory: "",
        categories: [],
        images: [],
        city: "",
        area: "",
        state: "",
        latitude: "",
        longitude: "",
        bestTimings: [],
        closedDays: [],
        nearestMetro: "",
        crowdLevel: "",
        safetyNote: "",
        entryFee: "",
        ticketRequired: "",
        bestSeason: {
          startMonth: "October",
          endMonth: "March",
        },
        openingHours: {
          mode: "24h",
          sameTime: {
            start: "09:00 AM",
            end: "06:00 PM",
          },
          days: {
            Monday: { status: "open", start: "09:00 AM", end: "06:00 PM" },
            Tuesday: { status: "open", start: "09:00 AM", end: "06:00 PM" },
            Wednesday: { status: "open", start: "09:00 AM", end: "06:00 PM" },
            Thursday: { status: "open", start: "09:00 AM", end: "06:00 PM" },
            Friday: { status: "open", start: "09:00 AM", end: "06:00 PM" },
            Saturday: { status: "open", start: "09:00 AM", end: "06:00 PM" },
            Sunday: { status: "open", start: "09:00 AM", end: "06:00 PM" },
          },
        },
        transportType: "Bus",
      });
    }
  }, [initialPlace, reset]);

  const handleOpenPreview = () => {
    const rawValues = getValues();
    const normalized = normalizePlaceDetails(rawValues);
    setPreviewData(normalized);
    setIsPreviewOpen(true);
  };

  const onSubmit = async (data: PlaceFormValues) => {
    await executeSubmit(data, false);
  };

  const executeSubmit = async (data: PlaceFormValues, force: boolean) => {
    setApiError(null);
    setSubmitSuccess(null);
    if (!force) {
      setSimilarWarning(null);
    }
    try {
      const isEdit = !!initialPlace;
      let url = isEdit ? `/api/places/${initialPlace.id}` : "/api/places/submit";
      if (!isEdit && force) {
        url += "?force=true";
      }
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (res.ok && result.success) {
        const normalized = normalizePlaceDetails(data);
        if (isEdit) {
          normalized.id = initialPlace.id;
          normalized.uploaderId = initialPlace.uploaderId;
          normalized.createdAt = initialPlace.createdAt;
          normalized.updatedAt = new Date().toISOString();
          if (onSuccess) {
            onSuccess(normalized);
          }
        } else {
          if (result.submissionId) {
            normalized.id = result.submissionId;
          }
          setSubmitSuccess(normalized);
          setSimilarWarning(null);
        }
      } else {
        if (result.error?.code === "SIMILAR_PLACE_WARNING") {
          setSimilarWarning(result.error.message);
        } else {
          setApiError(result.error?.message || "An unexpected error occurred during submission.");
        }
      }
    } catch (err) {
      setApiError("Failed to connect to the server. Please check your network and try again.");
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleReset = () => {
    reset();
    setSubmitSuccess(null);
    setApiError(null);
    setSimilarWarning(null);
  };

  return (
    <div className="w-full flex flex-col gap-6">
      {/* Error Alert */}
      {apiError && (
        <div className="bg-red-955/60 border border-red-800/80 rounded-xl p-5 md:p-6 backdrop-blur-md flex gap-3 animate-fadeIn">
          <AlertTriangle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
          <div className="flex flex-col gap-1">
            <h4 className="text-sm font-bold text-red-300">
              Submission Failed
            </h4>
            <p className="text-xs text-red-450/80 leading-relaxed">
              {apiError}
            </p>
          </div>
        </div>
      )}

      {/* Similarity Warning Alert */}
      {similarWarning && (
        <div className="bg-amber-950/60 border border-amber-800/80 rounded-xl p-5 md:p-6 backdrop-blur-md flex flex-col md:flex-row items-start justify-between gap-4 animate-fadeIn">
          <div className="flex gap-3">
            <AlertTriangle className="w-6 h-6 text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="flex flex-col gap-1">
              <h4 className="text-sm font-bold text-amber-300">
                Uniqueness Check Review Required
              </h4>
              <p className="text-xs text-amber-400/80 max-w-2xl leading-relaxed">
                {similarWarning}
              </p>
            </div>
          </div>
          <div className="flex gap-2 mt-3 md:mt-0 flex-shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setSimilarWarning(null)}
              className="bg-amber-955/20 border-amber-850 hover:bg-amber-900/40 text-amber-300"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => {
                const values = getValues();
                executeSubmit(values, true);
              }}
              className="bg-amber-600 hover:bg-amber-700 text-white font-medium flex-shrink-0"
            >
              Ignore & Submit
            </Button>
          </div>
        </div>
      )}

      {/* Success Alert */}
      {submitSuccess && (
        <div className="bg-emerald-950/60 border border-emerald-800/80 rounded-xl p-5 md:p-6 backdrop-blur-md flex flex-col md:flex-row items-start justify-between gap-4 animate-fadeIn">
          <div className="flex gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-400 flex-shrink-0 mt-0.5" />
            <div className="flex flex-col gap-1">
              <h4 className="text-sm font-bold text-emerald-300">
                Place details submitted successfully!
              </h4>
              <p className="text-xs text-emerald-400/80 max-w-2xl leading-relaxed">
                The contribution has been successfully processed, validated, and saved to the DoldFind database queue.
              </p>
              <div className="mt-3 flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setPreviewData(submitSuccess);
                    setIsPreviewOpen(true);
                  }}
                  className="bg-emerald-950/20 border-emerald-800 hover:bg-emerald-900/40 text-emerald-300"
                >
                  <Eye className="w-3.5 h-3.5 mr-1.5" />
                  View Final Payload
                </Button>
              </div>
            </div>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleReset}
            className="border-emerald-800/60 hover:bg-emerald-900/30 text-emerald-300 mt-2 md:mt-0 flex-shrink-0 flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Create Another
          </Button>
        </div>
      )}

      {/* Main Form Dashboard */}
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6 select-text">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column - General Details */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-5 md:p-6 backdrop-blur-md flex flex-col gap-5">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 border-b border-slate-850 pb-2">
                Core Information
              </h3>

              {/* Place Name */}
              <Input
                label="Place Name"
                placeholder="e.g. Secret Hidden Waterfall, Cozy Peak Lookout, Central Cafe"
                error={errors.placeName?.message}
                {...register("placeName")}
              />

              {/* Categories */}
              <Controller
                control={control}
                name="categories"
                render={({ field }) => (
                  <MultiSelect
                    label="Categories"
                    placeholder="Search or add categories (e.g. Waterfall, Nature, Organic)"
                    selected={field.value}
                    onChange={field.onChange}
                    error={errors.categories?.message}
                  />
                )}
              />

              {/* Description */}
              <Textarea
                label="Description"
                placeholder="Share instructions, history, atmosphere, or vibe of this place..."
                error={errors.description?.message}
                {...register("description")}
              />

              {/* Credits & Attribution (Required) */}
              <Input
                label="Credits & Attribution (Required)"
                placeholder="e.g. Photo by Swapna Sahoo (Unsplash / CC BY 4.0), Original Spot Contributor"
                error={errors.credits?.message}
                {...register("credits")}
              />
            </div>

            {/* Images & Gallery Section */}
            <ImageSection control={control} errors={errors} />

            {/* Quick Information Section */}
            <QuickInfoSection
              control={control}
              register={register}
              errors={errors}
            />
          </div>

          {/* Right Column - Geolocation */}
          <div className="flex flex-col gap-6">
            <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-5 md:p-6 backdrop-blur-md flex flex-col gap-5">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-350 border-b border-slate-850 pb-2">
                Coordinates
              </h3>

              {/* Coordinates Grid */}
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Latitude"
                  placeholder="e.g. 36.2704"
                  error={errors.latitude?.message}
                  {...register("latitude")}
                />
                <Input
                  label="Longitude"
                  placeholder="e.g. -121.8081"
                  error={errors.longitude?.message}
                  {...register("longitude")}
                />
              </div>

              <div className="bg-slate-950/50 rounded-lg p-3.5 border border-slate-850">
                <p className="text-[10px] text-slate-500 leading-relaxed">
                  Coordinates must be decimal format (Latitude: -90 to 90, Longitude: -180 to 180). Check GPS or maps to acquire precise values.
                </p>
              </div>
            </div>

            {/* Live Attributes Payload JSON Card */}
            <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-5 md:p-6 backdrop-blur-md flex flex-col gap-4 sticky top-20">
              <div className="flex items-center justify-between border-b border-slate-850 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                    Live Payload JSON
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(JSON.stringify(livePayload, null, 2));
                      setCopiedLive(true);
                      setTimeout(() => setCopiedLive(false), 2000);
                    }}
                    className="text-[10px] py-1 px-2.5 flex items-center gap-1 bg-slate-950 border-slate-800 hover:bg-slate-900"
                  >
                    {copiedLive ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-slate-400" />}
                    {copiedLive ? "Copied!" : "Copy JSON"}
                  </Button>
                </div>
              </div>

              <p className="text-[11px] text-slate-400 leading-relaxed">
                Real-time normalized attributes payload schema updating live as you edit form fields or attach image links.
              </p>

              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-850 max-h-[420px] overflow-y-auto font-mono text-[11px] leading-relaxed scrollbar-thin select-text">
                <pre className="text-emerald-400/90 whitespace-pre-wrap font-mono">
                  {JSON.stringify(livePayload, null, 2)}
                </pre>
              </div>
            </div>

          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/40 border border-slate-800 rounded-xl p-5 backdrop-blur-md">
          <div className="flex items-center gap-2 text-slate-400 select-none">
            {!isValid && (
              <div className="flex items-center gap-1.5 text-amber-500/80">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-xs">Form has unresolved validation errors</span>
              </div>
            )}
            {isValid && (
              <div className="flex items-center gap-1.5 text-emerald-500/80">
                <CheckCircle2 className="w-4 h-4" />
                <span className="text-xs">Form details are valid and ready</span>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            {onCancel && (
              <Button
                variant="secondary"
                type="button"
                onClick={onCancel}
                className="w-full sm:w-auto border-slate-800 text-slate-400 hover:text-slate-200"
              >
                Cancel
              </Button>
            )}

            {/* Preview Button */}
            <Button
              variant="secondary"
              onClick={handleOpenPreview}
              type="button"
              className="w-full sm:w-auto flex items-center justify-center gap-2"
            >
              <FileCode className="w-4 h-4 text-slate-400" />
              Preview JSON
            </Button>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting}
              className="w-full sm:w-auto"
            >
              {initialPlace ? "Save Changes" : "Submit Contribution"}
            </Button>
          </div>
        </div>
      </form>

      {/* JSON Preview Modal */}
      <Modal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        title="Normalized PlaceDetails Preview (JSON)"
        jsonContent={previewData}
      />
    </div>
  );
};

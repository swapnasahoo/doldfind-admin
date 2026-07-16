"use client";

import React, { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, FileCode, CheckCircle2, AlertTriangle, RefreshCw } from "lucide-react";

import { placeSchema } from "@/schemas/placeSchema";
import { PlaceFormValues, PlaceDetails } from "@/types/place";
import { normalizePlaceDetails } from "@/utils/parser";

import { Input } from "./ui/Input";
import { Textarea } from "./ui/Textarea";
import { Button } from "./ui/Button";
import { MultiSelect } from "./ui/MultiSelect";
import { Modal } from "./ui/Modal";
import { InfoCardsArray } from "./InfoCardsArray";
import { QuickInfoSection } from "./QuickInfoSection";

export const PlaceForm: React.FC = () => {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState<PlaceDetails | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<PlaceDetails | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    getValues,
    reset,
    formState: { errors, isValid, isSubmitting },
  } = useForm<PlaceFormValues>({
    resolver: zodResolver(placeSchema),
    mode: "onTouched",
    defaultValues: {
      title: "",
      categories: [],
      description: "",
      location: "",
      latitude: "",
      longitude: "",
      infoCards: [],
      safetyNote: "",
      mainCategory: "",
      bestTimings: [],
      closedDays: [],
      nearestMetro: "",
      crowdLevel: "",
      fee: "",
      ticketRequired: "",
    },
  });

  const handleOpenPreview = () => {
    // Get raw form values
    const rawValues = getValues();
    // Normalize using our parser utility
    const normalized = normalizePlaceDetails(rawValues);
    setPreviewData(normalized);
    setIsPreviewOpen(true);
  };

  const onSubmit = async (data: PlaceFormValues) => {
    setApiError(null);
    setSubmitSuccess(null);
    try {
      const res = await fetch("/api/places/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (res.ok && result.success) {
        const normalized = normalizePlaceDetails(data);
        if (result.submissionId) {
          normalized.id = result.submissionId;
        }
        setSubmitSuccess(normalized);
      } else {
        setApiError(result.error?.message || "An unexpected error occurred during submission.");
      }
    } catch (err) {
      setApiError("Failed to connect to the server. Please check your network and try again.");
    }
    // Scroll to success/error banner
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleReset = () => {
    reset();
    setSubmitSuccess(null);
    setApiError(null);
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
                The contribution has been successfully processed, validated, and saved to the DoldFind Google Sheets queue.
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

              {/* Title */}
              <Input
                label="Place Title"
                placeholder="e.g. Secret Hidden Waterfall, Cozy Peak Lookout"
                error={errors.title?.message}
                {...register("title")}
              />

              {/* Categories */}
              <Controller
                control={control}
                name="categories"
                render={({ field }) => (
                  <MultiSelect
                    label="Categories"
                    placeholder="Search or add categories (e.g. Waterfall, Nature)"
                    selected={field.value}
                    onChange={field.onChange}
                    error={errors.categories?.message}
                  />
                )}
              />

              {/* Description */}
              <Textarea
                label="Description"
                placeholder="Share instructions, history, or vibe of this spot..."
                error={errors.description?.message}
                {...register("description")}
              />
            </div>

            {/* Quick Information Section */}
            <QuickInfoSection
              control={control}
              register={register}
              errors={errors}
            />

            {/* Information Cards Array */}
            <InfoCardsArray
              control={control}
              register={register}
              errors={errors}
            />
          </div>

          {/* Right Column - Location & Extras */}
          <div className="flex flex-col gap-6">
            {/* Geolocation Card */}
            <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-5 md:p-6 backdrop-blur-md flex flex-col gap-5">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 border-b border-slate-850 pb-2">
                Location & Coordinates
              </h3>

              {/* Location Name */}
              <Input
                label="Location Name"
                placeholder="e.g. Big Sur, California"
                error={errors.location?.message}
                {...register("location")}
              />

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
                  Coordinates must be in decimal format. Example: Latitude: 37.7749, Longitude: -122.4194. Check your GPS or maps tool to acquire precise values.
                </p>
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
            {/* Preview Button */}
            <Button
              variant="secondary"
              onClick={handleOpenPreview}
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
              Submit Contribution
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

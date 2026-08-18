"use client";

import React, { useState, useRef } from "react";
import { Control, Controller, FieldErrors } from "react-hook-form";
import {
  Image as ImageIcon,
  UploadCloud,
  Plus,
  X,
  Link as LinkIcon,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { PlaceFormValues } from "@/types/place";
import { Input } from "./ui/Input";
import { Button } from "./ui/Button";

interface ImageSectionProps {
  control: Control<PlaceFormValues>;
  errors: FieldErrors<PlaceFormValues>;
}

export const ImageSection: React.FC<ImageSectionProps> = ({ control, errors }) => {
  const [activeTab, setActiveTab] = useState<"upload" | "url">("upload");
  const [newImageUrl, setNewImageUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (
    files: FileList | File[],
    currentImages: string[],
    onChange: (val: string[]) => void
  ) => {
    setErrorMessage(null);
    if (!files || files.length === 0) return;

    const remainingCapacity = 10 - currentImages.length;
    if (remainingCapacity <= 0) {
      setErrorMessage("Maximum limit of 10 images reached");
      return;
    }

    const filesToUpload = Array.from(files).slice(0, remainingCapacity);
    setIsUploading(true);

    const uploadedUrls: string[] = [];

    for (let i = 0; i < filesToUpload.length; i++) {
      const file = filesToUpload[i];
      setUploadProgress(`Uploading ${i + 1}/${filesToUpload.length}: ${file.name}...`);

      try {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();

        if (res.ok && data.success && data.data?.url) {
          uploadedUrls.push(data.data.url);
        } else {
          setErrorMessage(data.error?.message || `Failed to upload ${file.name}`);
        }
      } catch (err) {
        setErrorMessage(`Network error uploading ${file.name}`);
      }
    }

    if (uploadedUrls.length > 0) {
      onChange([...currentImages, ...uploadedUrls]);
    }

    setIsUploading(false);
    setUploadProgress(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-5 md:p-6 backdrop-blur-md flex flex-col gap-5">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-850 pb-3">
        <div className="flex flex-col gap-1">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-violet-400" />
            Appwrite Cloud Storage Gallery
          </h3>
          <p className="text-xs text-slate-500">
            Upload images directly into your Appwrite Cloud Storage Bucket or attach image links.
          </p>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-850 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab("upload")}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition flex items-center gap-1.5 ${
              activeTab === "upload"
                ? "bg-violet-600 text-white shadow"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <UploadCloud className="w-3.5 h-3.5" />
            Upload File
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("url")}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition flex items-center gap-1.5 ${
              activeTab === "url"
                ? "bg-violet-600 text-white shadow"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <LinkIcon className="w-3.5 h-3.5" />
            Paste Link
          </button>
        </div>
      </div>

      <Controller
        control={control}
        name="images"
        render={({ field }) => {
          const currentImages: string[] = field.value || [];

          const handleAddUrl = () => {
            setErrorMessage(null);
            const trimmed = newImageUrl.trim();
            if (!trimmed) {
              setErrorMessage("Please enter a valid image URL");
              return;
            }
            if (currentImages.includes(trimmed)) {
              setErrorMessage("This image URL is already added");
              return;
            }
            if (currentImages.length >= 10) {
              setErrorMessage("Maximum limit of 10 images reached");
              return;
            }

            field.onChange([...currentImages, trimmed]);
            setNewImageUrl("");
          };

          const handleRemoveImage = (indexToRemove: number) => {
            field.onChange(currentImages.filter((_, idx) => idx !== indexToRemove));
          };

          return (
            <div className="flex flex-col gap-4">
              {/* Tab 1: Upload File to Appwrite Bucket */}
              {activeTab === "upload" && (
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (!isUploading) {
                      handleFileUpload(e.dataTransfer.files, currentImages, field.onChange);
                    }
                  }}
                  className="border-2 border-dashed border-slate-800 hover:border-violet-600/60 bg-slate-950/40 hover:bg-slate-950/70 rounded-xl p-6 text-center flex flex-col items-center justify-center gap-3 transition cursor-pointer select-none group"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    disabled={isUploading}
                    onChange={(e) => {
                      if (e.target.files) {
                        handleFileUpload(e.target.files, currentImages, field.onChange);
                      }
                    }}
                  />

                  {isUploading ? (
                    <div className="flex flex-col items-center gap-2 py-2">
                      <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
                      <span className="text-xs font-semibold text-violet-300">
                        {uploadProgress || "Uploading file to Appwrite Bucket..."}
                      </span>
                    </div>
                  ) : (
                    <>
                      <div className="p-3 bg-slate-900 group-hover:bg-violet-950/40 border border-slate-800 group-hover:border-violet-700/50 rounded-full transition">
                        <UploadCloud className="w-6 h-6 text-violet-400" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <p className="text-xs font-bold text-slate-300">
                          Click to select or drag & drop images here
                        </p>
                        <p className="text-[11px] text-slate-500">
                          Appwrite Bucket handles JPEG, PNG, WEBP, GIF, SVG (up to 10MB each)
                        </p>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Tab 2: Paste Direct URL */}
              {activeTab === "url" && (
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <div className="flex-1">
                    <Input
                      placeholder="Paste image URL (e.g. https://images.unsplash.com/...)"
                      value={newImageUrl}
                      onChange={(e) => {
                        setNewImageUrl(e.target.value);
                        if (errorMessage) setErrorMessage(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddUrl();
                        }
                      }}
                    />
                  </div>
                  <Button
                    type="button"
                    onClick={handleAddUrl}
                    variant="secondary"
                    className="sm:self-start bg-slate-900 border-slate-800 text-xs font-bold flex items-center justify-center gap-1.5 py-2.5 px-4"
                  >
                    <Plus className="w-4 h-4 text-violet-400" />
                    Add URL
                  </Button>
                </div>
              )}

              {/* Status & Error Messages */}
              {errorMessage && (
                <div className="flex items-center gap-2 text-xs font-medium text-red-400 bg-red-955/40 border border-red-900/50 p-2.5 rounded-lg animate-fadeIn">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {errors.images && (
                <span className="text-xs font-medium text-red-400 animate-fadeIn">
                  {errors.images.message}
                </span>
              )}

              {/* Uploaded Images Gallery Grid & Attribute Preview */}
              {currentImages.length > 0 ? (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-850 pb-2">
                    <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                      <ImageIcon className="w-3.5 h-3.5 text-violet-400" />
                      Attached Photos ({currentImages.length}/10)
                    </span>
                    <span className="text-[11px] text-slate-400">
                      First image is used as primary cover
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {currentImages.map((imgUrl, index) => {
                      const isAppwriteBucket = imgUrl.includes("/storage/buckets/");
                      let domainStr = "";
                      try {
                        domainStr = new URL(imgUrl).hostname;
                      } catch {
                        domainStr = "external-link";
                      }

                      return (
                        <div
                          key={index}
                          className="relative group rounded-xl overflow-hidden border border-slate-800 bg-slate-950 aspect-video flex items-center justify-center shadow-lg"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={imgUrl}
                            alt={`Place photo ${index + 1}`}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = "none";
                            }}
                          />

                          <div className="absolute inset-0 bg-slate-950/75 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-between p-2">
                            <div className="w-full flex items-center justify-between">
                              <span className="text-[9px] font-mono text-slate-300 truncate max-w-[100px] bg-slate-900/80 px-1.5 py-0.5 rounded">
                                #{index + 1} {domainStr}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <a
                                href={imgUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1.5 bg-slate-900/90 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition"
                                title="Open image full view"
                              >
                                <LinkIcon className="w-3.5 h-3.5" />
                              </a>
                              <button
                                type="button"
                                onClick={() => handleRemoveImage(index)}
                                className="p-1.5 bg-red-955/90 hover:bg-red-900 border border-red-800 rounded-lg text-red-300 transition"
                                title="Remove photo"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Appwrite Badge */}
                          {isAppwriteBucket && (
                            <span className="absolute bottom-1.5 left-1.5 bg-slate-950/80 backdrop-blur-md text-emerald-400 border border-emerald-900/60 text-[8px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1">
                              <CheckCircle2 className="w-2.5 h-2.5" />
                              Bucket
                            </span>
                          )}

                          {/* Primary Cover Badge */}
                          {index === 0 && (
                            <span className="absolute top-2 left-2 bg-violet-600/90 text-white text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md shadow-md">
                              Primary
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Images Attribute Payload Live Preview Box */}
                  <div className="bg-slate-950/60 border border-slate-850 rounded-xl p-3.5 flex flex-col gap-2 font-mono text-xs">
                    <div className="flex items-center justify-between text-[11px] text-slate-400 font-sans border-b border-slate-850 pb-1.5">
                      <span className="font-bold text-violet-400 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        &quot;images&quot; Attribute Live Payload ({currentImages.length} URL{currentImages.length > 1 ? "s" : ""})
                      </span>
                    </div>
                    <pre className="text-[11px] text-emerald-400/90 overflow-x-auto whitespace-pre-wrap font-mono leading-relaxed bg-slate-950 p-2.5 rounded-lg border border-slate-900">
                      {JSON.stringify(currentImages, null, 2)}
                    </pre>
                  </div>
                </div>
              ) : (
                <div className="text-center py-3 bg-slate-950/30 border border-dashed border-slate-850 rounded-xl select-none flex flex-col items-center gap-1">
                  <p className="text-xs text-slate-400">No images attached yet.</p>
                  <p className="text-[10px] text-slate-500">
                    Add image URLs or upload files to update the &quot;images&quot; payload attribute in real time.
                  </p>
                </div>
              )}
            </div>
          );
        }}
      />
    </div>
  );
};

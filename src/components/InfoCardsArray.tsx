"use client";

import React from "react";
import { useFieldArray, Control, UseFormRegister, FieldErrors } from "react-hook-form";
import { Plus, Trash2, HelpCircle, ChevronUp, ChevronDown } from "lucide-react";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { PlaceFormValues } from "@/types/place";

interface InfoCardsArrayProps {
  control: Control<PlaceFormValues>;
  register: UseFormRegister<PlaceFormValues>;
  errors: FieldErrors<PlaceFormValues>;
}

export const InfoCardsArray: React.FC<InfoCardsArrayProps> = ({
  control,
  register,
  errors,
}) => {
  const { fields, append, remove, move } = useFieldArray({
    control,
    name: "infoCards",
  });

  return (
    <div className="w-full bg-slate-900/40 border border-slate-800 rounded-xl p-5 md:p-6 backdrop-blur-md flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">
          Information Cards
        </h3>
        <p className="text-xs text-slate-500">
          Add specific detail cards (e.g. &quot;Parking&quot;: &quot;Free&quot;, &quot;Best Time&quot;: &quot;Sunrise&quot;). Icons will be assigned automatically.
        </p>
      </div>

      {/* Dynamic Fields List */}
      <div className="flex flex-col gap-4">
        {fields.length > 0 ? (
          <div className="flex flex-col gap-3">
            {fields.map((field, index) => {
              const cardError = errors.infoCards?.[index];

              return (
                <div
                  key={field.id}
                  className="flex flex-col md:flex-row items-start md:items-center gap-3 p-3 bg-slate-950/40 border border-slate-800/80 rounded-lg hover:border-slate-700/60 transition-colors animate-fadeIn"
                >
                  {/* Label */}
                  <div className="w-full md:flex-1">
                    <Input
                      {...register(`infoCards.${index}.label` as const)}
                      placeholder="e.g. Entry Fee, Difficulty"
                      error={cardError?.label?.message}
                      className="bg-slate-950"
                    />
                  </div>

                  {/* Value */}
                  <div className="w-full md:flex-1">
                    <Input
                      {...register(`infoCards.${index}.value` as const)}
                      placeholder="e.g. $10, Moderate"
                      error={cardError?.value?.message}
                      className="bg-slate-950"
                    />
                  </div>

                  {/* Reorder Buttons */}
                  <div className="flex items-center gap-1 mt-1 md:mt-0">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => move(index, index - 1)}
                      className="p-2 text-slate-500 hover:text-slate-300 bg-slate-900 border border-slate-850 disabled:opacity-40 disabled:pointer-events-none rounded-lg transition-all"
                      title="Move Up"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      disabled={index === fields.length - 1}
                      onClick={() => move(index, index + 1)}
                      className="p-2 text-slate-500 hover:text-slate-300 bg-slate-900 border border-slate-850 disabled:opacity-40 disabled:pointer-events-none rounded-lg transition-all"
                      title="Move Down"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Delete Button */}
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="p-2 text-slate-500 hover:text-red-400 bg-slate-900 border border-slate-800 hover:border-red-500/20 hover:bg-red-500/10 rounded-lg transition-all duration-200 mt-1 md:mt-0 flex-shrink-0 self-end md:self-auto"
                    title="Remove Card"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 border border-dashed border-slate-800 rounded-lg flex flex-col items-center gap-2 select-none">
            <HelpCircle className="w-8 h-8 text-slate-600 animate-pulse" />
            <span className="text-xs text-slate-500 font-medium">
              No information cards added yet.
            </span>
            <span className="text-[10px] text-slate-600">
              Adding details helps users understand key characteristics of the place.
            </span>
          </div>
        )}
      </div>

      {/* Append Trigger */}
      <Button
        variant="secondary"
        size="sm"
        onClick={() => append({ label: "", value: "" })}
        className="w-fit flex items-center gap-1.5 self-start"
      >
        <Plus className="w-4 h-4" />
        Add Information
      </Button>
    </div>
  );
};

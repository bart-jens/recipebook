"use client";

import { useState, useEffect, useCallback } from "react";
import { parseSteps } from "@/lib/parse-steps";
import { convertIngredient, formatQuantity, type UnitSystem } from "@/lib/unit-conversion";

interface Recipe {
  id: string;
  title: string;
  instructions: string | null;
}

interface Ingredient {
  id: string;
  quantity: number | null;
  unit: string | null;
  ingredient_name: string;
  notes: string | null;
}

interface Props {
  recipe: Recipe;
  ingredients: Ingredient[];
  onDismiss: () => void;
  onRatingSubmit: (rating: number, notes: string) => Promise<void>;
}

type Tab = "steps" | "ingredients";

export function CookingModeOverlay({ recipe, ingredients, onDismiss, onRatingSubmit }: Props) {
  const steps = parseSteps(recipe.instructions ?? "");
  const totalSteps = steps.length;

  const [currentStep, setCurrentStep] = useState(0);
  const [activeTab, setActiveTab] = useState<Tab>("steps");
  const [showCompletion, setShowCompletion] = useState(false);
  const [rating, setRating] = useState(0);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [unitSystem, setUnitSystem] = useState<UnitSystem>("metric");
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === totalSteps - 1;
  const progress = totalSteps > 0 ? (currentStep + 1) / totalSteps : 0;

  // Screen Wake Lock
  useEffect(() => {
    if (!("wakeLock" in navigator)) return;
    let lock: WakeLockSentinel | null = null;
    (navigator as Navigator & { wakeLock: { request: (type: string) => Promise<WakeLockSentinel> } })
      .wakeLock.request("screen")
      .then((l) => { lock = l; })
      .catch(() => {/* graceful degradation */});
    return () => { lock?.release(); };
  }, []);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (showCompletion) return;
    if (e.key === "ArrowRight") {
      if (isLastStep) { setShowCompletion(true); }
      else { setCurrentStep(s => s + 1); }
    } else if (e.key === "ArrowLeft") {
      if (!isFirstStep) setCurrentStep(s => s - 1);
    } else if (e.key === "Escape") {
      if (currentStep > 0) { setShowExitConfirm(true); }
      else { onDismiss(); }
    }
  }, [currentStep, isFirstStep, isLastStep, showCompletion, onDismiss]);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  function goNext() {
    if (isLastStep) { setShowCompletion(true); }
    else { setCurrentStep(s => s + 1); }
  }

  function goPrev() {
    if (!isFirstStep) setCurrentStep(s => s - 1);
  }

  async function handleSaveFinish() {
    if (rating === 0) { onDismiss(); return; }
    setSubmitting(true);
    try {
      await onRatingSubmit(rating, notes.trim());
    } finally {
      setSubmitting(false);
      onDismiss();
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-[#F6F4EF] flex flex-col motion-reduce:transition-none">

      {/* Exit confirm dialog */}
      {showExitConfirm && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/30">
          <div className="bg-[#F6F4EF] border border-[#D6D2C8] rounded-lg p-6 mx-6 max-w-sm w-full">
            <p className="text-[15px] font-light text-[#141210] mb-5">
              Stop cooking this recipe?
            </p>
            <div className="flex gap-3">
              <button
                className="flex-1 h-11 rounded-full border border-[#D6D2C8] text-[13px] text-[#5C5850] hover:bg-[#EDEADE] transition-colors"
                onClick={() => setShowExitConfirm(false)}
              >
                Keep going
              </button>
              <button
                className="flex-1 h-11 rounded-full bg-[#141210] text-[13px] text-white hover:bg-[#5C5850] transition-colors"
                onClick={onDismiss}
              >
                Stop
              </button>
            </div>
          </div>
        </div>
      )}

      {showCompletion ? (
        /* Completion screen */
        <div className="flex flex-col items-center justify-center flex-1 px-6 max-w-lg mx-auto w-full">
          <h1 className="text-[36px] font-light tracking-[-0.03em] text-[#141210] mb-2 text-center">
            You cooked it!
          </h1>
          <p className="text-[17px] font-light text-[#5C5850] mb-10 text-center">
            {recipe.title}
          </p>
          <p className="text-[11px] font-normal tracking-[0.02em] text-[#9C978C] mb-3">
            How did it turn out?
          </p>
          {/* Star rating */}
          <div className="flex gap-2 mb-8">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                onClick={() => setRating(n)}
                className="text-[32px] leading-none transition-transform hover:scale-110"
              >
                <span style={{ color: n <= rating ? "#8B4513" : "#D6D2C8" }}>★</span>
              </button>
            ))}
          </div>
          <textarea
            className="w-full border border-[#D6D2C8] rounded-lg p-3 text-[14px] font-light text-[#141210] bg-transparent placeholder-[#9C978C] resize-none mb-6 focus:outline-none focus:border-[#141210] transition-colors"
            placeholder="Add a note (optional)"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          <button
            className="w-full h-12 rounded-full bg-[#8B4513] text-[13px] font-normal text-white mb-3 disabled:opacity-50 hover:bg-[#6D360F] transition-colors"
            onClick={handleSaveFinish}
            disabled={submitting}
          >
            {submitting ? "Saving..." : rating > 0 ? "Save & Finish" : "Finish"}
          </button>
          <button
            className="h-11 text-[13px] text-[#9C978C] hover:text-[#5C5850] transition-colors"
            onClick={onDismiss}
            disabled={submitting}
          >
            Skip
          </button>
        </div>
      ) : (
        <>
          {/* Header */}
          <header className="flex items-center px-5 py-3 border-b border-[#D6D2C8] shrink-0">
            <button
              className="w-9 h-9 flex items-center justify-center text-[#5C5850] hover:text-[#141210] transition-colors text-2xl leading-none"
              onClick={() => currentStep > 0 ? setShowExitConfirm(true) : onDismiss()}
              aria-label="Exit cooking mode"
            >
              ×
            </button>
            <p className="flex-1 text-[13px] font-normal text-[#141210] text-center mx-3 truncate">
              {recipe.title}
            </p>
            <p className="w-9 text-right text-[11px] font-normal tracking-[0.02em] text-[#9C978C]">
              {totalSteps > 0 ? `${currentStep + 1} / ${totalSteps}` : "—"}
            </p>
          </header>

          {/* Segment control */}
          <div className="flex mx-5 mt-4 rounded-lg bg-[#EDEADE] p-[3px] shrink-0">
            {(["steps", "ingredients"] as Tab[]).map((tab) => (
              <button
                key={tab}
                className={`flex-1 py-1.5 rounded-md text-[13px] font-normal transition-colors capitalize ${
                  activeTab === tab
                    ? "bg-white text-[#141210]"
                    : "text-[#9C978C] hover:text-[#5C5850]"
                }`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Progress bar */}
          {activeTab === "steps" && (
            <div className="mx-5 mt-4 h-[2px] bg-[#D6D2C8] rounded-full overflow-hidden shrink-0 motion-reduce:transition-none">
              <div
                className="h-full bg-[#8B4513] rounded-full transition-all duration-300 motion-reduce:transition-none"
                style={{ width: `${progress * 100}%` }}
              />
            </div>
          )}

          {/* Body */}
          <div className="flex-1 overflow-y-auto">
            {activeTab === "steps" ? (
              <div className="px-5 pt-10 pb-6 max-w-2xl mx-auto">
                <p className="text-[11px] font-normal tracking-[0.02em] text-[#9C978C] mb-5">
                  Step {currentStep + 1}
                </p>
                <p className="text-[22px] font-light text-[#141210] leading-[1.5] tracking-[-0.01em]">
                  {steps[currentStep] ?? ""}
                </p>
              </div>
            ) : (
              <div className="px-5 pt-5 pb-6 max-w-2xl mx-auto">
                {/* Unit toggle */}
                <div className="flex gap-2 mb-5">
                  {(["metric", "imperial"] as UnitSystem[]).map((sys) => (
                    <button
                      key={sys}
                      className={`px-3 py-1 rounded-full border text-[11px] font-normal transition-colors capitalize ${
                        unitSystem === sys
                          ? "bg-[#141210] border-[#141210] text-white"
                          : "border-[#D6D2C8] text-[#5C5850] hover:border-[#141210]"
                      }`}
                      onClick={() => setUnitSystem(sys)}
                    >
                      {sys}
                    </button>
                  ))}
                </div>
                {ingredients.map((ing) => {
                  const converted = convertIngredient(ing.quantity, ing.unit ?? "", unitSystem);
                  const qty = converted.quantity != null ? formatQuantity(converted.quantity) : "";
                  const unit = converted.unit ?? "";
                  return (
                    <div
                      key={ing.id}
                      className="flex items-baseline gap-3 py-2.5 border-b border-[#D6D2C8] last:border-0"
                    >
                      <span className="text-[13px] font-normal text-[#5C5850] min-w-[56px]">
                        {qty}{unit ? ` ${unit}` : ""}
                      </span>
                      <span className="text-[14px] font-light text-[#141210] flex-1">
                        {ing.ingredient_name}
                      </span>
                      {ing.notes && (
                        <span className="text-[12px] font-light text-[#9C978C] w-full pl-[68px] -mt-0.5">
                          {ing.notes}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <footer className="flex gap-3 px-5 py-4 border-t border-[#D6D2C8] shrink-0">
            {!isFirstStep ? (
              <button
                className="flex-1 h-11 rounded-full border border-[#D6D2C8] text-[13px] font-normal text-[#5C5850] hover:bg-[#EDEADE] transition-colors"
                onClick={goPrev}
              >
                Previous
              </button>
            ) : (
              <div className="flex-1" />
            )}
            <button
              className="flex-1 h-11 rounded-full bg-[#8B4513] text-[13px] font-normal text-white hover:bg-[#6D360F] transition-colors"
              onClick={goNext}
            >
              {isLastStep ? "Done" : "Next"}
            </button>
          </footer>
        </>
      )}
    </div>
  );
}

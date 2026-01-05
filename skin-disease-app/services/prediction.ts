import { predictSkinDisease } from "./api";

export type Severity = "Low" | "Moderate" | "High";

export async function runSkinPrediction(image: {
  uri: string;
  name: string;
  type: string;
}) {
  const data = await predictSkinDisease(image);

  return {
    diagnosis: data.diagnosis ?? "Unknown",
    confidence:
      typeof data.confidence === "number"
        ? `${Math.round(data.confidence)}%`
        : data.confidence ?? "—",
    severity: data.severity ?? "Low",
    advice:
      data.advice ??
      "Consult a dermatologist if symptoms persist.",
    isSafe: data.isSafe ?? true,
  };
}

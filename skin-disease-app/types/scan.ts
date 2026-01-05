export type Severity = "Low" | "Moderate" | "High";

export interface ScanRecord {
  id: number;
  date: string;
  imageUri: string;
  diagnosis: string;
  confidence: string;
  severity: Severity;
  advice: string;
  isSafe: boolean;
}

export type RiskCheck = {
  code: string;
  severity: "info" | "warning" | "block";
  passed: boolean;
  message: string;
  value?: string;
  limit?: string;
};

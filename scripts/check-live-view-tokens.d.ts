export interface TokenViolation {
  rule: string;
  file: string;
  line: number;
  match: string;
  snippet: string;
}

export function scanLiveViewTokens(): {
  violations: TokenViolation[];
  filesScanned: number;
};

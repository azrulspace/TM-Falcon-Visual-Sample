// confidence: "Low" | "Medium" | "High"
export const segments = [
  { id: "SEG_02", route: "Route 01", from: "AST_002", to: "AST_003", priority: "High", confidence: "Medium", basis: "3 incidents in the last 30 days, rule v1 (sample)", action: "Inspect", path: [[418,288],[529,284],[595,311]] },
  { id: "SEG_03", route: "Route 01", from: "AST_003", to: "AST_004", priority: "Medium", confidence: "Low", basis: "2 incidents in the last 30 days, rule v1 (sample)", action: "Monitor", path: [[595,311],[639,352],[750,411]] },
  { id: "SEG_05", route: "Route 02", from: "AST_006", to: "AST_007", priority: "Medium", confidence: "Medium", basis: "2 incidents in the last 60 days, rule v1 (sample)", action: "Protect", path: [[410,479],[614,470],[704,452]] },
  { id: "SEG_04", route: "Route 02", from: "AST_005", to: "AST_006", priority: "Low", confidence: "Medium", basis: "1 incident in the last 90 days, rule v1 (sample)", action: "Monitor", path: [[208,470],[410,479]] },
  { id: "SEG_01", route: "Route 01", from: "AST_001", to: "AST_002", priority: "Low", confidence: "High", basis: "No incidents, routine inspection due, rule v1 (sample)", action: "Inspect", path: [[175,452],[237,382],[418,288]] },
  { id: "SEG_06", route: "Route 03", from: "AST_007", to: "AST_008", priority: "High", confidence: "High", basis: "4 incidents in the last 7 days, rule v2 (sample)", action: "Inspect", path: [[704,452],[750,500],[800,520]] },
  { id: "SEG_07", route: "Route 01", from: "AST_008", to: "AST_009", priority: "Medium", confidence: "Low", basis: "System alert triggered, manual review required", action: "Monitor", path: [[800,520],[850,550]] },
  { id: "SEG_08", route: "Route 04", from: "AST_010", to: "AST_011", priority: "Low", confidence: "Medium", basis: "Scheduled maintenance check", action: "Protect", path: [[100,100],[150,150]] },
  { id: "SEG_09", route: "Route 02", from: "AST_011", to: "AST_012", priority: "High", confidence: "High", basis: "Critical failure reported in sensor data", action: "Inspect", path: [[150,150],[200,200]] },
  { id: "SEG_10", route: "Route 03", from: "AST_012", to: "AST_013", priority: "Low", confidence: "Medium", basis: "1 incident in the last 120 days, rule v1", action: "Monitor", path: [[200,200],[250,250]] },
];

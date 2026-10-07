// priority: "High" | "Medium" | "Low"; state: "New" | "Acknowledged" | "Assigned" | "Closed"
export const events = [
  { id: "EVT_0001", captured: "05 Oct, 14:25", type: "Monkey near cable", device: "DEV_002", asset: "AST_003", priority: "High", state: "New", caseId: null },
  { id: "EVT_0002", captured: "05 Oct, 13:49", type: "Monkey near cable", device: "DEV_001", asset: "AST_002", priority: "Medium", state: "Acknowledged", caseId: null },
  { id: "EVT_0003", captured: "05 Oct, 09:37", type: "Monkey near cable", device: "DEV_002", asset: "AST_003", priority: "Medium", state: "Assigned", caseId: null },
  { id: "EVT_0004", captured: "04 Oct, 13:37", type: "Person near pole", device: "DEV_005", asset: "AST_007", priority: "High", state: "Assigned", caseId: "CAS_0001" },
  { id: "EVT_0005", captured: "05 Oct, 11:17", type: "Device not reporting", device: "DEV_003", asset: "AST_004", priority: "Low", state: "New", caseId: null },
  { id: "EVT_0006", captured: "03 Oct, 14:17", type: "Overheight vehicle (LiDAR candidate)", device: "DEV_004", asset: "AST_006", priority: "Low", state: "Closed", caseId: null },
  { id: "EVT_0007", captured: "05 Oct, 13:02", type: "Monkey near cable", device: null, asset: "AST_009", priority: "Medium", state: "New", caseId: null },
];

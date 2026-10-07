// Needs attention list (10 items, most urgent first)
export const attention = [
  { kind: "EVENT", id: "EVT_0001", title: "Monkey near cable", badges: ["High", "New"], detail: "Cable span CBL_002, AST_002 to AST_003", why: "Not yet acknowledged", marker: "DEV_002" },
  { kind: "CASE", id: "CAS_0001", title: "Person near pole", badges: ["Field work"], detail: "Pole AST_007", why: "Next: Submit field findings · Team A (sample)", link: "From event EVT_0004", marker: "DEV_005" },
  { kind: "DEVICE", id: "DEV_011", title: "Device offline", badges: ["Offline"], detail: "Installed on AST_070", why: "No contact since 04 Oct, 08:34", marker: "cluster3" },
  { kind: "DEVICE", id: "DEV_004", title: "Device offline", badges: ["Offline"], detail: "Installed on AST_006", why: "No contact since 03 Oct, 14:14", marker: "DEV_004" },
  { kind: "EVENT", id: "EVT_0007", title: "Monkey near cable", badges: ["Medium", "New", "No location recorded"], detail: "Asset AST_009, no device", why: "Not yet acknowledged", marker: null },
  { kind: "EVENT", id: "EVT_0005", title: "Device not reporting", badges: ["Low", "New"], detail: "DEV_003 on AST_004", why: "Not yet acknowledged", marker: "DEV_003" },
  { kind: "DEVICE", id: "DEV_003", title: "Device stale", badges: ["Stale"], detail: "Installed on AST_004", why: "Last report 05 Oct, 06:10", marker: "DEV_003" },
  { kind: "DEVICE", id: "DEV_007", title: "Device stale", badges: ["Stale"], detail: "Installed on AST_008", why: "Last report 05 Oct, 05:42", marker: "DEV_007" },
  { kind: "EVENT", id: "EVT_0002", title: "Monkey near cable", badges: ["Medium", "Acknowledged"], detail: "DEV_001 on AST_002", why: "Acknowledged, not yet assigned", marker: "DEV_001" },
  { kind: "EVENT", id: "EVT_0003", title: "Monkey near cable", badges: ["Medium", "Assigned"], detail: "DEV_002 on AST_003", why: "Assigned, waiting for a field visit", marker: "DEV_002" },
];

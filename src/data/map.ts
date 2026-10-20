// 15 Infrastructure IoT Devices matching devices.ts (11 Online, 2 Offline, 2 Stale) (B6, B7)
export const mapMarkers = [
  { id: "DEV_001", x: 260, y: 310, status: "online" },
  { id: "DEV_002", x: 238, y: 388, status: "online" },
  { id: "DEV_003", x: 555, y: 520, status: "stale" },
  { id: "DEV_004", x: 765, y: 600, status: "offline" },
  { id: "DEV_005", x: 378, y: 165, status: "online" },
  { id: "DEV_006", x: 412, y: 130, status: "online" },
  { id: "DEV_007", x: 578, y: 358, status: "online" },
  { id: "DEV_008", x: 595, y: 270, status: "stale" },
  { id: "DEV_009", x: 422, y: 552, status: "online" },
  { id: "DEV_010", x: 652, y: 572, status: "online" },
  { id: "DEV_011", x: 365, y: 202, status: "offline" },
  { id: "DEV_012", x: 178, y: 482, status: "online" },
  { id: "DEV_013", x: 272, y: 482, status: "online" },
  { id: "DEV_014", x: 295, y: 372, status: "online" },
  { id: "DEV_015", x: 605, y: 522, status: "online" },
];

// Clustered incidents with severity-tinted halo (B7)
export const mapClusters = [
  { id: "cluster1", count: 4, x: 290, y: 335, severity: "high" },
  { id: "cluster2", count: 7, x: 680, y: 380, severity: "low" },
  { id: "cluster3", count: 3, x: 520, y: 640, severity: "medium" },
];

// 6 CCTV Surveillance Camera Feeds placed along infrastructure spans matching Figma (Section 6.2)
export const mapCameras = [
  { id: "CAM_001", x: 238, y: 360, name: "CCTV Kuching River West" },
  { id: "CAM_002", x: 312, y: 265, name: "CCTV Petra North Junction" },
  { id: "CAM_003", x: 472, y: 308, name: "CCTV Delta Tower 08" },
  { id: "CAM_004", x: 442, y: 435, name: "CCTV Batu Lintang Bridge" },
  { id: "CAM_005", x: 742, y: 415, name: "CCTV Sejingkat Port" },
  { id: "CAM_006", x: 585, y: 590, name: "CCTV Samarahan Trunk" },
];

// 13 Branching Cable Route Segments across Kuching districts (Blue fibre routes: trunks solid, feeder branches dashed)
export const mapRoutes = [
  // 1. Santubong to Damai coastal spur (Fibre branch)
  [[412, 130], [398, 145], [378, 165], [365, 190]],
  // 2. Damai to Petra Jaya trunk (Fibre trunk)
  [[365, 190], [345, 225], [330, 255], [312, 292], [300, 325], [295, 355]],
  // 3. Telaga Air eastern river spur (Fibre branch)
  [[312, 292], [350, 298], [405, 312], [472, 334]],
  // 4. River Crossing to Kuching Center (Fibre trunk)
  [[295, 355], [268, 370], [238, 388], [225, 415], [240, 440], [272, 455]],
  // 5. Kuching Center to Petra Jaya South (Fibre trunk)
  [[272, 455], [305, 460], [345, 455], [390, 452], [442, 462]],
  // 6. Petra Jaya to Delta Spur (Fibre branch)
  [[442, 462], [475, 430], [515, 395], [578, 358]],
  // 7. Delta Loop to Sejingkat (Fibre trunk)
  [[578, 358], [620, 375], [665, 405], [710, 425], [742, 442]],
  // 8. Sejingkat coastal branch (Fibre branch)
  [[742, 442], [775, 430], [815, 415], [860, 400]],
  // 9. Sejingkat to Samarahan Trunk (Fibre trunk)
  [[742, 442], [720, 480], [690, 520], [652, 572], [615, 610]],
  // 10. Samarahan to Batu Lintang southern trunk (Fibre trunk)
  [[615, 610], [560, 620], [505, 605], [455, 580], [422, 552]],
  // 11. Batu Lintang to Kuching Center link (Fibre branch)
  [[422, 552], [380, 530], [335, 505], [272, 482], [272, 455]],
  // 12. Satok & Kuching Airport spur (Fibre branch)
  [[272, 482], [230, 475], [178, 482], [140, 510], [115, 540]],
  // 13. Western Matang sector loop (Fibre branch)
  [[238, 388], [195, 395], [150, 410], [120, 435], [140, 470], [178, 482]],
];

// Exactly 42 Utility Poles distributed along cable routes matching Section 6.2 & Summary 42 Poles metric
export const mapPoles = [
  [412, 130], [398, 145], [378, 165], [365, 190], [345, 225], [330, 255], [312, 292],
  [300, 325], [295, 355], [268, 370], [238, 388], [225, 415], [240, 440], [272, 455],
  [305, 460], [345, 455], [390, 452], [442, 462], [475, 430], [515, 395], [578, 358],
  [620, 375], [665, 405], [710, 425], [742, 442], [775, 430], [815, 415], [860, 400],
  [720, 480], [690, 520], [652, 572], [615, 610], [560, 620], [505, 605], [455, 580],
  [422, 552], [380, 530], [335, 505], [272, 482], [230, 475], [178, 482], [115, 540]
];

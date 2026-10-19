// 15 Infrastructure IoT Devices matching devices.ts (11 Online, 2 Offline, 2 Stale) (B6, B7)
export const mapMarkers = [
  { id: "DEV_001", x: 345, y: 225, status: "online" },
  { id: "DEV_002", x: 238, y: 388, status: "online" },
  { id: "DEV_003", x: 442, y: 462, status: "stale" },
  { id: "DEV_004", x: 742, y: 442, status: "offline" },
  { id: "DEV_005", x: 378, y: 165, status: "online" },
  { id: "DEV_006", x: 412, y: 130, status: "online" },
  { id: "DEV_007", x: 578, y: 358, status: "stale" },
  { id: "DEV_008", x: 472, y: 334, status: "online" },
  { id: "DEV_009", x: 422, y: 552, status: "online" },
  { id: "DEV_010", x: 652, y: 572, status: "online" },
  { id: "DEV_011", x: 312, y: 292, status: "offline" },
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

// CCTV Surveillance Camera feeds placed along infrastructure spans (B6, B7)
export const mapCameras = [
  { id: "CAM_001", x: 238, y: 360, name: "CCTV Kuching River West" },
  { id: "CAM_002", x: 312, y: 265, name: "CCTV Petra North Junction" },
  { id: "CAM_003", x: 472, y: 308, name: "CCTV Delta Tower 08" },
  { id: "CAM_004", x: 442, y: 435, name: "CCTV Batu Lintang Bridge" },
  { id: "CAM_005", x: 742, y: 415, name: "CCTV Sejingkat Port" },
  { id: "CAM_006", x: 585, y: 590, name: "CCTV Samarahan Trunk" },
  { id: "CAM_007", x: 378, y: 140, name: "CCTV Damai Coast" },
];

// 13 Branching Cable Route Segments across Kuching districts (Fibre: solid blue, Copper: amber dashed) (B7)
export const mapRoutes = [
  // 1. Santubong to Damai coastal spur (Fibre)
  [[412, 130], [398, 145], [378, 165], [365, 190]],
  // 2. Damai to Petra Jaya trunk (Fibre)
  [[365, 190], [345, 225], [330, 255], [312, 292], [300, 325], [295, 355]],
  // 3. Telaga Air eastern river spur (Copper)
  [[312, 292], [350, 298], [405, 312], [472, 334]],
  // 4. River Crossing to Kuching Center (Fibre)
  [[295, 355], [268, 370], [238, 388], [225, 415], [240, 440], [272, 455]],
  // 5. Kuching Center to Petra Jaya South (Fibre)
  [[272, 455], [305, 460], [345, 455], [390, 452], [442, 462]],
  // 6. Petra Jaya to Delta Spur (Copper)
  [[442, 462], [475, 430], [515, 395], [578, 358]],
  // 7. Delta Loop to Sejingkat (Fibre)
  [[578, 358], [620, 375], [665, 405], [710, 425], [742, 442]],
  // 8. Sejingkat coastal branch (Copper)
  [[742, 442], [775, 430], [815, 415], [860, 400]],
  // 9. Sejingkat to Samarahan Trunk (Fibre)
  [[742, 442], [720, 480], [690, 520], [652, 572], [615, 610]],
  // 10. Samarahan to Batu Lintang southern trunk (Fibre)
  [[615, 610], [560, 620], [505, 605], [455, 580], [422, 552]],
  // 11. Batu Lintang to Kuching Center link (Copper)
  [[422, 552], [380, 530], [335, 505], [272, 482], [272, 455]],
  // 12. Satok & Kuching Airport spur (Fibre)
  [[272, 482], [230, 475], [178, 482], [140, 510], [115, 540]],
  // 13. Western Matang sector loop (Copper)
  [[238, 388], [195, 395], [150, 410], [120, 435], [140, 470], [178, 482]],
];

// 60+ Utility Poles dotted along cable routes (B7)
export const mapPoles = [
  [412, 130], [405, 138], [398, 145], [388, 155], [378, 165], [370, 178], [365, 190],
  [355, 208], [345, 225], [338, 240], [330, 255], [320, 275], [312, 292], [305, 310],
  [300, 325], [298, 340], [295, 355], [280, 362], [268, 370], [252, 380], [238, 388],
  [230, 402], [225, 415], [232, 428], [240, 440], [255, 448], [272, 455], [288, 458],
  [305, 460], [325, 458], [345, 455], [368, 453], [390, 452], [415, 456], [442, 462],
  [458, 446], [475, 430], [495, 412], [515, 395], [545, 376], [578, 358], [600, 366],
  [620, 375], [642, 390], [665, 405], [688, 415], [710, 425], [726, 434], [742, 442],
  [758, 436], [775, 430], [795, 422], [815, 415], [838, 407], [860, 400],
  [730, 462], [720, 480], [705, 500], [690, 520], [670, 545], [652, 572], [633, 592],
  [615, 610], [588, 616], [560, 620], [532, 612], [505, 605], [480, 592], [455, 580],
  [438, 566], [422, 552], [400, 540], [380, 530], [358, 518], [335, 505], [305, 494],
  [272, 482], [250, 478], [230, 475], [205, 478], [178, 482], [160, 495], [140, 510],
  [128, 525], [115, 540], [215, 392], [195, 395], [172, 402], [150, 410], [135, 422],
  [120, 435], [130, 452], [140, 470], [160, 476],
];

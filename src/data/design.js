export const CEILING_HEIGHT = 2.83;
// Structural plan (south-up, mm) flipped to north-up metres.
// Horizontal: 3.49 + .21 + 2.79 + .22 + 5.27 + .21 + 2.98 = 15.17m.
// West depth: 5.17 + .22 + 2.87 + 1.51 = 9.77m. East public core 10.76m is excluded.
export const MODEL_SIZE = { width: 15.17, depth: 9.77 };
export const WALL_THICKNESS = { outer: 0.21, inner: 0.21, partition: 0.11 };

function roomRawArea(room) {
  if (room.parts?.length) {
    return room.parts.reduce((sum, part) => sum + part.w * part.d, 0);
  }
  return room.w * room.d;
}

export const rooms = [
  {
    id: "master",
    name: "主卧",
    tag: "南向套房",
    x: 0,
    z: 0,
    w: 3.49,
    d: 4.21,
    color: "#d8b98d",
    light: "2700K",
    areaType: "interior",
    parts: [
      { x: 0, z: 0, w: 3.49, d: 4.21 },
      { x: 0, z: 4.33, w: 1.8, d: 0.95 },
    ],
  },
  { id: "child", name: "南次卧", tag: "成长空间", x: 3.7, z: 0, w: 2.79, d: 4.21, color: "#aebd9d", light: "3000K", areaType: "interior" },
  { id: "living", name: "客厅", tag: "会客核心", x: 6.71, z: 0, w: 5.27, d: 5.17, color: "#c7b1a8", light: "3000K", areaType: "interior" },
  { id: "elder", name: "东次卧", tag: "安静卧室", x: 12.19, z: 0, w: 2.98, d: 3.78, color: "#cbbda7", light: "3000K", areaType: "interior" },
  { id: "corridor", name: "过道", tag: "西翼动线", x: 1.8, z: 4.33, w: 4.8, d: 0.95, color: "#c3bcac", light: "3000K", areaType: "interior" },
  { id: "foyer", name: "玄关", tag: "电梯侧入户", x: 10.41, z: 3.89, w: 1.57, d: 1.28, color: "#b7b1a7", light: "3000K", areaType: "interior", overlap: "living" },
  { id: "bath-east", name: "东卫", tag: "卧室近侧", x: 12.19, z: 3.89, w: 2.98, d: 1.78, color: "#9dbfc7", light: "4000K", areaType: "interior" },
  { id: "bath-main", name: "主卫", tag: "西北湿区", x: 0, z: 5.39, w: 1.7, d: 2.87, color: "#a8c7cc", light: "4000K", areaType: "interior" },
  { id: "north-bed", name: "北次卧", tag: "第四卧室", x: 1.9, z: 5.39, w: 2.78, d: 4.38, color: "#b7ab94", light: "3000K", areaType: "interior" },
  { id: "bath-guest", name: "客卫", tag: "双卫分置", x: 4.89, z: 5.39, w: 1.6, d: 2.87, color: "#9dbfc7", light: "4000K", areaType: "interior" },
  { id: "dining", name: "餐厅", tag: "六人餐叙", x: 6.71, z: 5.39, w: 3.48, d: 2.87, color: "#d5c9ae", light: "3000K", areaType: "interior" },
  { id: "kitchen", name: "厨房", tag: "入户侧开放厨", x: 10.41, z: 5.39, w: 1.57, d: 2.87, color: "#b8c9c0", light: "4000K", areaType: "interior" },
  { id: "balcony-west", name: "生活阳台", tag: "北侧家政", x: 4.68, z: 8.26, w: 1.81, d: 1.51, color: "#bdc9bd", light: "4000K", areaType: "balcony" },
  { id: "balcony-living", name: "景观阳台", tag: "餐厅外摆", x: 6.71, z: 8.26, w: 3.48, d: 1.51, color: "#c7c0a4", light: "3000K", areaType: "balcony" },
].map((room) => ({ ...room, area: Number(roomRawArea(room).toFixed(1)) }));

export const calculatedInteriorArea = Number(rooms.filter((room) => room.areaType === "interior" && !room.overlap).reduce((sum, room) => sum + roomRawArea(room), 0).toFixed(1));
export const calculatedBalconyArea = Number(rooms.filter((room) => room.areaType === "balcony").reduce((sum, room) => sum + roomRawArea(room), 0).toFixed(1));
export const calculatedUsableArea = Number((calculatedInteriorArea + calculatedBalconyArea).toFixed(1));
export const modelEnvelopeArea = Number((MODEL_SIZE.width * MODEL_SIZE.depth).toFixed(1));

// Wall center lines in model metres. Openings are split segments.
export const walls = [
  { a: [0, 0], b: [15.17, 0], kind: "outer" },
  { a: [15.17, 0], b: [15.17, 5.67], kind: "outer" },
  { a: [15.17, 5.67], b: [12.08, 5.67], kind: "outer" },
  { a: [12.08, 6.87], b: [12.08, 8.26], kind: "outer" },
  { a: [12.08, 8.26], b: [10.3, 8.26], kind: "outer" },
  { a: [10.3, 8.26], b: [10.3, 9.77], kind: "outer" },
  { a: [10.3, 9.77], b: [1.8, 9.77], kind: "outer" },
  { a: [1.8, 9.77], b: [1.8, 8.26], kind: "outer" },
  { a: [1.8, 8.26], b: [0, 8.26], kind: "outer" },
  { a: [0, 8.26], b: [0, 0], kind: "outer" },
  { a: [3.6, 0], b: [3.6, 4.27] },
  { a: [6.6, 0], b: [6.6, 4.27] },
  // Corridor starts east of the master suite; master connects north to the ensuite.
  { a: [2.62, 4.27], b: [4.02, 4.27], kind: "partition" },
  { a: [4.82, 4.27], b: [6.6, 4.27], kind: "partition" },
  { a: [12.08, 0], b: [12.08, 2.94] }, { a: [12.08, 3.7], b: [12.08, 5.67] },
  { a: [12.08, 3.84], b: [13.02, 3.84], kind: "partition" }, { a: [13.82, 3.84], b: [15.17, 3.84], kind: "partition" },
  { a: [0, 5.39], b: [0.48, 5.39] }, { a: [1.28, 5.39], b: [2.34, 5.39] },
  { a: [3.14, 5.39], b: [5.22, 5.39] },
  { a: [1.8, 4.27], b: [1.8, 8.26] },
  // Scene A: north-bed takes the west balcony to the north envelope; east wall is continuous except the balcony door.
  { a: [4.78, 5.39], b: [4.78, 8.62] }, { a: [4.78, 9.42], b: [4.78, 9.77] },
  { a: [6.6, 5.39], b: [6.6, 8.26] },
  { a: [4.78, 8.26], b: [7.4, 8.26] }, { a: [9.2, 8.26], b: [10.3, 8.26] },
];

export const windows = [
  { x: 1.75, z: 0.02, width: 1.7, rotation: 0, sill: 0.56, opening: 1.74 },
  { x: 5.1, z: 0.02, width: 1.45, rotation: 0, sill: 0.56, opening: 1.74 },
  { x: 9.3, z: 0.02, width: 2.35, rotation: 0, sill: 0.56, opening: 1.74 },
  { x: 13.7, z: 0.02, width: 1.45, rotation: 0, sill: 0.56, opening: 1.74 },
  { x: 0.02, z: 6.81, width: 1.25, rotation: Math.PI / 2, sill: 0.25, opening: 1.29 },
  { x: 3.29, z: 9.75, width: 1.7, rotation: 0, sill: 1.01, opening: 1.3 },
  { x: 5.69, z: 9.75, width: 1.15, rotation: 0, sill: 1.01, opening: 1.3 },
  { x: 8.45, z: 9.75, width: 1.85, rotation: 0, sill: 1.01, opening: 1.3 },
];

export const waterRoutes = [
  {
    id: "cold-main",
    name: "冷水主管",
    color: "#36a9e1",
    y: 0.16,
    points: [[11.63, 8.02], [10.86, 8.02], [10.86, 6.78]],
  },
  {
    id: "cold-north-wet",
    name: "北侧湿区冷水",
    color: "#36a9e1",
    y: 0.18,
    points: [[11.63, 7.84], [5.72, 7.84], [5.72, 6.88], [0.72, 6.88]],
  },
  {
    id: "cold-east-bath",
    name: "东卫冷水",
    color: "#36a9e1",
    y: 0.18,
    points: [[11.63, 5.54], [13.72, 5.54], [13.72, 4.76]],
  },
  {
    id: "hot-north-wet",
    name: "北侧热水回路",
    color: "#ef735b",
    y: 0.23,
    points: [[11.48, 7.64], [5.48, 7.64], [5.48, 6.64], [0.9, 6.64]],
  },
  {
    id: "hot-east-bath",
    name: "东卫热水",
    color: "#ef735b",
    y: 0.23,
    points: [[11.48, 7.64], [11.48, 5.76], [13.48, 5.76], [13.48, 4.96]],
  },
  {
    id: "drain-north",
    name: "北侧排水干管",
    color: "#4f9e91",
    y: 0.11,
    points: [[0.58, 7.96], [0.58, 7.14], [5.92, 7.14], [5.92, 7.98], [11.72, 7.98]],
  },
  {
    id: "drain-east",
    name: "东卫排水",
    color: "#4f9e91",
    y: 0.11,
    points: [[14.35, 4.72], [14.35, 5.04], [11.72, 5.04], [11.72, 7.98]],
  },
];

export const waterFixtures = [
  { id: "riser", name: "给排水立管", type: "riser", x: 11.63, z: 8.02 },
  { id: "sink-k", name: "厨房水槽", type: "sink", x: 10.86, z: 6.78 },
  { id: "heater", name: "燃气热水器", type: "heater", x: 11.48, z: 7.64 },
  { id: "washer", name: "生活阳台洗衣机", type: "washer", x: 5.55, z: 9.05 },
  { id: "basin-main", name: "主卫台盆", type: "basin", x: 0.42, z: 6.4 },
  { id: "shower-main", name: "主卫花洒", type: "shower", x: 0.45, z: 7.74 },
  { id: "toilet-main", name: "主卫马桶", type: "toilet", x: 1.16, z: 6.88 },
  { id: "basin-guest", name: "客卫台盆", type: "basin", x: 5.16, z: 6.4 },
  { id: "shower-guest", name: "客卫花洒", type: "shower", x: 5.18, z: 7.74 },
  { id: "toilet-guest", name: "客卫马桶", type: "toilet", x: 5.92, z: 6.88 },
  { id: "basin-east", name: "东卫台盆", type: "basin", x: 12.68, z: 4.34 },
  { id: "shower-east", name: "东卫花洒", type: "shower", x: 14.55, z: 4.42 },
  { id: "toilet-east", name: "东卫马桶", type: "toilet", x: 13.72, z: 5.3 },
];

const roomCenters = Object.fromEntries(
  rooms.map((room) => [room.id, [room.x + room.w / 2, room.z + room.d / 2]])
);

export const lightPoints = rooms
  .filter((room) => room.id !== "foyer")
  .map((room, index) => ({
    id: `light-${room.id}`,
    room: room.id,
    name: `${room.name}主灯`,
    x: roomCenters[room.id][0],
    z: roomCenters[room.id][1],
    circuit: index < 5 ? "L1" : "L2",
  }));

export const electricalRoutes = [
  { id: "L1", color: "#f4c45f", points: [[11.38, 4.75], [9.35, 4.75], [9.35, 2.55], [1.75, 2.55]] },
  { id: "L2", color: "#ffcf70", points: [[11.38, 4.27], [9.1, 5.88], [9.1, 6.82], [0.85, 6.82]] },
  { id: "P1", color: "#d59f48", points: [[11.52, 4.27], [13.7, 4.27], [13.7, 1.95]] },
  { id: "P2", color: "#d59f48", points: [[11.52, 4.27], [10.9, 7.24], [5.55, 7.24], [5.55, 9.05]] },
  { id: "AC", color: "#cf8f57", points: [[11.66, 4.27], [8.8, 4.76], [5.0, 4.76], [1.78, 4.44]] },
];

export const outlets = [
  [0.32, 0.95], [0.32, 2.22], [3.18, 0.95], [3.18, 3.9],
  [3.94, 0.29], [5.98, 0.29], [3.94, 4.14], [5.98, 4.14],
  [6.98, 0.29], [8.82, 0.29], [11.68, 0.29], [6.98, 4.84], [11.68, 4.84],
  [12.48, 0.32], [14.82, 0.32], [12.48, 3.5], [14.82, 3.5],
  [0.3, 5.66], [0.3, 7.96], [1.5, 5.66], [1.5, 7.96],
  [2.08, 5.66], [4.5, 5.66], [2.08, 9.47], [4.5, 9.47],
  [5.05, 5.66], [6.3, 7.96], [6.88, 5.66], [9.95, 7.96],
  [10.58, 5.66], [11.8, 7.96], [5.55, 9.05], [6.05, 8.71], [7.02, 8.71], [9.9, 8.71],
].map(([x, z], index) => ({ id: `socket-${index + 1}`, x, z, name: `五孔插座 ${index + 1}` }));

// Doors: rot 0 = wall along x, rot Math.PI/2 = wall along z.
// hinge: +1 = hinge at +u end of the opening; swing: door opens toward +n (+1) or -n (-1),
// where n is the wall normal ([0,1] for rot 0, [1,0] for rot PI/2) in model metres.
export const doors = [
  { id: "door-master", name: "主卧门", x: 2.22, z: 4.27, width: 0.8, rot: 0, hinge: 1, swing: -1, height: 2.05 },
  { id: "door-child", name: "南次卧门", x: 4.42, z: 4.27, width: 0.8, rot: 0, hinge: 1, swing: -1, height: 2.05 },
  { id: "door-bath-main", name: "主卫门", x: 0.88, z: 5.39, width: 0.8, rot: 0, hinge: -1, swing: 1, height: 2.05 },
  { id: "door-north-bed", name: "北次卧门", x: 2.74, z: 5.39, width: 0.8, rot: 0, hinge: 1, swing: 1, height: 2.05 },
  { id: "door-bath-guest", name: "客卫门", x: 5.62, z: 5.39, width: 0.8, rot: 0, hinge: 1, swing: 1, height: 2.05 },
  { id: "door-elder", name: "东次卧门", x: 12.08, z: 3.32, width: 0.76, rot: Math.PI / 2, hinge: -1, swing: -1, height: 2.05 },
  { id: "door-bath-east", name: "东卫门", x: 13.42, z: 3.84, width: 0.8, rot: 0, hinge: 1, swing: 1, height: 2.05 },
  { id: "door-balcony-west", name: "生活阳台门", x: 4.78, z: 9.02, width: 0.8, rot: Math.PI / 2, hinge: -1, swing: -1, height: 2.05 },
  { id: "door-balcony-living", name: "景观阳台推拉门", x: 8.3, z: 8.26, width: 1.8, rot: 0, height: 2.2, type: "slide" },
  // East kitchen wall at the elevator-hall re-entrant corner; double leaf opens west into the open kitchen.
  { id: "door-entry", name: "入户门", x: 12.08, z: 6.27, width: 1.2, rot: Math.PI / 2, hinge: -1, swing: -1, height: 2.05, type: "entry", leaves: 2 },
];

// Entry door on the east kitchen wall; offsets taken from the structural plan.
export const electricalFixtures = [
  { id: "intercom", name: "可视对讲", type: "intercom", x: 11.92, z: 6.4, w: 0.16, h: 0.22, y: 1.375 },
  { id: "data-panel", name: "弱电箱", type: "data", x: 11.92, z: 6.82, w: 0.42, h: 0.32, y: 0.57 },
  { id: "power-panel", name: "强电箱", type: "power", x: 11.92, z: 6.84, w: 0.39, h: 0.6, y: 1.66 },
];

export const projectStats = {
  usableArea: `${calculatedUsableArea.toFixed(1)} m²`,
  interiorArea: `${calculatedInteriorArea.toFixed(1)} m²`,
  balconyArea: `${calculatedBalconyArea.toFixed(1)} m²`,
  envelopeArea: `${modelEnvelopeArea.toFixed(1)} m²`,
  areaBasis: `${calculatedInteriorArea.toFixed(1)}㎡ 室内 + ${calculatedBalconyArea.toFixed(1)}㎡ 阳台（不含电梯/公区）`,
  ceiling: "2.83 m",
  rooms: "4 室 2 厅 3 卫",
  doors: doors.length,
  outlets: outlets.length,
  switches: 14,
  lightGroups: lightPoints.length,
  waterPoints: waterFixtures.length,
};

export const designNotes = [
  { title: "动静分区", value: "南侧三开间 · 北侧湿区", note: "四卧分置，餐厨与双阳台居北" },
  { title: "照明策略", value: "无主灯 + 重点照明", note: "3000K 为主，厨卫 4000K" },
  { title: "给水策略", value: "热水回路 ≤ 16m", note: "湿区同侧归集，设检修口" },
  { title: "强弱电", value: "回路分区 · 弱电星型", note: "厨电、空调、卫浴独立回路" },
];

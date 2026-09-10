import { useEffect, useMemo, useState } from "react";
import {
  Bath,
  BedDouble,
  Compass,
  DoorOpen,
  Footprints,
  Download,
  Droplets,
  Image as ImageIcon,
  Info,
  Layers3,
  Lightbulb,
  Map,
  Menu,
  MousePointer2,
  PlugZap,
  Rotate3D,
  Ruler,
  SlidersHorizontal,
  Sofa,
  Sparkles,
  Tag,
  Trees,
  Utensils,
  X,
  Zap,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { Scene3D } from "./components/Scene3D";
import {
  CEILING_HEIGHT,
  designNotes,
  projectStats,
  rooms,
  waterFixtures,
} from "./data/design";

const LAYER_CONFIG = [
  { key: "water", label: "给排水", meta: `${projectStats.waterPoints} 个用水点位`, icon: Droplets, tone: "tone-water" },
  { key: "electric", label: "强弱电", meta: `5 组回路 · ${projectStats.outlets} 插座`, icon: Zap, tone: "tone-electric" },
  { key: "labels", label: "空间标签", meta: `${rooms.length} 个功能分区`, icon: Tag, tone: "tone-sage" },
];

const NOTE_ICONS = [Compass, Lightbulb, Droplets, Zap];

const KEY_METRICS = [
  { label: "套内合计", value: projectStats.usableArea.replace(" m²", ""), unit: "㎡" },
  { label: "室内净面积", value: projectStats.interiorArea.replace(" m²", ""), unit: "㎡" },
  { label: "完成层高", value: CEILING_HEIGHT.toFixed(2), unit: "m" },
  { label: "户型格局", value: projectStats.rooms.replace(/\s/g, ""), unit: "" },
];

const RAIL_COUNTS = [
  { label: "门窗", value: projectStats.doors, icon: DoorOpen },
  { label: "灯位", value: projectStats.lightGroups, icon: Lightbulb },
  { label: "插座", value: projectStats.outlets, icon: PlugZap },
  { label: "水点", value: projectStats.waterPoints, icon: Droplets },
];

const USABLE_AREA_VALUE = Number.parseFloat(projectStats.usableArea);

const roomIcon = (id) => {
  if (id.includes("bath")) return Bath;
  if (id === "kitchen") return Utensils;
  if (["master", "child", "elder", "north-bed"].includes(id)) return BedDouble;
  if (["living", "dining"].includes(id)) return Sofa;
  if (id.includes("balcony")) return Trees;
  if (id === "foyer") return DoorOpen;
  return Footprints;
};

function Toggle({ enabled, onClick, label }) {
  return (
    <button
      type="button"
      className={`toggle ${enabled ? "is-on" : ""}`}
      role="switch"
      aria-checked={enabled}
      aria-label={label}
      onClick={onClick}
    >
      <span aria-hidden="true" />
    </button>
  );
}

function Sidebar({ layers, setLayers, selectedRoom, onSelectRoom, mobileOpen, setMobileOpen }) {
  return (
    <aside className={`sidebar ${mobileOpen ? "is-open" : ""}`}>
      <div className="sidebar-mobile-head">
        <span>设计导航</span>
        <button type="button" className="icon-button" onClick={() => setMobileOpen(false)} aria-label="关闭导航">
          <X size={18} />
        </button>
      </div>

      <section className="overview-card">
        <p className="eyebrow">PROJECT DOSSIER · 绿城玉海棠</p>
        <h2>142㎡ 现代自然居所</h2>
        <p className="overview-sub">结构 · 门窗 · 动线 · 机电一体化预览</p>
        <dl className="metric-grid">
          {KEY_METRICS.map((metric) => (
            <div key={metric.label}>
              <dt>{metric.label}</dt>
              <dd>
                {metric.value}
                {metric.unit && <i>{metric.unit}</i>}
              </dd>
            </div>
          ))}
        </dl>
        <p className="area-basis">
          <Info size={12} />
          {projectStats.areaBasis}
        </p>
      </section>

      <section className="sidebar-section">
        <div className="section-title">
          <span>可视图层</span>
          <small>LIVE</small>
        </div>
        <div className="layer-list">
          {LAYER_CONFIG.map((item) => {
            const Icon = item.icon;
            const on = layers[item.key];
            return (
              <div className={`layer-row ${on ? "is-on" : ""}`} key={item.key}>
                <span className={`layer-icon ${item.tone}`}>
                  <Icon size={16} />
                </span>
                <span className="layer-copy">
                  <strong>{item.label}</strong>
                  <span>{item.meta}</span>
                </span>
                <Toggle
                  enabled={on}
                  label={`切换${item.label}`}
                  onClick={() => setLayers((current) => ({ ...current, [item.key]: !current[item.key] }))}
                />
              </div>
            );
          })}
        </div>
      </section>

      <section className="sidebar-section room-section">
        <div className="section-title">
          <span>空间索引</span>
          <small>{rooms.length}</small>
        </div>
        <div className="room-list">
          {rooms.map((room) => {
            const Icon = roomIcon(room.id);
            return (
              <button
                type="button"
                className={`room-row ${selectedRoom === room.id ? "is-selected" : ""}`}
                key={room.id}
                aria-pressed={selectedRoom === room.id}
                onClick={() => {
                  onSelectRoom(selectedRoom === room.id ? null : room.id);
                  setMobileOpen(false);
                }}
              >
                <span className="room-dot" style={{ background: room.color }} />
                <Icon size={14} />
                <span className="room-name">{room.name}</span>
                <small>{room.area.toFixed(1)}㎡</small>
              </button>
            );
          })}
        </div>
      </section>
    </aside>
  );
}

function DesignRail() {
  return (
    <aside className="design-rail">
      <div className="rail-title">
        <span>设计策略</span>
        <small>DESIGN NOTES</small>
      </div>
      <div className="strategy-list">
        {designNotes.map((note, index) => {
          const Icon = NOTE_ICONS[index] ?? Sparkles;
          return (
            <article key={note.title}>
              <span className={`strategy-icon tone-${index}`}>
                <Icon size={16} />
              </span>
              <div>
                <span className="strategy-index">{String(index + 1).padStart(2, "0")} · {note.title}</span>
                <strong>{note.value}</strong>
                <p>{note.note}</p>
              </div>
            </article>
          );
        })}
      </div>

      <div className="rail-counts">
        {RAIL_COUNTS.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label}>
              <Icon size={13} />
              <strong>{item.value}</strong>
              <span>{item.label}</span>
            </div>
          );
        })}
      </div>

      <div className="rail-note">
        <Info size={14} />
        <div>
          <strong>面积口径</strong>
          <p>矩形外包络 {projectStats.envelopeArea} 含未建模凹位与公区，仅供比例参照，不作为套内或产权面积。</p>
        </div>
      </div>
    </aside>
  );
}

function SystemLegend({ layers }) {
  return (
    <section className="legend-card glass-card" aria-label="图层图例">
      <header className="legend-head">
        <SlidersHorizontal size={13} />
        <span>图层图例</span>
      </header>
      <div className={`legend-group ${layers.water ? "" : "is-off"}`}>
        <p className="legend-group-title">给排水{layers.water ? "" : " · 已关闭"}</p>
        <div><i style={{ background: "#36a9e1" }} />冷水 PPR</div>
        <div><i style={{ background: "#ef735b" }} />热水回路</div>
        <div><i className="wide" style={{ background: "#4f9e91" }} />排水 PVC</div>
      </div>
      <div className={`legend-group ${layers.electric ? "" : "is-off"}`}>
        <p className="legend-group-title">强弱电{layers.electric ? "" : " · 已关闭"}</p>
        <div><i style={{ background: "#f4c45f" }} />照明回路</div>
        <div><i style={{ background: "#d59f48" }} />插座回路</div>
        <div><span className="legend-square" />五孔插座</div>
      </div>
    </section>
  );
}

function RoomInspector({ selectedRoom, onClose }) {
  const room = rooms.find((entry) => entry.id === selectedRoom);
  if (!room) return null;
  const share = Math.round((room.area / USABLE_AREA_VALUE) * 1000) / 10;
  return (
    <section className="inspector glass-card" aria-label="空间详情">
      <button type="button" className="inspector-close" onClick={onClose} aria-label="关闭空间详情">
        <X size={15} />
      </button>
      <div className="sample-chip" style={{ background: room.color }}>
        <span>{room.areaType === "balcony" ? "BALCONY" : "INTERIOR"}</span>
      </div>
      <p className="inspector-kicker">{room.tag}</p>
      <h3>{room.name}</h3>
      <dl className="room-measure">
        <div>
          <dt>面积</dt>
          <dd>{room.area.toFixed(1)} m²</dd>
        </div>
        <div>
          <dt>净高</dt>
          <dd>{CEILING_HEIGHT.toFixed(2)} m</dd>
        </div>
        <div>
          <dt>色温</dt>
          <dd>{room.light}</dd>
        </div>
      </dl>
      <p className="inspector-foot">
        <span className="swatch-code">{room.color.toUpperCase()}</span>
        占套内 {share}%
      </p>
    </section>
  );
}

const REFERENCE_HERO = [
  {
    src: "/references/official-huxing-4k.png",
    alt: "官方户型分析图 4K 底图",
    title: "官方户型分析",
    meta: "FANG.COM · 4K 底图",
  },
  {
    src: "/references/official-furnished-4k.png",
    alt: "官方棠悦装修示意图 4K",
    title: "棠悦生活场景 A",
    meta: "装修示意 · 4K 户型本体",
  },
];

const REFERENCE_KEYS = [
  { src: "/references/key-west-4k.png", alt: "西翼套间 4K", title: "西翼", meta: "主卧 / 主卫 / 次卧" },
  { src: "/references/key-center-4k.png", alt: "中部公区 4K", title: "中部", meta: "客厅 / 餐厅 / 阳台" },
  { src: "/references/key-east-4k.png", alt: "东翼入户 4K", title: "东翼", meta: "厨房 / 入户 / 老人房" },
];

function ReferenceModal({ onClose }) {
  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <section
        className="reference-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="reference-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header>
          <div>
            <p className="eyebrow">FANG.COM · 官方户型底图</p>
            <h2 id="reference-title">4K 图纸依据</h2>
            <p>底图取自绿城玉海棠 142㎡ 官方户型页，关键分区放大到长边 3840。</p>
          </div>
          <button type="button" className="icon-button" onClick={onClose} aria-label="关闭参考图">
            <X size={19} />
          </button>
        </header>

        <div className="reference-grid">
          {REFERENCE_HERO.map((item) => (
            <figure key={item.src}>
              <img src={item.src} alt={item.alt} loading="lazy" />
              <figcaption>
                <strong>{item.title}</strong>
                <span>{item.meta}</span>
              </figcaption>
            </figure>
          ))}
        </div>

        <p className="reference-subhead">关键分区放大</p>
        <div className="reference-grid is-keys">
          {REFERENCE_KEYS.map((item) => (
            <figure key={item.src}>
              <img src={item.src} alt={item.alt} loading="lazy" />
              <figcaption>
                <strong>{item.title}</strong>
                <span>{item.meta}</span>
              </figcaption>
            </figure>
          ))}
        </div>

        <footer>
          <Info size={14} />
          模型点位为概念定位，不替代施工综合图；面积口径 {projectStats.areaBasis}。
        </footer>
      </section>
    </div>
  );
}

function App() {
  const [layers, setLayers] = useState({ water: true, electric: true, labels: true });
  const [viewMode, setViewMode] = useState("3d");
  const [wallScale, setWallScale] = useState(0.62);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [referencesOpen, setReferencesOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [viewCommand, setViewCommand] = useState(null);
  const selectedName = useMemo(() => rooms.find((room) => room.id === selectedRoom)?.name, [selectedRoom]);

  useEffect(() => {
    const closeOverlays = (event) => {
      if (event.key !== "Escape") return;
      setReferencesOpen(false);
      setMobileOpen(false);
    };
    window.addEventListener("keydown", closeOverlays);
    return () => window.removeEventListener("keydown", closeOverlays);
  }, []);

  const selectRoom = (roomId) => {
    setSelectedRoom((current) => current === roomId ? null : roomId);
  };

  const issueViewCommand = (type) => {
    setViewCommand({ type, id: Date.now() + Math.random() });
  };

  const exportDesign = () => {
    const payload = JSON.stringify({
      project: `${projectStats.usableArea.replace(" m²", "㎡")} 现代自然居所`,
      ceilingHeight: CEILING_HEIGHT,
      exportedAt: new Date().toISOString(),
      rooms,
      waterPoints: waterFixtures,
      visibleLayers: layers,
    }, null, 2);
    const url = URL.createObjectURL(new Blob([payload], { type: "application/json" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "homeflow-design-snapshot.json";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className="app-shell"
      data-usable-area={projectStats.usableArea}
      data-interior-area={projectStats.interiorArea}
      data-area-basis={projectStats.areaBasis}
    >
      <header className="topbar">
        <div className="brand">
          <button type="button" className="mobile-menu icon-button" onClick={() => setMobileOpen(true)} aria-label="打开导航">
            <Menu size={19} />
          </button>
          <span className="brand-mark">栖</span>
          <span className="brand-copy">
            <strong>栖居</strong>
            <span>HOMEFLOW STUDIO</span>
          </span>
        </div>

        <div className="project-title">
          <span>全屋设计</span>
          <em aria-hidden="true" />
          <strong>{selectedName ?? "全屋总览"}</strong>
          <i>{viewMode === "plan" ? "平面" : "3D"}</i>
        </div>

        <div className="top-actions">
          <button type="button" className="text-button" onClick={() => setReferencesOpen(true)}>
            <ImageIcon size={15} />
            <span className="btn-label">图纸依据</span>
          </button>
          <button type="button" className="primary-button" onClick={exportDesign}>
            <Download size={15} />
            <span className="btn-label">导出方案</span>
          </button>
        </div>
      </header>

      <div className="workspace">
        <Sidebar
          layers={layers}
          setLayers={setLayers}
          selectedRoom={selectedRoom}
          onSelectRoom={selectRoom}
          mobileOpen={mobileOpen}
          setMobileOpen={setMobileOpen}
        />
        {mobileOpen && <button type="button" className="sidebar-scrim" onClick={() => setMobileOpen(false)} aria-label="关闭导航遮罩" />}

        <main className="viewport">
          <div className="viewport-badges">
            <span><span className="live-dot" /> {viewMode === "plan" ? "平面校核" : "实时 3D"}</span>
            <span><Ruler size={12} /> 层高 {CEILING_HEIGHT.toFixed(2)}m</span>
            <span><Compass size={12} /> 北向朝上</span>
          </div>

          <div className="view-switch glass-card" role="group" aria-label="视图模式">
            <button
              type="button"
              className={viewMode === "3d" ? "active" : ""}
              aria-pressed={viewMode === "3d"}
              onClick={() => setViewMode("3d")}
            >
              <Rotate3D size={15} />
              <span className="btn-label">3D 漫游</span>
            </button>
            <button
              type="button"
              className={viewMode === "plan" ? "active" : ""}
              aria-pressed={viewMode === "plan"}
              onClick={() => setViewMode("plan")}
            >
              <Map size={15} />
              <span className="btn-label">平面俯视</span>
            </button>
          </div>

          <Scene3D
            layers={layers}
            mode={viewMode}
            wallScale={wallScale}
            selectedRoom={selectedRoom}
            onSelectRoom={selectRoom}
            viewCommand={viewCommand}
            onPlanWheel={(deltaY) => issueViewCommand(deltaY > 0 ? "zoomOut" : "zoomIn")}
          />

          <SystemLegend layers={layers} />
          <RoomInspector selectedRoom={selectedRoom} onClose={() => setSelectedRoom(null)} />

          <div className="instrument-dock glass-card">
            <div className="dock-row wall-control">
              <div className="dock-label">
                <Layers3 size={13} />
                <span>墙体剖切</span>
                <strong>{Math.round(wallScale * 100)}%</strong>
              </div>
              <input
                aria-label="墙体剖切高度"
                type="range"
                min="0.18"
                max="1"
                step="0.02"
                value={wallScale}
                onChange={(event) => setWallScale(Number(event.target.value))}
              />
            </div>
            <div className="dock-row zoom-control">
              <span className="dock-label">
                <ZoomIn size={13} />
                <span>视距</span>
              </span>
              <div className="zoom-cluster">
                <button type="button" onClick={() => issueViewCommand("zoomOut")} aria-label="缩小视图">
                  <ZoomOut size={14} />
                </button>
                <button type="button" className="zoom-reset" onClick={() => issueViewCommand("reset")} aria-label="重置视图">
                  100%
                </button>
                <button type="button" onClick={() => issueViewCommand("zoomIn")} aria-label="放大视图">
                  <ZoomIn size={14} />
                </button>
              </div>
            </div>
          </div>

          <p className="interaction-tip">
            <MousePointer2 size={13} />
            {viewMode === "plan" ? "拖拽平移 · 滚轮缩放 · 左侧选择空间" : "拖拽旋转 · 滚轮缩放 · 点击空间聚焦"}
          </p>
        </main>

        <DesignRail />
      </div>

      {referencesOpen && <ReferenceModal onClose={() => setReferencesOpen(false)} />}
    </div>
  );
}

export default App;

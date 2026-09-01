import { useMemo, useState } from "react";
import {
  Armchair,
  Box,
  Check,
  ChevronRight,
  Download,
  Droplets,
  Home,
  Image as ImageIcon,
  Layers3,
  Map,
  Menu,
  MousePointer2,
  Rotate3D,
  Ruler,
  ScanLine,
  Tag,
  X,
  Zap,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { Scene3D } from "./components/Scene3D";
import {
  CEILING_HEIGHT,
  projectStats,
  rooms,
  waterFixtures,
} from "./data/design";

const LAYER_CONFIG = [
  { key: "water", label: "给排水", meta: `${projectStats.waterPoints} 点位`, icon: Droplets, color: "#2f9bc8" },
  { key: "electric", label: "强弱电", meta: "5 回路", icon: Zap, color: "#d9a23f" },
  { key: "labels", label: "空间标签", meta: `${rooms.length} 分区`, icon: Tag, color: "#7c8b79" },
];

const roomIcon = (id) => {
  if (id.includes("bath") || id === "kitchen") return Droplets;
  if (["master", "child", "elder", "north-bed"].includes(id)) return Home;
  if (["living", "dining"].includes(id)) return Armchair;
  return Layers3;
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
      <span />
    </button>
  );
}

function Sidebar({ layers, setLayers, selectedRoom, onSelectRoom, mobileOpen, setMobileOpen }) {
  return (
    <aside className={`sidebar ${mobileOpen ? "is-open" : ""}`}>
      <div className="sidebar-mobile-head">
        <span>设计导航</span>
        <button className="icon-button" onClick={() => setMobileOpen(false)} aria-label="关闭导航">
          <X size={18} />
        </button>
      </div>

      <section className="sidebar-section">
        <div className="section-title"><span>可视图层</span><small>LIVE</small></div>
        <div className="layer-list">
          {LAYER_CONFIG.map((item) => {
            const Icon = item.icon;
            return (
              <div className="layer-row" key={item.key}>
                <div className="layer-icon" style={{ "--accent": item.color }}><Icon size={16} /></div>
                <div className="layer-copy"><strong>{item.label}</strong><span>{item.meta}</span></div>
                <Toggle
                  enabled={layers[item.key]}
                  label={`切换${item.label}`}
                  onClick={() => setLayers((current) => ({ ...current, [item.key]: !current[item.key] }))}
                />
              </div>
            );
          })}
        </div>
      </section>

      <section className="sidebar-section room-section">
        <div className="section-title"><span>空间索引</span><small>{rooms.length}</small></div>
        <div className="room-list">
          {rooms.map((room) => {
            const Icon = roomIcon(room.id);
            return (
              <button
                type="button"
                className={`room-row ${selectedRoom === room.id ? "is-selected" : ""}`}
                key={room.id}
                onClick={() => {
                  onSelectRoom(selectedRoom === room.id ? null : room.id);
                  setMobileOpen(false);
                }}
              >
                <span className="room-dot" style={{ background: room.color }} />
                <Icon size={15} />
                <span>{room.name}</span>
                <small>{room.area.toFixed(1)}㎡</small>
                <ChevronRight size={14} />
              </button>
            );
          })}
        </div>
      </section>
    </aside>
  );
}

function SystemLegend({ layers }) {
  return (
    <div className="legend-card glass-card">
      <div className="legend-head"><ScanLine size={15} /><span>图层图例</span></div>
      {layers.water && (
        <div className="legend-group">
          <div><i style={{ background: "#36a9e1" }} />冷水 PPR</div>
          <div><i style={{ background: "#ef735b" }} />热水回路</div>
          <div><i className="wide" style={{ background: "#4f9e91" }} />排水 PVC</div>
        </div>
      )}
      {layers.electric && (
        <div className="legend-group">
          <div><i style={{ background: "#f4c45f" }} />照明回路</div>
          <div><i style={{ background: "#d59f48" }} />插座回路</div>
          <div><span className="legend-square" />五孔插座</div>
        </div>
      )}
      {!layers.water && !layers.electric && <p>开启水路或电路查看系统设计。</p>}
    </div>
  );
}

function RoomInspector({ selectedRoom, onClose }) {
  const room = rooms.find((entry) => entry.id === selectedRoom);
  if (!room) return null;
  return (
    <div className="inspector glass-card">
      <button className="inspector-close" onClick={onClose} aria-label="关闭空间详情"><X size={15} /></button>
      <div className="inspector-kicker"><span style={{ background: room.color }} /> {room.tag}</div>
      <h3>{room.name}</h3>
      <div className="room-measure">
        <div><span>面积</span><strong>{room.area.toFixed(1)} m²</strong></div>
        <div><span>净高</span><strong>{CEILING_HEIGHT.toFixed(2)} m</strong></div>
        <div><span>色温</span><strong>{room.light}</strong></div>
      </div>
    </div>
  );
}

function ReferenceModal({ onClose }) {
  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <section className="reference-modal" onMouseDown={(event) => event.stopPropagation()}>
        <header>
          <div>
            <span className="eyebrow">FANG.COM · 官方户型底图</span>
            <h2>4K 图纸依据</h2>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="关闭参考图"><X size={19} /></button>
        </header>
        <div className="reference-grid">
          <figure>
            <img src="/references/official-huxing-4k.png" alt="官方户型分析图 4K 底图" />
            <figcaption><strong>官方户型分析</strong><span>4K 底图</span></figcaption>
          </figure>
          <figure>
            <img src="/references/official-furnished-4k.png" alt="官方棠悦装修示意图 4K" />
            <figcaption><strong>棠悦生活场景A</strong><span>4K 户型本体</span></figcaption>
          </figure>
        </div>
        <div className="reference-grid is-keys">
          <figure>
            <img src="/references/key-west-4k.png" alt="西翼套间 4K" />
            <figcaption><strong>西翼</strong><span>主卧 / 主卫 / 次卧</span></figcaption>
          </figure>
          <figure>
            <img src="/references/key-center-4k.png" alt="中部公区 4K" />
            <figcaption><strong>中部</strong><span>客厅 / 餐厅 / 阳台</span></figcaption>
          </figure>
          <figure>
            <img src="/references/key-east-4k.png" alt="东翼入户 4K" />
            <figcaption><strong>东翼</strong><span>厨房 / 入户 / 老人房</span></figcaption>
          </figure>
        </div>
        <footer>
          <Check size={16} />
          底图取自绿城玉海棠 142㎡ 官方户型页；关键分区已放大到长边 3840。
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
          <button className="mobile-menu icon-button" onClick={() => setMobileOpen(true)} aria-label="打开导航"><Menu size={19} /></button>
          <div className="brand-mark"><Box size={20} strokeWidth={1.7} /></div>
          <div><strong>栖居</strong><span>HOMEFLOW STUDIO</span></div>
        </div>
        <div className="project-title">
          <span>全屋设计</span>
          {selectedName && <strong>{selectedName}</strong>}
        </div>
        <div className="top-actions">
          <button className="text-button" onClick={() => setReferencesOpen(true)}><ImageIcon size={16} /> 图纸依据</button>
          <button className="primary-button" onClick={exportDesign}><Download size={16} /> 导出方案</button>
        </div>
      </header>

      <div className="workspace">
        <Sidebar
          layers={layers}
          setLayers={setLayers}
          selectedRoom={selectedRoom}
          onSelectRoom={setSelectedRoom}
          mobileOpen={mobileOpen}
          setMobileOpen={setMobileOpen}
        />
        {mobileOpen && <button className="sidebar-scrim" onClick={() => setMobileOpen(false)} aria-label="关闭导航遮罩" />}

        <main className="viewport">
          <div className="viewport-badges">
            <span><span className="live-dot" /> 实时 3D</span>
            <span><Ruler size={13} /> 层高 {CEILING_HEIGHT.toFixed(2)}m</span>
          </div>

          <div className="view-switch glass-card">
            <button className={viewMode === "3d" ? "active" : ""} onClick={() => setViewMode("3d")}><Rotate3D size={16} /> 3D 漫游</button>
            <button className={viewMode === "plan" ? "active" : ""} onClick={() => setViewMode("plan")}><Map size={16} /> 平面俯视</button>
          </div>

          <Scene3D
            layers={layers}
            mode={viewMode}
            wallScale={wallScale}
            selectedRoom={selectedRoom}
            onSelectRoom={setSelectedRoom}
            viewCommand={viewCommand}
            onPlanWheel={(deltaY) => issueViewCommand(deltaY > 0 ? "zoomOut" : "zoomIn")}
          />

          <SystemLegend layers={layers} />
          <RoomInspector
            selectedRoom={selectedRoom}
            onClose={() => setSelectedRoom(null)}
          />

          <div className="wall-control glass-card">
            <div><Layers3 size={15} /><span>墙体剖切</span><strong>{Math.round(wallScale * 100)}%</strong></div>
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

          <div className="zoom-control glass-card" aria-label="视图缩放控制">
            <button type="button" onClick={() => issueViewCommand("zoomOut")} aria-label="缩小视图"><ZoomOut size={15} /></button>
            <button type="button" onClick={() => issueViewCommand("reset")} aria-label="重置视图">100%</button>
            <button type="button" onClick={() => issueViewCommand("zoomIn")} aria-label="放大视图"><ZoomIn size={15} /></button>
          </div>

          <div className="interaction-tip">
            <MousePointer2 size={14} /> {viewMode === "plan" ? "拖拽平移 · 滚轮缩放 · 左侧选择空间" : "拖拽旋转 · 滚轮缩放 · 点击空间聚焦"}
          </div>
        </main>
      </div>

      {referencesOpen && <ReferenceModal onClose={() => setReferencesOpen(false)} />}
    </div>
  );
}

export default App;

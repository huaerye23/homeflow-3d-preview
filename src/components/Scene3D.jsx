import { Suspense, useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Grid, Html, Line, OrbitControls, RoundedBox, SoftShadows } from "@react-three/drei";
import * as THREE from "three";
import {
  CEILING_HEIGHT,
  MODEL_SIZE,
  WALL_THICKNESS,
  doors,
  electricalFixtures,
  electricalRoutes,
  lightPoints,
  outlets,
  rooms,
  walls,
  waterFixtures,
  waterRoutes,
  windows,
} from "../data/design";

const COLORS = {
  wall: "#e8e2d7",
  outerWall: "#d8d0c3",
};

// Line2 is a Mesh; Three.js culls FrontSide meshes when a parent scale has a
// negative determinant. This scene flips Z with scale={[1, 1, -1]}, so fat
// lines (cables, pipes, door swings, dims) vanish unless they are DoubleSide.
function SceneLine(props) {
  return <Line side={THREE.DoubleSide} {...props} />;
}

const Y_UP = new THREE.Vector3(0, 1, 0);

function RoutePath({ points, color, radius }) {
  const { segments, joints } = useMemo(() => {
    const segments = [];
    for (let i = 0; i < points.length - 1; i += 1) {
      const start = new THREE.Vector3(...points[i]);
      const end = new THREE.Vector3(...points[i + 1]);
      const length = start.distanceTo(end);
      if (length < 1e-4) continue;
      const quaternion = new THREE.Quaternion().setFromUnitVectors(Y_UP, end.clone().sub(start).normalize());
      segments.push({
        key: `seg-${i}`,
        position: start.clone().lerp(end, 0.5).toArray(),
        quaternion,
        length,
      });
    }
    return { segments, joints: points };
  }, [points]);

  return (
    <group>
      {segments.map((segment) => (
        <mesh key={segment.key} position={segment.position} quaternion={segment.quaternion} castShadow>
          <cylinderGeometry args={[radius, radius, segment.length, 12]} />
          <meshStandardMaterial color={color} roughness={0.38} metalness={0.18} emissive={color} emissiveIntensity={0.16} />
        </mesh>
      ))}
      {joints.map((point, index) => (
        <mesh key={`joint-${index}`} position={point} castShadow>
          <sphereGeometry args={[radius, 12, 12]} />
          <meshStandardMaterial color={color} roughness={0.38} metalness={0.18} emissive={color} emissiveIntensity={0.16} />
        </mesh>
      ))}
    </group>
  );
}

function Box({ position, args, color, radius = 0.05, rotation, ...props }) {
  return (
    <RoundedBox
      position={position}
      args={args}
      radius={Math.min(radius, Math.min(...args) / 2)}
      smoothness={3}
      rotation={rotation}
      castShadow
      receiveShadow
      {...props}
    >
      <meshStandardMaterial color={color} roughness={0.78} />
    </RoundedBox>
  );
}

function WallSegment({ wall, heightScale, plan }) {
  const [x1, z1] = wall.a;
  const [x2, z2] = wall.b;
  const length = Math.hypot(x2 - x1, z2 - z1);
  const angle = Math.atan2(z2 - z1, x2 - x1);
  const height = CEILING_HEIGHT * heightScale;
  const thickness = WALL_THICKNESS[wall.kind] ?? WALL_THICKNESS.inner;
  const midX = (x1 + x2) / 2;
  const midZ = (z1 + z2) / 2;
  // Plan mode renders walls as dark poché, like a section drawing.
  const wallColor = plan ? "#474d48" : wall.kind === "outer" ? COLORS.outerWall : COLORS.wall;
  return (
    <group>
      <mesh position={[midX, height / 2, midZ]} rotation={[0, -angle, 0]} castShadow receiveShadow>
        <boxGeometry args={[length, height, thickness]} />
        <meshStandardMaterial
          color={wallColor}
          roughness={0.92}
          transparent={!plan && heightScale < 0.72}
          opacity={!plan && heightScale < 0.72 ? 0.86 : 1}
        />
      </mesh>
      {heightScale < 0.98 && (
        <mesh position={[midX, height + 0.011, midZ]} rotation={[0, -angle, 0]}>
          <boxGeometry args={[length + 0.004, 0.022, thickness + 0.012]} />
          <meshStandardMaterial color={plan ? "#31362f" : "#988d7f"} roughness={0.8} />
        </mesh>
      )}
    </group>
  );
}

function Annotations() {
  const dimColor = "#7c746a";
  const chipStyle = { pointerEvents: "none" };
  return (
    <group name="annotations">
      <SceneLine points={[[0, 0.06, -0.55], [15.17, 0.06, -0.55]]} color={dimColor} lineWidth={1.4} />
      <SceneLine points={[[0, 0.06, -0.72], [0, 0.06, -0.38]]} color={dimColor} lineWidth={1.4} />
      <SceneLine points={[[15.17, 0.06, -0.72], [15.17, 0.06, -0.38]]} color={dimColor} lineWidth={1.4} />
      <Html position={[7.585, 0.06, -1.0]} center zIndexRange={[3, 0]} style={chipStyle}>
        <div className="dim-chip">15.17 m</div>
      </Html>
      <SceneLine points={[[-0.55, 0.06, 0], [-0.55, 0.06, 9.77]]} color={dimColor} lineWidth={1.4} />
      <SceneLine points={[[-0.72, 0.06, 0], [-0.38, 0.06, 0]]} color={dimColor} lineWidth={1.4} />
      <SceneLine points={[[-0.72, 0.06, 9.77], [-0.38, 0.06, 9.77]]} color={dimColor} lineWidth={1.4} />
      <Html position={[-1.05, 0.06, 4.885]} center zIndexRange={[3, 0]} style={chipStyle}>
        <div className="dim-chip">9.77 m</div>
      </Html>
      <group position={[14.2, 0.02, 8.6]}>
        <mesh position={[0, 0.05, 0.32]} rotation={[Math.PI / 2, 0, 0]}>
          <coneGeometry args={[0.16, 0.46, 4]} />
          <meshStandardMaterial color="#4c554e" />
        </mesh>
        <mesh position={[0, 0.05, -0.04]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.035, 0.035, 0.34, 10]} />
          <meshStandardMaterial color="#4c554e" />
        </mesh>
        <Html position={[0, 0.05, 0.95]} center zIndexRange={[3, 0]} style={chipStyle}>
          <div className="dim-chip">北</div>
        </Html>
      </group>
    </group>
  );
}

function WindowPanel({ item, heightScale }) {
  const sill = item.sill ?? 0.56;
  const opening = item.opening ?? 1.74;
  const visibleHeight = Math.min(opening, CEILING_HEIGHT * heightScale - sill);
  if (visibleHeight <= 0.08) return null;
  return (
    <group position={[item.x, 0, item.z]} rotation={[0, item.rotation, 0]}>
      <mesh position={[0, sill + visibleHeight / 2, 0]} castShadow>
        <boxGeometry args={[item.width, visibleHeight, 0.045]} />
        <meshPhysicalMaterial color="#9ec8cf" transmission={0.45} transparent opacity={0.42} roughness={0.14} />
      </mesh>
      <mesh position={[0, sill - 0.04, 0]}>
        <boxGeometry args={[item.width + 0.08, 0.07, 0.1]} />
        <meshStandardMaterial color="#6b7774" metalness={0.4} />
      </mesh>
    </group>
  );
}

function DoorUnit({ door, heightScale }) {
  const cutY = CEILING_HEIGHT * heightScale;
  const u = door.rot === 0 ? [1, 0] : [0, 1];
  const n = door.rot === 0 ? [0, 1] : [1, 0];
  const frameH = Math.min(door.height, Math.max(cutY, 0.22));
  const jambSize = door.rot === 0 ? [0.07, frameH, 0.15] : [0.15, frameH, 0.07];
  const showLintel = cutY > door.height + 0.05;

  if (door.type === "slide") {
    const panelH = Math.min(door.height - 0.08, Math.max(cutY - 0.06, 0.18));
    return (
      <group>
        {[-1, 1].map((side) => (
          <mesh key={side} position={[door.x + u[0] * side * (door.width / 2 + 0.035), frameH / 2, door.z + u[1] * side * (door.width / 2 + 0.035)]} castShadow>
            <boxGeometry args={jambSize} />
            <meshStandardMaterial color="#6f6a60" metalness={0.3} roughness={0.5} />
          </mesh>
        ))}
        {[-1, 1].map((side) => (
          <mesh
            key={`panel-${side}`}
            position={[
              door.x + u[0] * side * (door.width / 4) + n[0] * side * 0.03,
              panelH / 2 + 0.04,
              door.z + u[1] * side * (door.width / 4) + n[1] * side * 0.03,
            ]}
            rotation={[0, -door.rot, 0]}
            castShadow
          >
            <boxGeometry args={[door.width / 2 + 0.05, panelH, 0.04]} />
            <meshPhysicalMaterial color="#9ec8cf" transmission={0.4} transparent opacity={0.5} roughness={0.15} />
          </mesh>
        ))}
        <mesh position={[door.x, 0.025, door.z]} rotation={[0, -door.rot, 0]}>
          <boxGeometry args={[door.width + 0.1, 0.05, 0.1]} />
          <meshStandardMaterial color="#6f6a60" metalness={0.35} roughness={0.45} />
        </mesh>
      </group>
    );
  }

  const hingeX = door.x + u[0] * door.hinge * (door.width / 2);
  const hingeZ = door.z + u[1] * door.hinge * (door.width / 2);
  const openAngle = 0.92;
  const dirX = -u[0] * door.hinge * Math.cos(openAngle) + n[0] * door.swing * Math.sin(openAngle);
  const dirZ = -u[1] * door.hinge * Math.cos(openAngle) + n[1] * door.swing * Math.sin(openAngle);
  const leafH = Math.min(door.height, cutY) - 0.04;
  const leafLength = door.width - 0.06;
  const arcRadius = door.width - 0.04;
  const arcPoints = Array.from({ length: 13 }).map((_, index) => {
    const angle = (index / 12) * 1.35;
    return [
      hingeX + (-u[0] * door.hinge * Math.cos(angle) + n[0] * door.swing * Math.sin(angle)) * arcRadius,
      0.065,
      hingeZ + (-u[1] * door.hinge * Math.cos(angle) + n[1] * door.swing * Math.sin(angle)) * arcRadius,
    ];
  });

  return (
    <group>
      {[-1, 1].map((side) => (
        <mesh key={side} position={[door.x + u[0] * side * (door.width / 2 + 0.035), frameH / 2, door.z + u[1] * side * (door.width / 2 + 0.035)]} castShadow>
          <boxGeometry args={jambSize} />
          <meshStandardMaterial color="#7b6a55" roughness={0.62} />
        </mesh>
      ))}
      {showLintel && (
        <mesh position={[door.x, door.height + Math.min(0.14, cutY - door.height) / 2, door.z]} rotation={[0, -door.rot, 0]}>
          <boxGeometry args={[door.width + 0.14, Math.min(0.14, cutY - door.height), 0.15]} />
          <meshStandardMaterial color="#7b6a55" roughness={0.62} />
        </mesh>
      )}
      {leafH > 0.34 && (
        <mesh
          position={[hingeX + dirX * (leafLength / 2), leafH / 2 + 0.02, hingeZ + dirZ * (leafLength / 2)]}
          rotation={[0, -Math.atan2(dirZ, dirX), 0]}
          castShadow
        >
          <boxGeometry args={[leafLength, leafH, 0.045]} />
          <meshStandardMaterial color={door.type === "entry" ? "#5c554a" : "#a8865f"} roughness={0.55} />
        </mesh>
      )}
      <SceneLine points={arcPoints} color="#9d9184" lineWidth={1.6} transparent opacity={0.8} />
      <SceneLine
        points={[
          [hingeX, 0.065, hingeZ],
          [arcPoints[0][0], 0.065, arcPoints[0][2]],
        ]}
        color="#9d9184"
        lineWidth={1.6}
        transparent
        opacity={0.8}
      />
    </group>
  );
}

function roomRects(room) {
  return room.parts ?? [{ x: room.x, z: room.z, w: room.w, d: room.d }];
}

function RoomFloor({ room, selected, onSelect, selectable }) {
  return (
    <group>
      {roomRects(room).map((rect, index) => (
        <mesh
          key={`${room.id}-floor-${index}`}
          position={[rect.x + rect.w / 2, 0.025, rect.z + rect.d / 2]}
          receiveShadow
          onClick={selectable ? (event) => {
            event.stopPropagation();
            onSelect(room.id);
          } : undefined}
        >
          <boxGeometry args={[Math.max(rect.w - 0.045, 0.08), 0.05, Math.max(rect.d - 0.045, 0.08)]} />
          <meshStandardMaterial
            color={room.color}
            roughness={0.92}
            emissive={selected ? room.color : "#000000"}
            emissiveIntensity={selected ? 0.16 : 0}
          />
        </mesh>
      ))}
      {selected && roomRects(room).map((rect, index) => (
        <SceneLine
          key={`${room.id}-sel-${index}`}
          points={[
            [rect.x + 0.04, 0.09, rect.z + 0.04],
            [rect.x + rect.w - 0.04, 0.09, rect.z + 0.04],
            [rect.x + rect.w - 0.04, 0.09, rect.z + rect.d - 0.04],
            [rect.x + 0.04, 0.09, rect.z + rect.d - 0.04],
            [rect.x + 0.04, 0.09, rect.z + 0.04],
          ]}
          color="#f15b43"
          lineWidth={2.4}
        />
      ))}
    </group>
  );
}

function RoomLabels({ enabled }) {
  if (!enabled) return null;
  return rooms.map((room) => (
    <Html
      key={room.id}
      position={[room.x + room.w / 2, 0.15, room.z + room.d / 2]}
      center
      zIndexRange={[3, 0]}
      style={{ pointerEvents: "none" }}
    >
      <div className="scene-label">
        <span>{room.name}</span>
        <small>{room.area.toFixed(1)} m²</small>
      </div>
    </Html>
  ));
}

function WaterSystem() {
  return (
    <group name="water-system">
      {waterRoutes.map((route) => (
        <RoutePath
          key={route.id}
          points={route.points.map(([x, z]) => [x, route.y, z])}
          color={route.color}
          radius={route.id.startsWith("drain") ? 0.045 : 0.028}
        />
      ))}
      {waterFixtures.map((fixture) => (
        <group key={fixture.id} position={[fixture.x, 0.18, fixture.z]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.11, 0.11, 0.2, 28]} />
            <meshStandardMaterial color={fixture.type === "heater" ? "#ef735b" : "#2f9bc8"} emissive="#75cce8" emissiveIntensity={0.14} />
          </mesh>
          <mesh position={[0, 0.15, 0]}>
            <sphereGeometry args={[0.075, 18, 18]} />
            <meshStandardMaterial color="#eef9fb" emissive="#89d7ee" emissiveIntensity={0.45} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function ElectricalSystem({ wallHeightScale }) {
  const cutY = CEILING_HEIGHT * wallHeightScale;
  return (
    <group name="electrical-system">
      {electricalRoutes.map((route, index) => (
        <RoutePath
          key={route.id}
          points={route.points.map(([x, z]) => [x, Math.min(2.35 - index * 0.035, cutY - 0.08), z])}
          color={route.color}
          radius={0.02}
        />
      ))}
      {lightPoints.map((light) => (
        <group key={light.id} position={[light.x, Math.min(2.68, cutY - 0.08), light.z]}>
          <mesh>
            <sphereGeometry args={[0.095, 20, 20]} />
            <meshStandardMaterial color="#fff1bb" emissive="#ffd875" emissiveIntensity={1.8} toneMapped={false} />
          </mesh>
          <mesh position={[0, -0.065, 0]}>
            <cylinderGeometry args={[0.15, 0.08, 0.06, 28]} />
            <meshStandardMaterial color="#d2a850" metalness={0.45} />
          </mesh>
        </group>
      ))}
      {outlets.map((outlet) => (
        <mesh key={outlet.id} position={[outlet.x, 0.27, outlet.z]} rotation={[0, Math.PI / 4, 0]} castShadow>
          <boxGeometry args={[0.16, 0.22, 0.055]} />
          <meshStandardMaterial color="#f4c45f" emissive="#e7a93c" emissiveIntensity={0.15} />
        </mesh>
      ))}
      {electricalFixtures.map((item) => {
        const aboveCut = item.y >= cutY;
        const height = aboveCut ? 0.08 : Math.min(item.h, cutY - item.y);
        const y = aboveCut ? 0.12 : item.y + height / 2;
        return (
          <group key={item.id} position={[item.x, y, item.z]}>
            <Box
              position={[0, 0, 0]}
              args={[0.08, height, item.w]}
              color={item.type === "power" ? "#d7b15b" : item.type === "data" ? "#c4a46a" : "#8f9aa3"}
              radius={0.02}
            />
            {item.type !== "intercom" && (
              <Html position={[0.18, 0.16, 0]} center occlude={false} zIndexRange={[3, 0]} style={{ pointerEvents: "none" }}>
                <div className="system-chip electric">{item.name}</div>
              </Html>
            )}
          </group>
        );
      })}
    </group>
  );
}

function PlanPan({ enabled }) {
  const { camera, gl } = useThree();
  const dragging = useRef(false);
  const last = useRef({ x: 0, y: 0 });
  const right = useRef(new THREE.Vector3());
  const up = useRef(new THREE.Vector3());

  useEffect(() => {
    if (!enabled) return;
    const element = gl.domElement;
    element.style.cursor = "grab";

    const onDown = (event) => {
      if (event.button !== 0) return;
      dragging.current = true;
      last.current.x = event.clientX;
      last.current.y = event.clientY;
      element.style.cursor = "grabbing";
      element.setPointerCapture?.(event.pointerId);
    };
    const onMove = (event) => {
      if (!dragging.current) return;
      const dx = event.clientX - last.current.x;
      const dy = event.clientY - last.current.y;
      last.current.x = event.clientX;
      last.current.y = event.clientY;
      const distance = Math.max(camera.position.y, 4);
      const viewHeight = 2 * Math.tan((camera.fov * Math.PI) / 360) * distance;
      const viewWidth = viewHeight * (element.clientWidth / Math.max(element.clientHeight, 1));
      right.current.setFromMatrixColumn(camera.matrixWorld, 0);
      up.current.setFromMatrixColumn(camera.matrixWorld, 1);
      camera.position.addScaledVector(right.current, -(dx / element.clientWidth) * viewWidth);
      camera.position.addScaledVector(up.current, (dy / element.clientHeight) * viewHeight);
      camera.position.x = THREE.MathUtils.clamp(camera.position.x, -12, 12);
      camera.position.z = THREE.MathUtils.clamp(camera.position.z, -10, 10);
    };
    const onUp = (event) => {
      dragging.current = false;
      element.style.cursor = "grab";
      if (event.pointerId != null) element.releasePointerCapture?.(event.pointerId);
    };

    element.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      element.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      element.style.cursor = "";
    };
  }, [camera, enabled, gl]);

  return null;
}

function CameraController({ mode, selectedRoom, controlsRef, viewCommand }) {
  const { camera, gl } = useThree();
  const target = useRef(new THREE.Vector3(0, 0, 0));
  const destination = useRef(new THREE.Vector3(15.6, 13.2, 15.4));
  const animating = useRef(true);
  const lastPublishedDistance = useRef(-1);
  const previousMode = useRef(mode);
  const resetId = viewCommand?.type === "reset" ? viewCommand.id : 0;

  useEffect(() => {
    const enteredPlan = mode === "plan" && previousMode.current !== "plan";
    previousMode.current = mode;
    if (mode === "plan") {
      if (enteredPlan || resetId) {
        target.current.set(0, 0.18, 0);
        camera.position.set(0, 24.5, 0.001);
        destination.current.copy(camera.position);
      }
      camera.up.set(0, 0, -1);
      target.current.set(camera.position.x, 0.18, camera.position.z);
      camera.lookAt(target.current);
      animating.current = false;
      return;
    }
    const room = rooms.find((entry) => entry.id === selectedRoom);
    if (room) {
      const x = room.x + room.w / 2 - MODEL_SIZE.width / 2;
      const z = MODEL_SIZE.depth / 2 - (room.z + room.d / 2);
      target.current.set(x, 0.18, z);
      destination.current.set(x + 5.2, 6.9, z + 6.2);
    } else {
      target.current.set(0, 0.2, 0);
      destination.current.set(15.6, 13.2, 15.4);
    }
    animating.current = true;
  }, [camera, mode, selectedRoom, resetId]);

  useEffect(() => {
    if (!viewCommand || viewCommand.type === "reset" || !controlsRef.current) return;
    const controls = controlsRef.current;
    const focus = mode === "plan" ? target.current : controls.target;
    const offset = camera.position.clone().sub(focus);
    const currentDistance = offset.length();
    const factor = viewCommand.type === "zoomIn" ? 0.82 : 1.22;
    const minDistance = mode === "plan" ? 7.5 : 3.8;
    const maxDistance = mode === "plan" ? 32 : 28;
    const nextDistance = THREE.MathUtils.clamp(currentDistance * factor, minDistance, maxDistance);
    offset.setLength(nextDistance);
    camera.position.copy(focus).add(offset);
    destination.current.copy(camera.position);
    animating.current = false;
    if (mode === "plan") {
      camera.up.set(0, 0, -1);
      camera.lookAt(focus);
    } else {
      controls.update();
    }
  }, [camera, controlsRef, mode, viewCommand]);

  useFrame(() => {
    if (!controlsRef.current) return;
    const controls = controlsRef.current;
    const publishDistance = () => {
      const distance = camera.position.distanceTo(controls.target);
      if (Math.abs(distance - lastPublishedDistance.current) > 0.005) {
        gl.domElement.closest(".scene-host")?.setAttribute("data-camera-distance", distance.toFixed(3));
        lastPublishedDistance.current = distance;
      }
    };
    if (mode === "plan") {
      camera.up.set(0, 0, -1);
      target.current.set(camera.position.x, 0.18, camera.position.z);
      camera.lookAt(target.current);
      publishDistance();
      return;
    }

    if (animating.current) {
      camera.position.lerp(destination.current, 0.075);
      controls.target.lerp(target.current, 0.09);
      if (camera.position.distanceTo(destination.current) < 0.035 && controls.target.distanceTo(target.current) < 0.025) {
        camera.position.copy(destination.current);
        controls.target.copy(target.current);
        animating.current = false;
      }
    }
    camera.up.set(0, 1, 0);
    controls.update();
    publishDistance();
  });
  return null;
}

function SceneContent({ layers, mode, wallScale, selectedRoom, onSelectRoom, viewCommand }) {
  const controlsRef = useRef();
  const wallHeightScale = mode === "plan" ? Math.min(0.16, wallScale) : wallScale;

  return (
    <>
      <color attach="background" args={["#e6ddcd"]} />
      <fog attach="fog" args={["#e6ddcd", 20, 42]} />
      <SoftShadows size={16} samples={10} focus={0.55} />
      <ambientLight intensity={0.62} />
      <hemisphereLight args={["#fff6e4", "#96a398", 1.05]} />
      <directionalLight
        position={[8, 13, 6]}
        intensity={2.7}
        color="#fff1dc"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-9.5}
        shadow-camera-right={9.5}
        shadow-camera-top={9.5}
        shadow-camera-bottom={-9.5}
        shadow-camera-near={2}
        shadow-camera-far={40}
        shadow-bias={-0.0003}
        shadow-normalBias={0.035}
      />
      <directionalLight position={[-10, 8, -6]} intensity={0.55} color="#d2e4ff" />

      <group position={[-MODEL_SIZE.width / 2, 0, MODEL_SIZE.depth / 2]} scale={[1, 1, -1]}>
        <mesh position={[MODEL_SIZE.width / 2, -0.055, MODEL_SIZE.depth / 2]} receiveShadow>
          <boxGeometry args={[MODEL_SIZE.width + 0.4, 0.12, MODEL_SIZE.depth + 0.4]} />
          <meshStandardMaterial color="#cbc3b6" roughness={0.96} />
        </mesh>

        {rooms.map((room) => (
          <RoomFloor key={room.id} room={room} selected={selectedRoom === room.id} onSelect={onSelectRoom} selectable={mode !== "plan"} />
        ))}
        {walls.map((wall, index) => <WallSegment key={index} wall={wall} heightScale={wallHeightScale} plan={mode === "plan"} />)}
        {windows.map((item, index) => <WindowPanel key={index} item={item} heightScale={wallHeightScale} />)}
        {doors.map((door) => <DoorUnit key={door.id} door={door} heightScale={wallHeightScale} />)}
        {layers.water && <WaterSystem />}
        {layers.electric && <ElectricalSystem wallHeightScale={wallHeightScale} />}
        <RoomLabels enabled={layers.labels} />
        {layers.labels && <Annotations />}
      </group>

      <mesh position={[0, -0.14, 0]} receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[60, 60]} />
        <meshStandardMaterial color="#d1c9bc" roughness={1} />
      </mesh>
      <Grid
        position={[0, -0.07, 0]}
        cellSize={0.5}
        cellThickness={0.55}
        cellColor="#bbb1a2"
        sectionSize={2.5}
        sectionThickness={1.1}
        sectionColor="#a69a88"
        fadeDistance={34}
        fadeStrength={1.5}
        infiniteGrid
      />

      <OrbitControls
        ref={controlsRef}
        makeDefault
        enabled={mode !== "plan"}
        enableDamping
        dampingFactor={0.08}
        minDistance={4.5}
        maxDistance={28}
        maxPolarAngle={Math.PI / 2.02}
        minPolarAngle={0.18}
        enableRotate={mode !== "plan"}
      />
      <PlanPan enabled={mode === "plan"} />
      <CameraController mode={mode} selectedRoom={selectedRoom} controlsRef={controlsRef} viewCommand={viewCommand} />
    </>
  );
}

export function Scene3D(props) {
  return (
    <div
      className={`scene-host${props.mode === "plan" ? " is-plan" : ""}`}
      onWheel={(event) => {
        if (props.mode === "plan") {
          props.onPlanWheel?.(event.deltaY);
        }
      }}
    >
      <Canvas
        shadows
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: false, powerPreference: "high-performance", toneMappingExposure: 1.06 }}
        camera={{ position: [15.6, 13.2, 15.4], fov: 36, near: 0.1, far: 90 }}
        onPointerMissed={() => {
          if (props.mode !== "plan") props.onSelectRoom(null);
        }}
      >
        <Suspense fallback={null}>
          <SceneContent {...props} />
        </Suspense>
      </Canvas>
    </div>
  );
}

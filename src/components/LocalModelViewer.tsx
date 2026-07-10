"use client";

import { useEffect } from "react";
// @ts-ignore
import("@google/model-viewer").catch(() => {});

interface Props {
  zoneId: string;
}

export function LocalModelViewer({ zoneId }: Props) {
  const modelSrcMap: Record<string, string> = {
    F1: "/models/dongmun_food.glb",
    F2: "/models/seomun_food.glb",
    F3: "/models/food_truck.glb",
    F4: "/models/F1_food.glb",
    F5: "/models/F5_food.glb",
    F6: "/models/F6_food.glb",
    F8: "/models/F8_gome.glb",
    C1: "/models/wave_yard.glb",
    C3: "/models/port_gathering.glb",
    M1: "/models/dongmun_market.glb",
    M2: "/models/seomun_market.glb",
    E1: "/models/dongmun_entrance.glb",
    E2: "/models/seomun_entrance.glb",
    E3: "/models/입구 (2).glb",
    FA1: "/models/medical.glb",
    FA2: "/models/toilet.glb",
    FA5: "/models/항구마을.glb",
    P1: "/models/bts.glb",
    // 추가 구역은 여기서 관리
  };

  const modelSrc = modelSrcMap[zoneId] || "/models/제목 없음.glb";

  useEffect(() => {
    // @ts-ignore
    import("@google/model-viewer").catch(() => {});
  }, []);

  return (
    <div className="relative w-full h-[240px] bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm group">
      {/* @ts-ignore */}
      <model-viewer
        src={modelSrc}
        alt={`${zoneId} 구역 3D 모델`}
        camera-controls
        touch-action="pan-y"
        shadow-intensity="0.8"
        shadow-softness="1"
        auto-rotate
        // 상하 고정, 좌우 회전만 가능하게 설정
        camera-orbit="0deg 75deg 5m"
        min-camera-orbit="auto 75deg auto"
        max-camera-orbit="auto 75deg auto"
        field-of-view="35deg"
        interaction-prompt="none"
        style={{ 
          width: "100%", 
          height: "100%",
          backgroundColor: "#ffffff",
          outline: "none",
          // CSS 변수를 사용할 때만 타입을 any로 우회합니다
          "--poster-color": "#ffffff" 
        } as React.CSSProperties & { [key: string]: string }}
      >
        <div className="absolute top-3 left-3 bg-slate-900 text-[10px] text-white px-2.5 py-1 rounded-lg z-10 font-bold tracking-wider shadow-md">
          MODEL: {zoneId}
        </div>
      </model-viewer>
    </div>
  );
}
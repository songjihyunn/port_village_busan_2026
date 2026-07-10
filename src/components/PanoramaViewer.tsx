'use client';

import { useEffect, useRef } from 'react';

type ZoneConfig = {
  path: string;
  fov?: number;
  camY?: number;
};

const ZONE_PANORAMA_MAP: Record<string, ZoneConfig> = {
  F1:  { path: '/panorama/f1_domun_food1.jpg',        fov: 85, camY: -30  },
  C1:  { path: '/panorama/c1_wave_yard1.jpg',            fov: 85, camY: 0  },
  F2:  { path: '/panorama/f2_seomun_food1.jpg',          fov: 85, camY: 0  },
  M1:  { path: '/panorama/m1_dongmun_market1.jpg',       fov: 85, camY: 0  },
  FA1: { path: '/panorama/fa1_medical_center1.jpg',      fov: 85, camY: 0  },
  M2:  { path: '/panorama/m2_seomun_market1.jpg',        fov: 85, camY: -60 },
  FA2: { path: '/panorama/fa2_restroom1.jpg',            fov: 85, camY: 0  },
  F3:  { path: '/panorama/f3_food_truck1.jpg',           fov: 85, camY: 0  },
  F4:  { path: '/panorama/f4_food1_1.png',               fov: 85, camY: -30  },
  E1:  { path: '/panorama/e1_dongmon_entrance1.jpg',        fov: 85, camY: 30  },
  F5:  { path: '/panorama/f5_food2_1.jpg',                fov: 85, camY: 0  },
  F6:  { path: '/panorama/f6_food3_1.jpg',                fov: 85, camY: 0  },
  E2:  { path: '/panorama/e2_entrance_seomun.jpg',        fov: 85, camY: 0  },
  F7:  { path: '/panorama/f7_food4_1.jpg',                fov: 85, camY: 0  },
  P1:  { path: '/panorama/p1_bts_arirang1.jpg', fov: 85, camY: 0  },
  FA5: { path: '/panorama/fa5_1.png',                     fov: 85, camY: 30  },
  F8:  { path: '/panorama/f8_gome_selection1.jpg',       fov: 85, camY: 0  },
  C3:  { path: '/panorama/c3_port_gathering1.jpg',       fov: 85, camY: 0  },
  E3:  { path: '/panorama/e3_entrance1.jpg',             fov: 90, camY: -5 },
};

export function PanoramaViewer({ zoneId, height = 200 }: { zoneId: string; height?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
    let cleanup: (() => void) | undefined;

    script.onload = () => {
      const THREE = (window as any).THREE;
      cleanup = initPanorama(THREE);
    };
    document.head.appendChild(script);

    return () => {
      if (cleanup) cleanup();
      if (document.head.contains(script)) document.head.removeChild(script);
    };
  }, [zoneId]);

  const initPanorama = (THREE: any): (() => void) | undefined => {
    if (!canvasRef.current) return;

    let scene: any, camera: any, renderer: any, mesh: any;
    let rotY = Math.PI;
    let animationId: number;

    const config = ZONE_PANORAMA_MAP[zoneId];
    const fov  = config?.fov  ?? 85;
    const camY = config?.camY ?? 0;

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0e27);

    const width = canvasRef.current.clientWidth;

    camera = new THREE.PerspectiveCamera(fov, width / height, 0.1, 1000);
    camera.position.set(0, camY, 0);

    renderer = new THREE.WebGLRenderer({ canvas: canvasRef.current, antialias: true });
    canvasRef.current.style.height = `${height}px`;
    canvasRef.current.style.width = '100%';
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    function createMesh(textureToUse: any) {
      if (mesh) {
        scene.remove(mesh);
        mesh.geometry.dispose();
        mesh.material.dispose();
      }
      const geometry = new THREE.CylinderGeometry(100, 100, 300, 64, 1, true);
      const material = new THREE.MeshBasicMaterial({ map: textureToUse, side: THREE.BackSide });
      mesh = new THREE.Mesh(geometry, material);
      scene.add(mesh);
    }

    function loadPanorama(url: string) {
      const textureLoader = new THREE.TextureLoader();
      textureLoader.load(
        url,
        (texture: any) => {
          texture.minFilter = THREE.LinearFilter;
          texture.magFilter = THREE.LinearFilter;
          texture.wrapS = THREE.RepeatWrapping;
          texture.repeat.x = -1;
          createMesh(texture);
        },
        undefined,
        () => console.error(`파노라마 로드 실패: ${url}`)
      );
    }

    if (config?.path) loadPanorama(config.path);

    let isDragging = false;
    let lastX = 0;

    const onMouseDown = (e: MouseEvent) => { isDragging = true; lastX = e.clientX; };
    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging || !mesh) return;
      rotY -= (e.clientX - lastX) * 0.003;
      mesh.rotation.y = rotY;
      lastX = e.clientX;
    };
    const onMouseUp = () => { isDragging = false; };

    canvasRef.current.addEventListener('mousedown', onMouseDown);
    canvasRef.current.addEventListener('mousemove', onMouseMove);
    canvasRef.current.addEventListener('mouseup', onMouseUp);
    canvasRef.current.addEventListener('mouseleave', onMouseUp);

    const animate = () => { animationId = requestAnimationFrame(animate); renderer.render(scene, camera); };
    animate();

    return () => {
      cancelAnimationFrame(animationId);
      canvasRef.current?.removeEventListener('mousedown', onMouseDown);
      canvasRef.current?.removeEventListener('mousemove', onMouseMove);
      canvasRef.current?.removeEventListener('mouseup', onMouseUp);
      canvasRef.current?.removeEventListener('mouseleave', onMouseUp);
      renderer.dispose();
    };
  };

  return (
    <canvas
      ref={canvasRef}
      style={{ width: '100%', height: `${height}px`, display: 'block' }}
      className="cursor-ew-resize"
    />
  );
}

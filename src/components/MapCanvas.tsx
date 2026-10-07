import { useState } from 'react';
import { ZoomIn, ZoomOut, Maximize } from 'lucide-react';
import { mapMarkers, mapClusters, mapRoutes } from '../data/map';

export default function MapCanvas({ mode = 'operations', selectedId, onMarkerClick, onZoomCluster }: any) {
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  const handleZoomIn = () => setScale(s => Math.min(s + 0.3, 2.2));
  const handleZoomOut = () => setScale(s => Math.max(s - 0.3, 1));
  const handleReset = () => { setScale(1); setPan({ x: 0, y: 0 }); };

  return (
    <div className="w-full h-full relative group overflow-hidden">
      <svg 
        viewBox="0 0 1000 700" 
        className="w-full h-full object-cover origin-center transition-transform duration-300"
        style={{ transform: `scale(${scale}) translate(${pan.x}px, ${pan.y}px)` }}
        role="img"
        aria-label="Map showing devices and routes"
      >
        {/* Background */}
        <rect width="1000" height="700" fill="var(--bg_map)" />
        
        {/* Simple Neighborhood */}
        <path d="M-50 750 Q 200 600 300 750 Z" fill="var(--bg_success_primary)" opacity="0.5" />
        
        {/* Blocks */}
        <rect x="50" y="50" width="300" height="200" rx="20" fill="var(--map_block)" />
        <rect x="400" y="50" width="550" height="200" rx="20" fill="var(--map_block)" />
        <rect x="50" y="300" width="300" height="350" rx="20" fill="var(--map_block)" />
        <rect x="400" y="300" width="250" height="350" rx="20" fill="var(--map_block)" />
        <rect x="700" y="300" width="250" height="350" rx="20" fill="var(--map_block)" />

        {/* Roads are just the gaps between blocks, but we can draw some thick lines as roads */}
        <path d="M 375 0 L 375 700 M 0 275 L 1000 275 M 675 275 L 675 700" stroke="var(--map_road)" strokeWidth="50" strokeLinecap="round" />
        <path d="M 50 650 L 350 400 M 450 650 L 650 400" stroke="var(--map_road)" strokeWidth="16" strokeLinecap="round" />

        {/* Labels */}
        {mode !== 'simple' && (
          <g fill="var(--map_label)" className="text_xs uppercase font-semibold">
            <text x="100" y="150">Taman Indah Jaya</text>
            <text x="450" y="150">Taman Aman</text>
            <text x="100" y="450">Taman Telokbulatan</text>
            <text x="750" y="450">Telok Panglima Garang</text>
            
            <text x="360" y="150" transform="rotate(90 360 150)" fontSize="10">Jalan Waja 14</text>
            <text x="500" y="265" fontSize="10">Jalan Utama 28</text>
            <text x="660" y="450" transform="rotate(90 660 450)" fontSize="10">Jalan Nipah</text>
            <text x="200" y="525" transform="rotate(-40 200 525)" fontSize="10">Jalan Perepat</text>
          </g>
        )}

        {/* Routes */}
        {mode !== 'history' && mapRoutes.map((route, i) => (
          <polyline 
            key={i} 
            points={route.map(p => p.join(',')).join(' ')} 
            fill="none" 
            stroke="var(--map_route)" 
            strokeWidth="4" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            opacity={mode === 'infrastructure' ? 0.3 : 1}
          />
        ))}

        {/* Devices */}
        {mapMarkers.map(m => {
          const isSelected = selectedId === m.id;
          const statusColor = m.status === 'online' ? 'var(--bg_success_solid)' : m.status === 'offline' ? 'var(--bg_error_solid)' : 'var(--bg_neutral_solid)';
          const fill = mode === 'history' ? 'var(--bg_neutral_solid)' : statusColor;
          return (
            <g key={m.id} transform={`translate(${m.x}, ${m.y})`} className="cursor-pointer" onClick={() => onMarkerClick?.(m.id)}>
              {isSelected && <circle r="20" fill="none" stroke="var(--border_brand)" strokeWidth="2" className="animate-pulse" />}
              <circle r="12" fill={fill} stroke="var(--bg_primary)" strokeWidth="2" filter="drop-shadow(0px 1px 2px rgba(16,24,40,0.2))" />
              <text y="4" textAnchor="middle" fill="var(--text_white)" fontSize="11" fontWeight="bold">D</text>
              <title>{m.id} - {m.status}</title>
            </g>
          );
        })}

        {/* Clusters */}
        {mode !== 'history' && mapClusters.map(c => (
          <g key={c.id} transform={`translate(${c.x}, ${c.y})`} className="cursor-pointer" onClick={() => { onZoomCluster?.(); handleZoomIn(); }}>
            <circle r="17" fill="var(--bg_brand_solid)" stroke="var(--bg_primary)" strokeWidth="2" filter="drop-shadow(0px 1px 3px rgba(16,24,40,0.3))" />
            <text y="5" textAnchor="middle" fill="var(--text_white)" fontSize="14" fontWeight="bold">{c.count}</text>
          </g>
        ))}
      </svg>
      
      {/* Zoom Controls */}
      <div className="absolute top-4 right-4 flex flex-col gap-[1px] bg-secondary border border-secondary rounded-[8px] overflow-hidden shadow-sm">
        <button className="w-8 h-8 flex items-center justify-center bg-elevated hover:bg-secondary text-secondary transition-colors" onClick={handleZoomIn} aria-label="Zoom in">
          <ZoomIn className="w-4 h-4" />
        </button>
        <button className="w-8 h-8 flex items-center justify-center bg-elevated hover:bg-secondary text-secondary transition-colors" onClick={handleReset} aria-label="Reset zoom">
          <Maximize className="w-4 h-4" />
        </button>
        <button className="w-8 h-8 flex items-center justify-center bg-elevated hover:bg-secondary text-secondary transition-colors" onClick={handleZoomOut} aria-label="Zoom out">
          <ZoomOut className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

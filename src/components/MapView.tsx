import React, { useState, useEffect, useRef } from 'react';
import { 
  MapPin, 
  Navigation, 
  Info, 
  Store, 
  Compass, 
  Eye, 
  Filter, 
  CheckCircle, 
  ShoppingBag, 
  ArrowRight,
  Sparkles,
  Layers,
  Map as MapIcon,
  Sun,
  Moon,
  Compass as CompassIcon
} from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Shop, Offer, MapConfig } from '../types';
import ShopLogo from './ShopLogo';

interface MapViewProps {
  shops: Shop[];
  offers: Offer[];
  mapConfig: MapConfig;
  onSelectOffer: (offer: Offer) => void;
  initialSelectedShopId?: string | null;
}

// Real-world coordinates of stores in Oberá, Misiones, Argentina
const REAL_COORDINATES: Record<string, { lat: number; lng: number }> = {
  'shop-1': { lat: -27.484224, lng: -55.120531 }, // Yerba Mate & Delicias Misioneras - Av. Sarmiento 450
  'shop-2': { lat: -27.486214, lng: -55.118811 }, // Misiones Style - Av. Libertad 120
  'shop-3': { lat: -27.489512, lng: -55.115201 }, // Super El Condor - Av. Italia 890
  'shop-4': { lat: -27.485633, lng: -55.119312 }, // Electro Oberá - Plaza San Martin (Center)
  'shop-5': { lat: -27.483011, lng: -55.122045 }, // Heladeria Polar - Av. Sarmiento 210
  'shop-6': { lat: -27.487512, lng: -55.116521 }, // Calzados Carhue - Av. Libertad 340
};

type MapTheme = 'voyager' | 'positron' | 'dark';

export default function MapView({ shops, offers, mapConfig, onSelectOffer, initialSelectedShopId }: MapViewProps) {
  const [selectedShopId, setSelectedShopId] = useState<string | null>(initialSelectedShopId || 'shop-1');
  const [onlyOpen, setOnlyOpen] = useState(false);
  const [mapCategory, setMapCategory] = useState<string>('Todos');

  const getShopCoordinates = (shop: Shop): { lat: number; lng: number } => {
    const parseCoordinate = (val: any): number | undefined => {
      if (val === undefined || val === null) return undefined;
      const cleanStr = String(val).trim().replace(',', '.');
      const parsed = parseFloat(cleanStr);
      return isNaN(parsed) ? undefined : parsed;
    };

    const lat = parseCoordinate(shop.latitude);
    const lng = parseCoordinate(shop.longitude);

    if (lat !== undefined && lng !== undefined) {
      return { lat, lng };
    }
    if (REAL_COORDINATES[shop.id]) {
      return REAL_COORDINATES[shop.id];
    }
    // Fallback: Generate a deterministic offset based on shop.id numeric value near configured center
    const idNum = parseInt(shop.id.replace(/\D/g, '') || '0') || 1;
    const latOffset = ((idNum % 200) - 100) * 0.00012;
    const lngOffset = ((idNum % 130) - 65) * 0.00012;
    return { lat: mapConfig.centerLat + latOffset, lng: mapConfig.centerLng + lngOffset };
  };

  // Default map theme based on HTML dark class, otherwise Voyager
  const [mapTheme, setMapTheme] = useState<MapTheme>(() => {
    const isSystemDark = document.documentElement.classList.contains('dark');
    return isSystemDark ? 'dark' : 'voyager';
  });

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersRef = useRef<Record<string, L.Marker>>({});

  // Sync initialSelectedShopId if it changes externally
  useEffect(() => {
    if (initialSelectedShopId) {
      setSelectedShopId(initialSelectedShopId);
    }
  }, [initialSelectedShopId]);

  const filteredShops = shops.filter(shop => {
    if (onlyOpen && !shop.isOpen) return false;
    if (mapCategory !== 'Todos' && shop.category !== mapCategory) return false;
    return true;
  });

  const selectedShop = shops.find(s => s.id === selectedShopId);
  const selectedShopOffers = offers.filter(o => o.shopId === selectedShopId);

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Gastronomía': return '#f97316'; // Orange
      case 'Indumentaria': return '#ef4444'; // Red
      case 'Supermercados': return '#10b981'; // Emerald
      case 'Electro': return '#3b82f6'; // Blue
      default: return '#64748b'; // Slate
    }
  };

  // 1. Initialize map (runs once)
  useEffect(() => {
    if (!mapContainerRef.current) return;

    let initialCenter = { lat: mapConfig.centerLat, lng: mapConfig.centerLng };
    if (selectedShopId) {
      const targetShop = shops.find(s => s.id === selectedShopId);
      if (targetShop) {
        initialCenter = getShopCoordinates(targetShop);
      }
    }

    // Create Map
    const map = L.map(mapContainerRef.current, {
      center: [initialCenter.lat, initialCenter.lng],
      zoom: mapConfig.defaultZoom,
      zoomControl: false,
      scrollWheelZoom: true
    });

    mapRef.current = map;

    // Add standard zoom control on the bottom right
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Clean up on component unmount
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // 1b. Reactive re-centering when mapConfig changes in real-time
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.setView([mapConfig.centerLat, mapConfig.centerLng], mapConfig.defaultZoom);
  }, [mapConfig.centerLat, mapConfig.centerLng, mapConfig.defaultZoom]);

  // 2. Manage tile layer when mapTheme changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Remove old tile layer
    if (tileLayerRef.current) {
      tileLayerRef.current.remove();
    }

    let tileUrl = '';
    let attribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>';

    switch (mapTheme) {
      case 'dark':
        tileUrl = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
        break;
      case 'positron':
        tileUrl = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
        break;
      case 'voyager':
      default:
        tileUrl = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
        break;
    }

    const tileLayer = L.tileLayer(tileUrl, { attribution });
    tileLayer.addTo(map);
    tileLayerRef.current = tileLayer;
  }, [mapTheme]);

  // 3. Sync Markers reactively to filteredShops and selectedShopId changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clear previous markers
    Object.keys(markersRef.current).forEach(key => {
      markersRef.current[key]?.remove();
    });
    markersRef.current = {};

    filteredShops.forEach(shop => {
      const coord = getShopCoordinates(shop);

      const isSelected = selectedShopId === shop.id;
      const color = getCategoryColor(shop.category);

      const isUrl = shop.logo && (
        shop.logo.startsWith('http://') || 
        shop.logo.startsWith('https://') || 
        shop.logo.startsWith('/') || 
        shop.logo.startsWith('data:image')
      );

      const logoContentHtml = isUrl 
        ? `<img src="${shop.logo}" class="w-full h-full object-cover rounded-2xl" alt="${shop.name}" referrerPolicy="no-referrer" />`
        : `<span class="text-lg filter drop-shadow-xs select-none">${shop.logo || '🏪'}</span>`;

      // Create beautiful custom HTML DivIcon
      const iconHtml = `
        <div class="relative flex flex-col items-center" style="transform: translate(0, 0);">
          <div class="flex items-center justify-center w-10 h-10 rounded-2xl border-2 border-white dark:border-zinc-900 shadow-md transition-all duration-300 ${
            isSelected 
              ? 'scale-120 ring-4 ring-emerald-400/40 animate-bounce' 
              : 'hover:scale-110'
          }" style="background-color: ${color}; color: white; overflow: hidden;">
            ${logoContentHtml}
          </div>
          <!-- Pin Pointer -->
          <div class="w-3 h-3 rotate-45 border-r border-b border-white dark:border-zinc-900 -mt-2 shadow-xs transition-colors" style="background-color: ${color};"></div>
          
          <!-- Subtle Floating Name Tag for Selected -->
          ${isSelected ? `
            <div class="absolute top-11 bg-zinc-950/90 dark:bg-zinc-900/95 text-white text-[9px] font-black px-2 py-0.5 rounded-md whitespace-nowrap shadow-md border border-white/10">
              ${shop.name}
            </div>
          ` : ''}
        </div>
      `;

      const customIcon = L.divIcon({
        html: iconHtml,
        className: 'custom-leaflet-marker-wrapper',
        iconSize: [40, 40],
        iconAnchor: [20, 40]
      });

      const marker = L.marker([coord.lat, coord.lng], { icon: customIcon })
        .addTo(map)
        .on('click', () => {
          setSelectedShopId(shop.id);
        });

      markersRef.current[shop.id] = marker;
    });
  }, [filteredShops, selectedShopId]);

  // 4. Smooth map pan to selected shop coordinate
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedShopId) return;

    const targetShop = shops.find(s => s.id === selectedShopId);
    if (targetShop) {
      const coord = getShopCoordinates(targetShop);
      map.setView([coord.lat, coord.lng], 16, {
        animate: true,
        duration: 0.8
      });
    }
  }, [selectedShopId, shops]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24 transition-colors">
      
      {/* Search and Filters row */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/80 rounded-3xl p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="flex items-center gap-2.5 self-start sm:self-center">
            <Compass className="w-5 h-5 text-emerald-500 animate-spin-slow shrink-0" />
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-display font-black text-slate-900 dark:text-zinc-100 text-sm">
                  Mapa Interactivo Local (Leaflet)
                </h3>
                <span className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[9px] font-black uppercase px-2 py-0.5 rounded-full">
                  ● 100% GRATIS
                </span>
              </div>
              <p className="text-[10px] text-slate-400 dark:text-zinc-500 font-semibold">
                Navegá de forma libre y rápida. Sin anuncios, rastreadores ni claves de API.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            {/* Map Theme Buttons */}
            <div className="flex items-center bg-slate-50 dark:bg-zinc-800 p-1 rounded-xl border border-slate-150 dark:border-zinc-700">
              <button
                onClick={() => setMapTheme('voyager')}
                className={`p-1 px-2.5 rounded-lg text-[9px] font-extrabold uppercase transition-all flex items-center gap-1 cursor-pointer ${
                  mapTheme === 'voyager' ? 'bg-white dark:bg-zinc-700 shadow-xs text-brand-orange' : 'text-slate-400'
                }`}
                title="Cálido y Colorido"
              >
                🧉 Color
              </button>
              <button
                onClick={() => setMapTheme('positron')}
                className={`p-1 px-2.5 rounded-lg text-[9px] font-extrabold uppercase transition-all flex items-center gap-1 cursor-pointer ${
                  mapTheme === 'positron' ? 'bg-white dark:bg-zinc-700 shadow-xs text-emerald-500' : 'text-slate-400'
                }`}
                title="Claro Minimalista"
              >
                <Sun className="w-3 h-3" /> Claro
              </button>
              <button
                onClick={() => setMapTheme('dark')}
                className={`p-1 px-2.5 rounded-lg text-[9px] font-extrabold uppercase transition-all flex items-center gap-1 cursor-pointer ${
                  mapTheme === 'dark' ? 'bg-white dark:bg-zinc-700 shadow-xs text-indigo-400' : 'text-slate-400'
                }`}
                title="Noche de Misiones"
              >
                <Moon className="w-3 h-3" /> Oscuro
              </button>
            </div>

            <button
              onClick={() => setOnlyOpen(!onlyOpen)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer flex items-center gap-1.5 ${
                onlyOpen
                  ? 'bg-green-500 text-white border-green-500'
                  : 'bg-slate-50 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 border-slate-200/60 dark:border-zinc-700 hover:bg-slate-100'
              }`}
            >
              <CheckCircle className="w-3.5 h-3.5" /> Abiertos
            </button>

            <select
              value={mapCategory}
              onChange={(e) => setMapCategory(e.target.value)}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-50 dark:bg-zinc-800 border border-slate-200/60 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 focus:outline-hidden cursor-pointer"
            >
              <option value="Todos">Todas las Categorías</option>
              <option value="Gastronomía">Gastronomía</option>
              <option value="Indumentaria">Indumentaria</option>
              <option value="Supermercados">Supermercados</option>
              <option value="Electro">Electro</option>
            </select>
          </div>
        </div>
      </div>

      {/* Map container - standard Leaflet div */}
      <div className="relative w-full aspect-[4/3] md:aspect-[16/9] bg-[#faf6f0] dark:bg-zinc-950 border border-slate-100 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm flex flex-col justify-end">
        {/* Colorful top border strip */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-500 via-[#5CE1B2] to-teal-400 z-20" />
        
        {/* Leaflet DOM container */}
        <div ref={mapContainerRef} className="w-full h-full z-10" />

        {/* Legend Map overlay */}
        <div className="absolute left-3 bottom-3 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md p-3 rounded-2xl border border-slate-100 dark:border-zinc-800/80 shadow-md text-[9px] font-black text-slate-600 dark:text-zinc-400 space-y-1 z-20">
          <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-orange-500" /> Gastronomía</div>
          <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500" /> Indumentaria</div>
          <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Supermercados</div>
          <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Electro</div>
        </div>
      </div>

      {/* Selected Shop Drawer */}
      {selectedShop && (
        <div className="bg-white dark:bg-zinc-900 border border-slate-150 dark:border-zinc-800/80 rounded-3xl p-5 shadow-sm space-y-4 animate-in slide-in-from-bottom-3 duration-250">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-zinc-800 shadow-inner rounded-2xl p-2.5 flex items-center justify-center w-16 h-16 shrink-0 overflow-hidden">
                <ShopLogo logo={selectedShop.logo} className="text-3xl" fallbackSize="w-12 h-12" />
              </div>
              <div>
                <h4 className="font-display font-extrabold text-slate-900 dark:text-zinc-50 text-base">{selectedShop.name}</h4>
                <div className="flex flex-wrap items-center gap-2 mt-0.5">
                  <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-bold uppercase">{selectedShop.category}</span>
                  <span className="text-slate-200 dark:text-zinc-700">•</span>
                  <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400 flex items-center gap-0.5">
                    ⭐ {selectedShop.rating}
                  </span>
                  <span className="text-slate-200 dark:text-zinc-700">•</span>
                  <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-full ${
                    selectedShop.isOpen ? 'text-green-600 bg-green-55/15 dark:text-green-400' : 'text-slate-500 bg-slate-50 dark:bg-zinc-800'
                  }`}>
                    {selectedShop.isOpen ? 'Abierto' : 'Cerrado'}
                  </span>
                </div>
              </div>
            </div>

            <a
              href={`https://wa.me/${selectedShop.phone}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-slate-50 dark:bg-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer self-start sm:self-center"
            >
              Contactar por WhatsApp
            </a>
          </div>

          <div className="border-t border-slate-100 dark:border-zinc-800/80 pt-4">
            <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-bold uppercase block mb-3.5">Ofertas en este local</span>
            
            {selectedShopOffers.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No hay ofertas publicadas para este local actualmente.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedShopOffers.map((offer) => (
                  <div
                    key={offer.id}
                    onClick={() => onSelectOffer(offer)}
                    className="p-3 bg-slate-50 dark:bg-zinc-950 hover:bg-[#5CE1B2]/5 dark:hover:bg-zinc-800 border border-slate-100 dark:border-zinc-800 rounded-2xl flex items-center justify-between gap-3 cursor-pointer transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={offer.image}
                        alt={offer.title}
                        className="w-12 h-12 object-cover rounded-xl shrink-0 border border-slate-100 dark:border-zinc-850"
                        referrerPolicy="no-referrer"
                      />
                      <div>
                        <h5 className="text-xs font-bold text-slate-800 dark:text-zinc-200 leading-snug group-hover:text-emerald-500 dark:group-hover:text-emerald-450 transition-colors">
                          {offer.title}
                        </h5>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="text-xs font-black text-red-500 dark:text-red-400">
                            ${offer.discountPrice.toLocaleString('es-AR')}
                          </span>
                          <span className="text-[10px] text-slate-400 dark:text-zinc-500 line-through">
                            ${offer.originalPrice.toLocaleString('es-AR')}
                          </span>
                        </div>
                      </div>
                    </div>

                    <span className="p-1.5 bg-white dark:bg-zinc-900 text-slate-400 group-hover:text-emerald-500 dark:group-hover:text-emerald-450 rounded-xl border border-slate-100 dark:border-zinc-800 shadow-xs transition-colors shrink-0">
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}

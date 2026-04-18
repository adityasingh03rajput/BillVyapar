import { useEffect, useRef, useState } from "react";
import { Button } from "./ui/button";
import { Navigation, MapPin } from "lucide-react";

interface Props {
  lat: number;
  lng: number;
  geofenceMeters: number;
  onChange: (data: { lat: number; lng: number; address?: string }) => void;
  onGeofenceChange?: (meters: number) => void;
}

const GOOGLE_MAPS_KEY = (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY ?? "";

export function WorkLocationPicker({ lat, lng, geofenceMeters, onChange, onGeofenceChange }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const circleRef = useRef<any>(null);
  const [mapReady, setMapReady] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (window.google?.maps?.Map) {
      setMapReady(true);
      return;
    }
    const s = document.createElement("script");
    s.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_KEY}&libraries=marker,geometry&v=weekly`;
    s.async = true;
    s.onload = () => setMapReady(true);
    document.head.appendChild(s);
  }, []);

  useEffect(() => {
    if (!mapReady || !mapRef.current || mapInstanceRef.current) return;

    const initialPos = { lat: lat || 20.5937, lng: lng || 78.9629 };
    
    mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
      center: initialPos,
      zoom: lat ? 16 : 5,
      mapId: "LOCATION_PICKER_MAP",
      disableDefaultUI: false,
      zoomControl: true,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
    });

    const { AdvancedMarkerElement, PinElement } = window.google.maps.marker;

    const pin = new PinElement({
      background: "#4f46e5",
      borderColor: "#fff",
      glyphColor: "#fff",
    });

    markerRef.current = new AdvancedMarkerElement({
      map: mapInstanceRef.current,
      position: initialPos,
      content: pin.element,
      gmpDraggable: true,
    });

    circleRef.current = new window.google.maps.Circle({
      map: mapInstanceRef.current,
      center: initialPos,
      radius: geofenceMeters || 100,
      fillColor: "#4f46e5",
      fillOpacity: 0.1,
      strokeColor: "#4f46e5",
      strokeWeight: 2,
      strokeOpacity: 0.5,
      clickable: false,
    });

    // Handle Drag
    markerRef.current.addListener("dragend", async () => {
      const pos = markerRef.current.position;
      const newLat = pos.lat;
      const newLng = pos.lng;
      circleRef.current.setCenter({ lat: newLat, lng: newLng });
      
      // Reverse geocode
      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${newLat}&lon=${newLng}&format=json&zoom=18`, {
          headers: { 'User-Agent': 'BillVyapar/1.0' }
        });
        const data = await response.json();
        const addr = data.display_name || "";
        onChange({ lat: newLat, lng: newLng, address: addr });
      } catch {
        onChange({ lat: newLat, lng: newLng });
      }
    });

    // Handle Map Click
    mapInstanceRef.current.addListener("click", async (e: any) => {
      const newLat = e.latLng.lat();
      const newLng = e.latLng.lng();
      markerRef.current.position = { lat: newLat, lng: newLng };
      circleRef.current.setCenter({ lat: newLat, lng: newLng });

      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${newLat}&lon=${newLng}&format=json&zoom=18`, {
          headers: { 'User-Agent': 'BillVyapar/1.0' }
        });
        const data = await response.json();
        const addr = data.display_name || "";
        onChange({ lat: newLat, lng: newLng, address: addr });
      } catch {
        onChange({ lat: newLat, lng: newLng });
      }
    });

  }, [mapReady]);

  // Sync circle radius
  useEffect(() => {
    if (circleRef.current) {
      circleRef.current.setRadius(geofenceMeters || 100);
    }
  }, [geofenceMeters]);

  // Sync marker position if externally updated (e.g. from address search)
  useEffect(() => {
    if (markerRef.current && lat && lng) {
      const currentPos = markerRef.current.position;
      if (Math.abs(currentPos.lat - lat) > 0.0001 || Math.abs(currentPos.lng - lng) > 0.0001) {
        markerRef.current.position = { lat, lng };
        circleRef.current.setCenter({ lat, lng });
        mapInstanceRef.current.panTo({ lat, lng });
      }
    }
  }, [lat, lng]);

  const detectLocation = () => {
    if (!navigator.geolocation) return;
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const newLat = pos.coords.latitude;
        const newLng = pos.coords.longitude;
        markerRef.current.position = { lat: newLat, lng: newLng };
        circleRef.current.setCenter({ lat: newLat, lng: newLng });
        mapInstanceRef.current.setCenter({ lat: newLat, lng: newLng });
        mapInstanceRef.current.setZoom(17);
        onChange({ lat: newLat, lng: newLng });
        setLoading(false);
      },
      () => setLoading(false)
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <p className="text-xs font-bold text-foreground">Pinpoint Work Location</p>
          <p className="text-[10px] text-muted-foreground">Drag the pulse marker or click the map</p>
        </div>
        <Button size="sm" variant="outline" onClick={detectLocation} disabled={loading} className="h-8 rounded-lg gap-1.5 text-[10px] font-bold uppercase tracking-widest">
          <Navigation className="h-3 w-3" /> {loading ? 'Locating...' : 'My Location'}
        </Button>
      </div>

      <div className="relative rounded-2xl overflow-hidden border border-border/40 h-[240px] shadow-inner bg-muted/20">
        <div ref={mapRef} className="w-full h-full" />
        <div className="absolute bottom-3 left-3 right-3 flex items-center gap-3 bg-background/80 backdrop-blur-md p-2 rounded-xl border border-white/20 shadow-lg pointer-events-none">
           <MapPin className="h-4 w-4 text-primary shrink-0" />
           <div className="flex-1 min-w-0">
              <p className="text-[10px] font-black text-foreground truncate uppercase tracking-tighter">
                {lat ? `${lat.toFixed(5)}, ${lng.toFixed(5)}` : "Select Location"}
              </p>
           </div>
        </div>
      </div>

      {/* Geofence Progress Visualizer */}
      <div className="space-y-2">
        <div className="flex justify-between items-end">
          <label className="text-[10px] font-bold uppercase tracking-widest opacity-50">Geofence Coverage</label>
          <span className="text-[10px] font-black text-primary">{geofenceMeters}m</span>
        </div>
        <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary transition-all duration-300 shadow-[0_0_8px_rgba(79,70,229,0.4)]" 
            style={{ width: `${Math.min(100, (geofenceMeters / 1000) * 100)}%` }}
          />
        </div>
        <p className="text-[9px] text-muted-foreground text-center italic">Shows relative area covered (scaled to 1km max visual)</p>
      </div>
    </div>
  );
}

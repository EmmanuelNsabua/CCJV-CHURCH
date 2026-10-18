"use client";

import React, { useEffect, useRef, useState } from "react";
import type { Map as LeafletMap, Marker as LeafletMarker, LeafletMouseEvent } from "leaflet";
import { MapPin, Locate } from "lucide-react";
import { Button } from "@/components/ui/Button";

export interface MapLocationPickerProps {
  latitude?: string | number;
  longitude?: string | number;
  address?: string;
  onChange: (lat: number, lng: number) => void;
  disabled?: boolean;
}

// Coordonnées par défaut : Lubumbashi, Quartier Hewa Bora
const DEFAULT_LAT = -11.66089;
const DEFAULT_LNG = 27.47938;

export function MapLocationPicker({
  latitude,
  longitude,
  address,
  onChange,
  disabled = false,
}: MapLocationPickerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<LeafletMap | null>(null);
  const markerRef = useRef<LeafletMarker | null>(null);

  const initialLat = Number(latitude) || DEFAULT_LAT;
  const initialLng = Number(longitude) || DEFAULT_LNG;

  const [currentLat, setCurrentLat] = useState(initialLat);
  const [currentLng, setCurrentLng] = useState(initialLng);
  const [isMapReady, setIsMapReady] = useState(false);

  // Synchronisation des props externes
  useEffect(() => {
    if (latitude !== undefined && !isNaN(Number(latitude))) {
      setCurrentLat(Number(latitude));
    }
    if (longitude !== undefined && !isNaN(Number(longitude))) {
      setCurrentLng(Number(longitude));
    }
  }, [latitude, longitude]);

  useEffect(() => {
    if (!mapContainerRef.current) return;
    let isMounted = true;

    async function initLeaflet() {
      // Import dynamique de Leaflet côté client
      const L = (await import("leaflet")).default;
      await import("leaflet/dist/leaflet.css");

      if (!isMounted || !mapContainerRef.current) return;

      // Nettoyer si déjà initialisé
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      // Créer la carte
      const map = L.map(mapContainerRef.current, {
        center: [currentLat, currentLng],
        zoom: 16,
        zoomControl: true,
      });

      mapInstanceRef.current = map;

      // Fond de carte OpenStreetMap standard
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      // Icône personnalisée SVG haute fidélité (évite les bugs d'images relatives de Leaflet)
      const pinIcon = L.divIcon({
        className: "ccjv-custom-map-pin",
        html: `
          <div style="position: relative; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; cursor: grab;">
            <div style="position: absolute; width: 28px; height: 28px; background-color: #166534; border: 2px solid #ffffff; box-shadow: 0 4px 10px rgba(0,0,0,0.35); display: flex; align-items: center; justify-content: center;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
            </div>
            <div style="position: absolute; bottom: -6px; left: 14px; width: 8px; height: 8px; background: #166534; transform: rotate(45deg); border-right: 2px solid white; border-bottom: 2px solid white;"></div>
          </div>
        `,
        iconSize: [36, 42],
        iconAnchor: [18, 42],
        popupAnchor: [0, -36],
      });

      // Marqueur déplaçable (draggable)
      const marker = L.marker([currentLat, currentLng], {
        icon: pinIcon,
        draggable: !disabled,
      }).addTo(map);

      markerRef.current = marker;

      // Popup
      marker.bindPopup(`
        <div style="font-family: sans-serif; font-size: 12px; padding: 2px;">
          <strong style="color: #166534;">Centre Chrétien Jésus ma Vie</strong><br/>
          <span>${address || "Point GPS de l'église"}</span>
        </div>
      `);

      // Événement déplacement du marqueur
      marker.on("dragend", () => {
        const position = marker.getLatLng();
        const newLat = Number(position.lat.toFixed(6));
        const newLng = Number(position.lng.toFixed(6));
        setCurrentLat(newLat);
        setCurrentLng(newLng);
        onChange(newLat, newLng);
      });

      // Événement clic sur la carte pour placer le point
      map.on("click", (e: LeafletMouseEvent) => {
        if (disabled) return;
        const newLat = Number(e.latlng.lat.toFixed(6));
        const newLng = Number(e.latlng.lng.toFixed(6));
        marker.setLatLng([newLat, newLng]);
        setCurrentLat(newLat);
        setCurrentLng(newLng);
        onChange(newLat, newLng);
      });

      setIsMapReady(true);
    }

    initLeaflet();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Déplacement de la carte et du marqueur lorsque les coordonnées changent depuis les inputs
  const handleRecenter = (lat: number, lng: number) => {
    setCurrentLat(lat);
    setCurrentLng(lng);
    onChange(lat, lng);
    if (mapInstanceRef.current && markerRef.current) {
      mapInstanceRef.current.setView([lat, lng], 16);
      markerRef.current.setLatLng([lat, lng]);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <label className="text-xs font-semibold text-ccjv-ink font-sans tracking-wide flex items-center gap-1.5">
          <MapPin className="h-4 w-4 text-ccjv-green" />
          <span>Pointage géographique exact sur la carte</span>
        </label>
        <div className="flex items-center gap-2 text-xs">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleRecenter(DEFAULT_LAT, DEFAULT_LNG)}
            disabled={disabled}
            className="text-[11px] h-7 px-2"
          >
            <Locate className="h-3 w-3 mr-1 text-ccjv-green" />
            Position Hewa Bora (Défaut)
          </Button>
        </div>
      </div>

      <p className="text-xs text-ccjv-ink-secondary">
        Cliquez sur la carte ou faites glisser le marqueur vert pour positionner précisément l&apos;entrée de l&apos;église.
      </p>

      {/* Conteneur de la carte */}
      <div className="relative border border-ccjv-line bg-[#f3f2ee] h-80 sm:h-96 w-full overflow-hidden">
        <div ref={mapContainerRef} className="h-full w-full z-10" />

        {!isMapReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70 z-20 text-xs text-ccjv-ink">
            Chargement de la carte interactive...
          </div>
        )}

        {/* Badge d'aide et coordonnées en superposition */}
        <div className="absolute bottom-3 left-3 z-30 bg-white/95 border border-ccjv-line px-3 py-1.5 shadow-sm text-xs font-mono text-ccjv-ink flex items-center gap-2">
          <span className="font-sans font-bold text-[11px] text-ccjv-green uppercase">GPS :</span>
          <span>{currentLat.toFixed(6)}, {currentLng.toFixed(6)}</span>
        </div>
      </div>
    </div>
  );
}

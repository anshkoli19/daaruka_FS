import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import MapboxDraw from "@mapbox/mapbox-gl-draw";
import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN || "";

/**
 * Renders projects/sites as polygons. If `onPolygonDrawn` is passed,
 * enables draw controls so an admin can draw a new site boundary.
 */
export default function MapView({ sites = [], onPolygonDrawn, onSiteClick, center = [72.8777, 19.076], zoom = 4 }) {
  const mapContainer = useRef(null);
  const mapRef = useRef(null);
  const drawRef = useRef(null);

  useEffect(() => {
    if (!mapboxgl.accessToken) return; // no token configured yet

    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/satellite-streets-v12",
      center,
      zoom,
    });
    mapRef.current = map;

    if (onPolygonDrawn) {
      const draw = new MapboxDraw({
        displayControlsDefault: false,
        controls: { polygon: true, trash: true },
      });
      drawRef.current = draw;
      map.addControl(draw);
      map.on("draw.create", (e) => onPolygonDrawn(e.features[0].geometry));
      map.on("draw.update", (e) => onPolygonDrawn(e.features[0].geometry));
    }

    map.on("load", () => {
      sites.forEach((site) => {
        const sourceId = `site-${site.id}`;
        if (map.getSource(sourceId)) return;
        map.addSource(sourceId, {
          type: "geojson",
          data: { type: "Feature", geometry: site.geometry, properties: { id: site.id, name: site.name } },
        });
        map.addLayer({
          id: `${sourceId}-fill`,
          type: "fill",
          source: sourceId,
          paint: { "fill-color": "#2e8b57", "fill-opacity": 0.35 },
        });
        map.addLayer({
          id: `${sourceId}-line`,
          type: "line",
          source: sourceId,
          paint: { "line-color": "#1a5c3a", "line-width": 2 },
        });
        if (onSiteClick) {
          map.on("click", `${sourceId}-fill`, () => onSiteClick(site.id));
          map.on("mouseenter", `${sourceId}-fill`, () => (map.getCanvas().style.cursor = "pointer"));
          map.on("mouseleave", `${sourceId}-fill`, () => (map.getCanvas().style.cursor = ""));
        }
      });
    });

    return () => map.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sites]);

  if (!mapboxgl.accessToken) {
    return (
      <div className="map-container" style={{ display: "flex", alignItems: "center", justifyContent: "center", background: "#e5e9e7" }}>
        <p>Set VITE_MAPBOX_TOKEN in your .env to enable the map.</p>
      </div>
    );
  }

  return <div ref={mapContainer} className="map-container" />;
}


import { useEffect, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  FeatureGroup,
  GeoJSON,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet-draw";

import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";

function DrawControls({ onBoundaryChange }) {
  const map = useMap();
  const featureGroupRef = useRef(null);

  useEffect(() => {
    const featureGroup = featureGroupRef.current;
    if (!featureGroup) return;

    const drawControl = new L.Control.Draw({
      position: "topright",
      draw: {
        polygon: true,
        rectangle: false,
        circle: false,
        circlemarker: false,
        marker: false,
        polyline: false,
      },
      edit: {
        featureGroup,
      },
    });

    map.addControl(drawControl);

    function handleCreated(event) {
      featureGroup.addLayer(event.layer);
      const geoJSON = event.layer.toGeoJSON();

      if (geoJSON.geometry?.type === "Polygon") {
        onBoundaryChange(geoJSON.geometry);
      }
    }

    function handleEdited(event) {
      event.layers.eachLayer((layer) => {
        const geoJSON = layer.toGeoJSON();

        if (geoJSON.geometry?.type === "Polygon") {
          onBoundaryChange(geoJSON.geometry);
        }
      });
    }

    function handleDeleted() {
      onBoundaryChange(null);
    }

    map.on(L.Draw.Event.CREATED, handleCreated);
    map.on(L.Draw.Event.EDITED, handleEdited);
    map.on(L.Draw.Event.DELETED, handleDeleted);

    return () => {
      map.off(L.Draw.Event.CREATED, handleCreated);
      map.off(L.Draw.Event.EDITED, handleEdited);
      map.off(L.Draw.Event.DELETED, handleDeleted);
      map.removeControl(drawControl);
    };
  }, [map, onBoundaryChange]);

  return <FeatureGroup ref={featureGroupRef} />;
}

function SiteMap({ onBoundaryChange, sites = [] }) {
  return (
    <div className="w-full h-[400px] rounded-lg overflow-hidden border border-slate-300">
      <MapContainer
        center={[18.5204, 73.8567]}
        zoom={10}
        scrollWheelZoom={true}
        className="w-full h-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <DrawControls onBoundaryChange={onBoundaryChange} />

        {sites.map((site) =>
          site.boundary ? (
            <GeoJSON key={site.id} data={site.boundary} />
          ) : null
        )}
      </MapContainer>
    </div>
  );
}

export default SiteMap;
import Map = require("esri/Map");
import SceneView = require("esri/views/SceneView");

let map = new Map({
  basemap: "topo-vector",
  ground: "world-elevation"
});

new SceneView({
  container: "viewDiv",
  map: map,
  scale: 50000000,
  center: [-101.17, 21.78]
});
define(["require", "exports", "esri/Map", "esri/views/SceneView"], function (require, exports, Map, SceneView) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var map = new Map({
        basemap: "topo-vector",
        ground: "world-elevation"
    });
    new SceneView({
        container: "viewDiv",
        map: map,
        scale: 50000000,
        center: [-101.17, 21.78]
    });
});
//# sourceMappingURL=main.js.map
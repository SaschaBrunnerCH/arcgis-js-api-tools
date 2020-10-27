define(["require", "exports", "esri/views/SceneView", "esri/WebScene", "esri/core/watchUtils", "esri/config"], function (require, exports, SceneView, WebScene, watchUtils, esriConfig) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var urlParams = new URLSearchParams(document.location.search);
    var portalUrl = "https://www.arcgis.com";
    if (urlParams.has("portal")) {
        portalUrl = urlParams.get("portal") || portalUrl;
    }
    esriConfig.portalUrl = portalUrl;
    var webSceneId = "3a9976baef9240ab8645ee25c7e9c096";
    if (urlParams.has("webscene")) {
        webSceneId = urlParams.get("webscene") || webSceneId;
    }
    if (!urlParams.has("noinfo")) {
        document.getElementById("titleDiv").style.display = "block";
        document.getElementById("slideTitleDiv").style.display = "block";
        document.getElementById("slideCountDiv").style.display = "block";
        document.getElementById("progressbarDiv").style.display = "block";
    }
    var startSlide = 0;
    if (urlParams.has("start")) {
        startSlide = parseInt(urlParams.get("start") || startSlide.toString(), 0);
    }
    var animationTime = 3000;
    if (urlParams.has("animation")) {
        animationTime = parseInt(urlParams.get("animation") || animationTime.toString(), 0);
    }
    var waitTime = 1000;
    if (urlParams.has("wait")) {
        waitTime = parseInt(urlParams.get("wait") || waitTime.toString(), 0);
    }
    var webScene = new WebScene({
        portalItem: {
            id: webSceneId
        }
    });
    var view = new SceneView({
        map: webScene,
        container: "viewDiv",
        ui: { components: [] } // disable the UI comonents
    });
    webScene.when(function () {
        var slides = webScene.presentation.slides;
        document.getElementById("titleDiv").innerHTML = webScene.portalItem.title;
        document.getElementById("slideCountDiv").innerHTML = startSlide + "/" + slides.length;
        view.when(function () {
            if (startSlide > 0) {
                view.goTo(slides.getItemAt(startSlide - 1).viewpoint.camera);
                document.getElementById("slideTitleDiv").innerHTML = slides.getItemAt(startSlide - 1).title.text || "";
            }
            setTimeout(updateLoading, 1000);
            watchUtils.whenFalseOnce(view, "updating", function () {
                goToSlide(startSlide);
            });
        });
        function goToSlide(i) {
            if (i < slides.length) {
                document.getElementById("slideCountDiv").innerHTML = i + 1 + "/" + slides.length;
                var slide = slides.getItemAt(i);
                document.getElementById("slideTitleDiv").innerHTML = slide.title.text || "";
                slide
                    .applyTo(view, {
                    duration: animationTime
                })
                    .then(function () {
                    watchUtils.whenFalseOnce(view, "updating", function () {
                        window.setTimeout(function () {
                            goToSlide(i + 1);
                        }, waitTime);
                    });
                });
            }
            else {
                console.log("STOP");
            }
        }
        function updateLoading() {
            var progressbarDiv = document.getElementById("progressbarDiv");
            progressbarDiv.style.width = Math.min(10 * view.performanceInfo.load, 100) + "%";
            setTimeout(updateLoading, 1000);
        }
    });
});
//# sourceMappingURL=main.js.map
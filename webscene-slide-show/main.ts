import SceneView = require("esri/views/SceneView");
import WebScene = require("esri/WebScene");
import watchUtils = require("esri/core/watchUtils");
import esriConfig = require("esri/config");
const urlParams = new URLSearchParams(document.location.search);

let portalUrl = "https://www.arcgis.com";
if (urlParams.has("portal")) {
    portalUrl = urlParams.get("portal") || portalUrl;
}
esriConfig.portalUrl = portalUrl;

let webSceneId = "3a9976baef9240ab8645ee25c7e9c096";
if (urlParams.has("webscene")) {
    webSceneId = urlParams.get("webscene") || webSceneId;
}

if (!urlParams.has("noinfo")) {
    document.getElementById("titleDiv")!.style.display = "block";
    document.getElementById("slideTitleDiv")!.style.display = "block";
    document.getElementById("slideCountDiv")!.style.display = "block";
    document.getElementById("progressbarDiv")!.style.display = "block";
}

let portalOptions = {};
if (!urlParams.has("enableSignIn")) {
    // avoid ui authentication/identification for portal or layers
    esriConfig.request.useIdentity = false;      // layer
    portalOptions = { authMode: "anonymous" };   // portal
}

let startSlide = 0;
if (urlParams.has("start")) {
    startSlide = parseInt(urlParams.get("start") || startSlide.toString(), 0);
}

let animationTime = 3000;
if (urlParams.has("animation")) {
    animationTime = parseInt(urlParams.get("animation") || animationTime.toString(), 0);
}

let waitTime = 1000;
if (urlParams.has("wait")) {
    waitTime = parseInt(urlParams.get("wait") || waitTime.toString(), 0);
}

const webScene = new WebScene({
    portalItem: {
        id: webSceneId,
        portal: portalOptions
    }
});

const view = new SceneView({
    map: webScene,
    container: "viewDiv",
    ui: { components: [] } // disable the UI components
});

webScene.when(function () {
    let slides = webScene.presentation.slides;
    document.getElementById("titleDiv")!.innerHTML = webScene.portalItem.title;
    document.getElementById("slideCountDiv")!.innerHTML = startSlide + "/" + slides.length;

    view.when(function () {
        if (startSlide > 0) {
            view.goTo(slides.getItemAt(startSlide - 1).viewpoint.camera);
            document.getElementById("slideTitleDiv")!.innerHTML = slides.getItemAt(
                startSlide - 1
            ).title.text || "";
        }

        setTimeout(updateLoading, 1000);
        watchUtils.whenFalseOnce(view, "updating", function () {
            console.log("SLIDE_" + startSlide + "_" + slides.length);
            window.setTimeout(function () {
                goToSlide(startSlide);
            }, waitTime);
        });
    });
    function goToSlide(i: number) {
        if (i < slides.length) {
            document.getElementById("slideCountDiv")!.innerHTML = i + 1 + "/" + slides.length;
            let slide = slides.getItemAt(i);
            document.getElementById("slideTitleDiv")!.innerHTML = slide.title.text || "";

            slide
                .applyTo(view, {
                    duration: animationTime
                })
                .then(function () {
                    watchUtils.whenFalseOnce(view, "updating", function () {
                        console.log("SLIDE_" + (i + 1) + "_" + slides.length);
                        window.setTimeout(function () {
                            goToSlide(i + 1);
                        }, waitTime);
                    });
                });
        } else {
            console.log("STOP");
        }
    }
    function updateLoading() {
        let progressbarDiv = document.getElementById("progressbarDiv")!;
        progressbarDiv.style.width = Math.min(10 * (view.performanceInfo as any).load, 100) + "%";
        setTimeout(updateLoading, 1000);
    }
});

define(["require", "exports", "esri/views/SceneView", "esri/WebScene", "esri/core/watchUtils", "esri/config"], function (require, exports, SceneView, WebScene, watchUtils, esriConfig) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var urlParams = new URLSearchParams(document.location.search);
    var portalUrl = "https://www.arcgis.com";
    if (urlParams.has("portal")) {
        portalUrl = urlParams.get("portal") || portalUrl;
    }
    esriConfig.portalUrl = portalUrl;
    var webSceneId = "1c7a06421a314ac9b7d0fae22aa367fb";
    if (urlParams.has("webscene")) {
        webSceneId = urlParams.get("webscene") || webSceneId;
    }
    var portalOptions = {};
    if (!urlParams.has("enableSignIn")) {
        // avoid ui authentication/identification for portal or layers
        esriConfig.request.useIdentity = false; // layer
        portalOptions = { authMode: "anonymous" }; // portal
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
            id: webSceneId,
            portal: portalOptions
        }
    });
    var view = new SceneView({
        map: webScene,
        container: "viewDiv",
        ui: { components: [] } // disable the UI components
    });
    var mediaRecorder;
    var mediaRecorderStopped = false;
    webScene.when(function () {
        var slides = webScene.presentation.slides;
        document.getElementById("titleDiv").innerHTML = webScene.portalItem.title;
        document.getElementById("recordingDetailsDiv").innerHTML = "&nbsp; Recording slide " + startSlide + " of " + slides.length;
        view.when(function () {
            var canvas = document.querySelector("canvas");
            var video = document.querySelector("video");
            var videoStream = canvas.captureStream(60);
            mediaRecorder = new MediaRecorder(videoStream, { mimeType: "video/webm" });
            var data = [];
            mediaRecorder.ondataavailable = function (e) {
                data.push(e.data);
            };
            mediaRecorder.onstop = function () {
                var videoURL = URL.createObjectURL(new Blob(data, { type: "video/webm" }));
                if (video) {
                    video.src = videoURL;
                    var downloadFilename = "websceneid_" + webSceneId + ".webm";
                    document.getElementById("videoTitleDiv").innerHTML = "Webscene: " + webScene.portalItem.title;
                    document.getElementById("videoDownloadLink").href = videoURL.toString();
                    document.getElementById("videoDownloadLink").download = downloadFilename;
                    document.getElementById("videoDownloadLink").title = downloadFilename;
                }
            };
            mediaRecorder.addEventListener("error", function (event) {
                console.error("error recording stream: " + event.error.name);
            });
            mediaRecorder.ondataavailable = function (event) {
                if (event.data && event.data.size) {
                    data.push(event.data);
                }
            };
            mediaRecorder.start();
            if (startSlide > 0) {
                view.goTo(slides.getItemAt(startSlide - 1).viewpoint.camera);
                document.getElementById("titleDiv").innerHTML = webScene.portalItem.title + " - " + slides.getItemAt(startSlide - 1).title.text || "";
            }
            setTimeout(updateLoading, 1000);
            watchUtils.whenFalseOnce(view, "updating", function () {
                window.setTimeout(function () {
                    goToSlide(startSlide);
                }, waitTime);
            });
        });
        function goToSlide(i) {
            if (i < slides.length) {
                document.getElementById("recordingDetailsDiv").innerHTML = "&nbsp; Recording slide " + (i + 1) + " of " + slides.length;
                var slide = slides.getItemAt(i);
                document.getElementById("titleDiv").innerHTML = webScene.portalItem.title + " - " + slide.title.text || "";
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
                mediaRecorder.stop();
                mediaRecorderStopped = true;
                document.getElementById("recordingDiv").style.display = "none";
                document.getElementById("progressbarDiv").style.display = "none";
                document.getElementById("videoInfoDiv").style.display = "block";
            }
        }
        function updateLoading() {
            var progressbarDiv = document.getElementById("progressbarDiv");
            progressbarDiv.style.width = Math.min(10 * view.performanceInfo.load, 100) + "%";
            if (!mediaRecorderStopped) {
                setTimeout(updateLoading, 1000);
            }
        }
    });
});
//# sourceMappingURL=main.js.map
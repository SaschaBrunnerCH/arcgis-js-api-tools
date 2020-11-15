import SceneView = require("esri/views/SceneView");
import WebScene = require("esri/WebScene");
import watchUtils = require("esri/core/watchUtils");
import esriConfig = require("esri/config");
const urlParams = new URLSearchParams(document.location.search);

interface CanvasElement extends HTMLCanvasElement {
    captureStream(frameRate?: number): MediaStream;
}

let portalUrl = "https://www.arcgis.com";
if (urlParams.has("portal")) {
    portalUrl = urlParams.get("portal") || portalUrl;
}
esriConfig.portalUrl = portalUrl;

let webSceneId = "1c7a06421a314ac9b7d0fae22aa367fb";
if (urlParams.has("webscene")) {
    webSceneId = urlParams.get("webscene") || webSceneId;
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

let mediaRecorder: MediaRecorder;
let mediaRecorderStopped = false;

webScene.when(function () {
    let slides = webScene.presentation.slides;
    document.getElementById("titleDiv")!.innerHTML = webScene.portalItem.title;
    document.getElementById("recordingDetailsDiv")!.innerHTML = "&nbsp; Recording slide " + startSlide + " of " + slides.length;

    view.when(function () {
        const canvas = <CanvasElement>document.querySelector("canvas");
        const video = document.querySelector("video");
        const videoStream = canvas.captureStream(60);
        mediaRecorder = new MediaRecorder(videoStream, { mimeType: "video/webm" });
        const data: any[] = [];
        mediaRecorder.ondataavailable = function (e) {
            data.push(e.data);
        };
        mediaRecorder.onstop = () => {
            const videoURL = URL.createObjectURL(new Blob(data, { type: "video/webm" }));
            if (video) {
                video.src = videoURL;
                const downloadFilename = "websceneid_" + webSceneId + ".webm"
                document.getElementById("videoTitleDiv")!.innerHTML = "Webscene: " + webScene.portalItem.title;
                (document.getElementById("videoDownloadLink") as HTMLAnchorElement)!.href = videoURL.toString();
                (document.getElementById("videoDownloadLink") as HTMLAnchorElement)!.download = downloadFilename;
                (document.getElementById("videoDownloadLink") as HTMLAnchorElement)!.title = downloadFilename;
            }
        };
        mediaRecorder.addEventListener("error", (event) => {
            console.error(`error recording stream: ${event.error.name}`)
        });
        mediaRecorder.ondataavailable = function (event) {
            if (event.data && event.data.size) {
                data.push(event.data);
            }
        };
        mediaRecorder.start();

        if (startSlide > 0) {
            view.goTo(slides.getItemAt(startSlide - 1).viewpoint.camera);
            document.getElementById("titleDiv")!.innerHTML = webScene.portalItem.title + " - " + slides.getItemAt(
                startSlide - 1
            ).title.text || "";
        }

        setTimeout(updateLoading, 1000);
        watchUtils.whenFalseOnce(view, "updating", function () {
            window.setTimeout(function () {
                goToSlide(startSlide);
            }, waitTime);
        });
    });

    function goToSlide(i: number) {
        if (i < slides.length) {
            document.getElementById("recordingDetailsDiv")!.innerHTML = "&nbsp; Recording slide " + (i + 1) + " of " + slides.length;
            let slide = slides.getItemAt(i);
            document.getElementById("titleDiv")!.innerHTML = webScene.portalItem.title + " - " + slide.title.text || "";

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
        } else {
            mediaRecorder.stop();
            mediaRecorderStopped = true;
            document.getElementById("recordingDiv")!.style.display = "none";
            document.getElementById("progressbarDiv")!.style.display = "none";
            document.getElementById("videoInfoDiv")!.style.display = "block";
        }
    }
    function updateLoading() {
        let progressbarDiv = document.getElementById("progressbarDiv")!;
        progressbarDiv.style.width = Math.min(10 * (view.performanceInfo as any).load, 100) + "%";
        if (!mediaRecorderStopped) {
            setTimeout(updateLoading, 1000);
        }
    }
});

const canvas = document.querySelector('canvas');
const context = canvas.getContext('2d');

if (isShapeDetectionApiSupported()) {
    runShapeDetectionApiDemo();
} else {
    displayFallbackMessage();
}

function isShapeDetectionApiSupported() {
    return window.FaceDetector && window.TextDetector && window.BarcodeDetector;
}

async function runShapeDetectionApiDemo() {
    const constraints = { video: { facingMode: 'environment' } };
    const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);

    const video = document.createElement('video');
    video.srcObject = mediaStream;
    video.autoplay = true;
    video.onloadedmetadata = () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
    };

    let renderLocked = false;
    const faceDetector = new FaceDetector({ fastMode: true });
    const textDetector = new TextDetector();
    const barcodeDetector = new BarcodeDetector();

    function render() {
        if (!video.paused) {
            renderLocked = true;

            Promise.all([
                faceDetector.detect(video).catch((error) => console.error(error)),
                textDetector.detect(video).catch((error) => console.error(error)),
                barcodeDetector.detect(video).catch((error) => console.log(error))
            ]).then(([detectedFaces = [], detectedTexts = [], detectedBarcodes = []]) => {
                context.clearRect(0, 0, canvas.width, canvas.height);
                context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);

                context.strokeStyle = '#ffeb3b';
                context.fillStyle = '#ffeb3b';
                context.font = '16px Mononoki';
                context.lineWidth = 5;

                detectedFaces.forEach((detectedFace) => {
                    const { top, left, width, height } = detectedFace.boundingBox;
                    context.beginPath();
                    context.rect(left, top, width, height);
                    context.stroke();
                    context.fillText('face detected', left + 5, top - 8);

                    if (detectedFace.landmarks) {
                        detectedFace.landmarks.forEach((landmark) => {
                            context.beginPath();
                            context.arc(landmark.location.x, landmark.location.y, 5, 0, Math.PI * 2);
                            context.fill();
                            context.fillText(landmark.type, landmark.location.x + 10, landmark.location.y + 4);
                        });
                    }
                });

                context.strokeStyle = '#f44336';
                context.fillStyle = '#f44336';
                context.font = '24px Mononoki';

                detectedTexts.forEach((detectedText) => {
                    const { top, left, width, height } = detectedText.boundingBox;
                    context.beginPath();
                    context.rect(left, top, width, height);
                    context.stroke();
                    context.fillText(detectedText.rawValue, left + 5, top - 12);
                });

                context.strokeStyle = '#03A9F4';
                context.fillStyle = '#03A9F4';
                context.font = '16px Mononoki';

                detectedBarcodes.forEach((detectedBarcode) => {
                    const { top, left, width, height } = detectedBarcode.boundingBox;
                    const cornerPoints = detectedBarcode.cornerPoints;
                    if (cornerPoints && cornerPoints.length) {
                        const [{ x, y }] = cornerPoints;
                        context.beginPath();
                        context.moveTo(x, y);
                        for (let i = 1; i < cornerPoints.length; i++) {
                            context.lineTo(cornerPoints[i].x, cornerPoints[i].y);
                        }
                        context.closePath();
                    } else {
                        context.beginPath();
                        context.rect(left, top, width, height);
                    }
                    context.stroke();
                    context.fillText(detectedBarcode.rawValue, left, top + height + 16);
                });

                renderLocked = false;
            });
        }
    }

    (function renderLoop() {
        requestAnimationFrame(renderLoop);
        if (!renderLocked) {
            render();
        }
    })();
};

function displayFallbackMessage() {
    document.querySelector('.fallback-message').classList.remove('hidden');
    document.querySelector('canvas').classList.add('hidden');
    document.querySelector('.links').classList.add('hidden');
}

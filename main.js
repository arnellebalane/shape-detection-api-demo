const canvas = document.querySelector('canvas');
const context = canvas.getContext('2d');

(async () => {
    const constraints = { video: true };
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

    function render() {
        if (!video.paused) {
            renderLocked = true;

            Promise.all([
                faceDetector.detect(video)
            ]).then(([detectedFaces]) => {
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

                    detectedFace.landmarks.forEach((landmark) => {
                        context.beginPath();
                        context.arc(landmark.location.x, landmark.location.y, 5, 0, Math.PI * 2);
                        context.fill();
                        context.fillText(landmark.type, landmark.location.x + 10, landmark.location.y + 4);
                    });
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
})();

const VideoProcessor = {
    video: null,
    canvas: null,
    ctx: null,
    mediaRecorder: null,
    recordedChunks: [],
    isProcessing: false,

    init(videoElement, canvasElement) {
        this.video = videoElement;
        this.canvas = canvasElement;
        this.ctx = canvasElement.getContext('2d');
    },

    seekVideo(timeInSeconds) {
        return new Promise((resolve) => {
            const onSeeked = () => {
                this.video.removeEventListener('seeked', onSeeked);
                resolve();
            };
            this.video.addEventListener('seeked', onSeeked);
            this.video.currentTime = timeInSeconds;
        });
    },

    // ဗီဒီယို အပိုင်းအစများကို တစ်ဆက်တည်း ဆက်ပြီး Render ထုတ်ပေးခြင်း
    async renderRecapVideo(segments, options, onProgress) {
        this.isProcessing = true;
        this.recordedChunks = [];

        // Canvas Stream + Video Audio Track ပေါင်းစပ်ခြင်း
        const canvasStream = this.canvas.captureStream(30);
        try {
            const videoStream = this.video.captureStream ? this.video.captureStream() : this.video.mozCaptureStream();
            if (videoStream) {
                const audioTracks = videoStream.getAudioTracks();
                audioTracks.forEach(track => canvasStream.addTrack(track));
            }
        } catch (err) {
            console.warn("Audio stream capture fallback:", err);
        }

        const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
            ? 'video/webm;codecs=vp9'
            : 'video/webm';

        this.mediaRecorder = new MediaRecorder(canvasStream, {
            mimeType,
            videoBitsPerSecond: 2500000
        });

        this.mediaRecorder.ondataavailable = (e) => {
            if (e.data && e.data.size > 0) {
                this.recordedChunks.push(e.data);
            }
        };

        const recordingStopped = new Promise((resolve) => {
            this.mediaRecorder.onstop = () => {
                const blob = new Blob(this.recordedChunks, { type: 'video/webm' });
                resolve(blob);
            };
        });

        this.mediaRecorder.start(200);
        this.video.muted = false;
        this.video.volume = 0.25; // မူရင်းအသံကို နောက်ခံတိုးတိုးလေးထားမည်

        let totalRecapDuration = segments.reduce((acc, s) => acc + s.duration, 0);
        let accumulatedTime = 0;

        for (let i = 0; i < segments.length; i++) {
            const seg = segments[i];
            await this.seekVideo(seg.sourceStart);

            // AI Voiceover ဖတ်ခြင်း
            AIEngine.speakText(seg.text, options.enableVoice);

            await this.video.play();

            await new Promise((resolveClip) => {
                const renderFrame = () => {
                    if (!this.isProcessing) return resolveClip();

                    // Canvas ပေါ်သို့ ဗီဒီယို Frame ဆွဲခြင်း
                    this.ctx.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);

                    // အပေါ်ထောင့်တွင် RecapMM Watermark ထည့်ခြင်း
                    this.ctx.fillStyle = "rgba(239, 68, 68, 0.85)";
                    this.ctx.fillRect(16, 16, 125, 30);
                    this.ctx.fillStyle = "#ffffff";
                    this.ctx.font = "bold 15px sans-serif";
                    this.ctx.fillText("RecapMM 5-Min", 26, 36);

                    // မြန်မာစာတန်းထိုး တစ်ပါတည်း ကပ်ခြင်း
                    if (options.burnSubtitles) {
                        SubtitleManager.drawSubtitleOnCanvas(
                            this.ctx,
                            seg.text,
                            this.canvas.width,
                            this.canvas.height
                        );
                    }

                    const clipElapsed = Math.max(0, this.video.currentTime - seg.sourceStart);
                    const overallElapsed = Math.min(totalRecapDuration, accumulatedTime + clipElapsed);
                    const percent = Math.min(100, Math.round((overallElapsed / totalRecapDuration) * 100));

                    onProgress(percent, i + 1, segments.length, overallElapsed, totalRecapDuration);

                    if (this.video.currentTime >= seg.sourceEnd || this.video.ended) {
                        this.video.pause();
                        accumulatedTime += seg.duration;
                        resolveClip();
                    } else {
                        requestAnimationFrame(renderFrame);
                    }
                };

                requestAnimationFrame(renderFrame);
            });
        }

        this.mediaRecorder.stop();
        this.isProcessing = false;
        return await recordingStopped;
    }
};


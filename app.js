document.addEventListener('DOMContentLoaded', () => {
    const videoInput = document.getElementById('videoInput');
    const dropZone = document.getElementById('dropZone');
    const sourceVideo = document.getElementById('sourceVideo');
    const renderCanvas = document.getElementById('renderCanvas');
    const renderOverlay = document.getElementById('renderOverlay');
    const startAutoBtn = document.getElementById('startAutoBtn');
    const downloadVideoBtn = document.getElementById('downloadVideoBtn');
    const downloadSrtBtn = document.getElementById('downloadSrtBtn');
    const progressBar = document.getElementById('progressBar');
    const statusText = document.getElementById('statusText');
    const scriptList = document.getElementById('scriptList');

    VideoProcessor.init(sourceVideo, renderCanvas);

    // စက္ကန့်ကို မိနစ်:စက္ကန့် ပုံစံပြောင်းသည့် Helper
    function formatMinSec(sec) {
        const m = Math.floor(sec / 60);
        const s = Math.floor(sec % 60);
        return `${m}:${String(s).padStart(2, '0')}`;
    }

    function setStepStatus(stepNum, status) {
        const el = document.getElementById(`step${stepNum}`);
        if (!el) return;
        el.classList.remove('active', 'done');
        if (status) el.classList.add(status);
    }

    // ဗီဒီယိုဖိုင် ရွေးချယ်သည့်အခါ အလုပ်လုပ်မည့်အပိုင်း
    function handleVideoFile(file) {
        if (!file || !file.type.startsWith('video/')) {
            alert('ကျေးဇူးပြု၍ ဗီဒီယိုဖိုင် (.mp4, .webm, .mkv) ရွေးချယ်ပေးပါ။');
            return;
        }

        const url = URL.createObjectURL(file);
        sourceVideo.src = url;
        document.getElementById('fileName').textContent = file.name;
        document.getElementById('fileInfo').style.display = 'block';
        renderOverlay.textContent = "ဗီဒီယိုကို ဖတ်နေပါသည်...";

        sourceVideo.onloadedmetadata = () => {
            const dur = sourceVideo.duration;
            document.getElementById('fileDuration').textContent = `${formatMinSec(dur)} (${Math.round(dur)} စက္ကန့်)`;
            
            const targetSec = dur >= 320 ? 300 : Math.max(15, Math.floor(dur * 0.6));
            document.getElementById('targetDuration').textContent =
                dur >= 320
                    ? `5:00 မိနစ် (300 စက္ကန့် Auto-Cut)`
                    : `${formatMinSec(targetSec)} (ဗီဒီယိုတိုသဖြင့် 60% Auto-Cut)`;

            sourceVideo.currentTime = Math.min(2, dur / 4);
        };

        sourceVideo.onseeked = () => {
            if (!VideoProcessor.isProcessing) {
                const ctx = renderCanvas.getContext('2d');
                ctx.drawImage(sourceVideo, 0, 0, renderCanvas.width, renderCanvas.height);
                renderOverlay.style.display = 'none';
                startAutoBtn.disabled = false;
                setStepStatus(1, 'done');
                statusText.textContent = "ဗီဒီယိုအသင့်ဖြစ်ပါပြီ။ '5-Min Auto Recap' ခလုတ်ကို နှိပ်နိုင်ပါပြီ။";
            }
        };
    }

    videoInput.addEventListener('change', (e) => handleVideoFile(e.target.files[0]));

    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = '#38bdf8';
    });
    dropZone.addEventListener('dragleave', () => {
        dropZone.style.borderColor = '#334155';
    });
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = '#334155';
        handleVideoFile(e.dataTransfer.files[0]);
    });

    // Auto Recap ခလုတ်နှိပ်သည့်အခါ အဆင့်အားလုံး အလိုအလျောက် လုပ်ဆောင်ခြင်း
    startAutoBtn.addEventListener('click', async () => {
        startAutoBtn.disabled = true;
        downloadVideoBtn.classList.add('disabled');
        downloadSrtBtn.disabled = true;

        const apiKey = document.getElementById('apiKey').value;
        const tone = document.getElementById('recapTone').value;
        const burnSubtitles = document.getElementById('burnSubtitles').checked;
        const enableVoice = document.getElementById('enableVoice').checked;

        // အဆင့် ၂: AI Script & Timestamp တွက်ချက်ခြင်း
        setStepStatus(2, 'active');
        statusText.textContent = "AI မှ ၅ မိနစ်စာ အရေးကြီးအခန်းများနှင့် မြန်မာဇာတ်ညွှန်း ထုတ်နေပါသည်...";
        const plan = await AIEngine.generateRecapPlan(sourceVideo.duration, tone, apiKey);
        setStepStatus(2, 'done');

        // အဆင့် ၃: စာတန်းထိုးများ စီစဉ်ခြင်း
        setStepStatus(3, 'active');
        SubtitleManager.setSegments(plan.segments);
        scriptList.innerHTML = plan.segments.map(s => `
            <div class="script-item">
                <span>[Scene ${s.index} | မူရင်း ${formatMinSec(s.sourceStart)} - ${formatMinSec(s.sourceEnd)}]</span>
                ${s.text}
            </div>
        `).join('');
        downloadSrtBtn.disabled = false;
        setStepStatus(3, 'done');

        // အဆင့် ၄: ဗီဒီယို ဖြတ်တောက်ပေါင်းစပ်ပြီး ဖိုင်ထုတ်ခြင်း
        setStepStatus(4, 'active');
        const outputBlob = await VideoProcessor.renderRecapVideo(
            plan.segments,
            { burnSubtitles, enableVoice },
            (percent, currentScene, totalScenes, elapsed, total) => {
                progressBar.style.width = `${percent}%`;
                statusText.textContent = `အခန်း (${currentScene}/${totalScenes}) ဖြတ်တောက်ဆက်စပ်နေသည်... ${percent}% (${formatMinSec(elapsed)} / ${formatMinSec(total)})`;
            }
        );

        setStepStatus(4, 'done');
        const videoUrl = URL.createObjectURL(outputBlob);
        downloadVideoBtn.href = videoUrl;
        downloadVideoBtn.classList.remove('disabled');
        startAutoBtn.disabled = false;
        statusText.textContent = "✅ ၅ မိနစ်စာ Recap ဗီဒီယို ထုတ်လုပ်ပြီးပါပြီ! အောက်ပါခလုတ်မှ ဒေါင်းလုဒ်ဆွဲနိုင်ပါပြီ။";
    });

    downloadSrtBtn.addEventListener('click', () => {
        SubtitleManager.downloadSRT();
    });
});


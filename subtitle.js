const SubtitleManager = {
    segments: [],

    setSegments(segments) {
        this.segments = segments;
    },

    // လက်ရှိ Recap အချိန်နဲ့ ကိုက်ညီတဲ့ စာတန်းကို ရှာပေးခြင်း
    getCurrentSubtitle(recapElapsedSeconds) {
        return this.segments.find(
            seg => recapElapsedSeconds >= seg.recapStart && recapElapsedSeconds <= seg.recapEnd
        );
    },

    // Video Canvas ပေါ်တွင် မြန်မာစာတန်းထိုးကို အလိုအလျောက် လိုင်းခွဲပြီး ရေးဆွဲခြင်း
    drawSubtitleOnCanvas(ctx, text, canvasWidth, canvasHeight) {
        if (!text) return;

        ctx.save();
        ctx.font = "bold 22px 'Padauk', 'Pyidaungsu', sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "bottom";

        const maxWidth = canvasWidth * 0.85;
        const words = text.split(' ');
        let lines = [];
        let currentLine = words[0] || '';

        for (let i = 1; i < words.length; i++) {
            const testLine = currentLine + " " + words[i];
            if (ctx.measureText(testLine).width < maxWidth) {
                currentLine = testLine;
            } else {
                lines.push(currentLine);
                currentLine = words[i];
            }
        }
        lines.push(currentLine);

        const lineHeight = 32;
        const bottomMargin = 28;
        const boxPadding = 10;

        // နောက်ခံ အမည်းရောင် အကြည်ပြား (Subtitle Box)
        const totalHeight = lines.length * lineHeight;
        const boxY = canvasHeight - bottomMargin - totalHeight - boxPadding;

        ctx.fillStyle = "rgba(0, 0, 0, 0.72)";
        ctx.fillRect(canvasWidth * 0.075, boxY, canvasWidth * 0.85, totalHeight + boxPadding * 1.5);

        // စာသား ရေးဆွဲခြင်း (အဝါရောင် Movie Recap စတိုင်)
        lines.forEach((line, index) => {
            const y = canvasHeight - bottomMargin - (lines.length - 1 - index) * lineHeight;
            ctx.strokeStyle = "#000000";
            ctx.lineWidth = 4;
            ctx.strokeText(line, canvasWidth / 2, y);

            ctx.fillStyle = "#fde047";
            ctx.fillText(line, canvasWidth / 2, y);
        });

        ctx.restore();
    },

    // စက္ကန့်ကို SRT Format (00:00:00,000) သို့ ပြောင်းလဲခြင်း
    formatSRTTime(seconds) {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        const ms = Math.floor((seconds % 1) * 1000);
        return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
    },

    // .SRT ဖိုင်အဖြစ် ထုတ်ပေးခြင်း
    generateSRT() {
        return this.segments.map((seg, idx) => {
            return `${idx + 1}\n${this.formatSRTTime(seg.recapStart)} --> ${this.formatSRTTime(seg.recapEnd)}\n${seg.text}\n`;
        }).join('\n');
    },

    downloadSRT(filename = "RecapMM_5Min_Subtitles.srt") {
        const srtContent = this.generateSRT();
        const blob = new Blob([srtContent], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    }
};


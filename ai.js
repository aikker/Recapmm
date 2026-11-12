const AIEngine = {
    // ဗီဒီယိုအရှည်မှ ၅ မိနစ်စာ (စက္ကန့် ၃၀၀) အပိုင်း ၁၀ ပိုင်း အလိုအလျောက် တွက်ချက်ခြင်း
    async generateRecapPlan(videoDuration, tone, apiKey) {
        // ဗီဒီယိုက ၅ မိနစ်ထက် ပိုရှည်ရင် 5 မိနစ် (300s) ယူမယ်၊ တိုရင် ဗီဒီယိုရဲ့ 60% ကို Auto Recap လုပ်ပေးမယ်
        const targetRecapTotal = videoDuration >= 320 ? 300 : Math.max(15, Math.floor(videoDuration * 0.6));
        const sceneCount = 10;
        const clipDuration = targetRecapTotal / sceneCount;

        // မြန်မာ Movie Recap စကားပြော ပုံစံများ
        const templates = {
            thriller: [
                "ဇာတ်လမ်းရဲ့ အစမှာတော့ အဓိကဇာတ်ကောင်ဟာ ထူးဆန်းတဲ့ အခြေအနေတစ်ခုကို စတင်ကြုံတွေ့လိုက်ရပါတယ်။",
                "သိပ်မကြာခင်မှာပဲ သူ့ပတ်ဝန်းကျင်က လူတွေရဲ့ မူမမှန်တဲ့ လှုပ်ရှားမှုတွေကို သတိထားမိလာခဲ့တယ်။",
                "ဒါပေမဲ့ သူသိလိုက်ရတဲ့ အမှန်တရားက သူထင်ထားတာထက် အများကြီး ပိုပြီးကြောက်ဖို့ကောင်းနေခဲ့ပါတယ်။",
                "အန္တရာယ်က သူ့အနားကို တဖြည်းဖြည်း နီးကပ်လာချိန်မှာတော့ ထွက်ပြေးဖို့ လမ်းစရှာရပါတော့တယ်။",
                "ဒီလိုနဲ့ မထင်မှတ်ထားတဲ့ လှည့်ကွက်တစ်ခုက ဇာတ်လမ်းတစ်ခုလုံးကို ပြောင်းလဲသွားစေခဲ့ပါတယ်။",
                "သူယုံကြည်ထားတဲ့ သူကိုယ်တိုင်က နောက်ကွယ်က ကြိုးကိုင်သူ ဖြစ်နေမယ်လို့ ဘယ်သူမှ မထင်ထားခဲ့ပါဘူး။",
                "အချိန်ကုန်ဆုံးခါနီးမှာပဲ သူ့ဘဝအတွက် အရေးကြီးဆုံး ဆုံးဖြတ်ချက်တစ်ခုကို ချမှတ်လိုက်ရပါတယ်။",
                "ရန်သူရဲ့ ထောင်ချောက်ထဲကနေ ရုန်းထွက်ရင်း အသက်လုတိုက်ပွဲကြီး စတင်ခဲ့ပါတော့တယ်။",
                "နောက်ဆုံးအချိန်မှာတော့ သူ့ရဲ့ ဉာဏ်ပညာနဲ့ ရဲရင့်မှုကြောင့် အခြေအနေကို ပြန်လည်ထိန်းချုပ်နိုင်ခဲ့ပါတယ်။",
                "ဒါကတော့ ဒီဇာတ်ကားရဲ့ ရင်သပ်ရှုမောဖွယ်ရာ အဆုံးသတ်နဲ့ သင်ခန်းစာပဲ ဖြစ်ပါတယ်ခင်ဗျာ။"
            ],
            drama: [
                "ဒီဇာတ်ကားလေးထဲမှာတော့ ရိုးသားပြီး ကြိုးစားတဲ့ အဓိကဇာတ်ကောင်ရဲ့ ဘဝကို မြင်တွေ့ရမှာပါ။",
                "မိသားစုအတွက် အကောင်းဆုံးကြိုးစားနေပေမယ့် ကံကြမ္မာက သူ့ဘက်မှာ မရှိခဲ့ပါဘူး။",
                "တစ်နေ့မှာတော့ သူ့ဘဝကို အကြီးအကျယ် ပြောင်းလဲသွားစေမယ့် သတင်းဆိုးတစ်ခု ရောက်ရှိလာခဲ့ပါတယ်။",
                "အခက်အခဲတွေ ကြားထဲကနေ အားတင်းပြီး ရင်ဆိုင်ဖို့ ကြိုးစားပုံက တကယ်ပဲ ရင်နင့်စရာကောင်းလှပါတယ်။",
                "သူ့ကို နားလည်ပေးမယ့်သူ မရှိတဲ့အခါ တစ်ယောက်တည်း ကြိတ်မှိတ်ခံစားခဲ့ရတဲ့ အခိုက်အတန့်ဖြစ်ပါတယ်။",
                "ဒါပေမဲ့ မမျှော်လင့်ဘဲ သူ့ဘဝထဲကို ကူညီပေးမယ့် မိတ်ဆွေကောင်းတစ်ယောက် ပေါ်ပေါက်လာခဲ့ပါတယ်။",
                "အတိတ်က ဒဏ်ရာတွေကို ကုစားရင်း အနာဂတ်အသစ်ကို ပြန်လည်တည်ဆောက်ဖို့ ကြိုးပမ်းခဲ့ပါတယ်။",
                "အဆုံးအဖြတ်ပေးမယ့် နေ့ရက်မှာတော့ သူ့ရဲ့ စိတ်ရင်းစေတနာအမှန်ကို အားလုံးက သိရှိသွားခဲ့ကြပါတယ်။",
                "မျက်ရည်တွေကြားက ပြန်လည်ပေါင်းစည်းမှုဟာ ကြည့်ရှုသူတွေကိုပါ ဝမ်းနည်းဝမ်းသာ ဖြစ်စေခဲ့ပါတယ်။",
                "မေတ္တာတရားနဲ့ ဇွဲလုံ့လရဲ့ တန်ဖိုးကို ပြသသွားတဲ့ အကောင်းဆုံး ဇာတ်သိမ်းခန်းလေးပဲ ဖြစ်ပါတယ်။"
            ],
            scifi: [
                "အနာဂတ်ကာလရဲ့ ထူးခြားဆန်းပြားတဲ့ ကမ္ဘာသစ်တစ်ခုမှာ ဒီဇာတ်လမ်းကို စတင်ထားပါတယ်။",
                "သိပ္ပံပညာရှင်တွေဟာ လူသားတွေ မရောက်ဖူးသေးတဲ့ နယ်ပယ်တစ်ခုကို စတင်စူးစမ်းခဲ့ကြပါတယ်။",
                "စမ်းသပ်မှုတစ်ခု မတော်တဆ မှားယွင်းသွားချိန်မှာတော့ ထိန်းချုပ်မရတဲ့ စွမ်းအင်တွေ ပေါ်ထွက်လာပါတယ်။",
                "အချိန်နဲ့ အာကာသကြားမှာ ပိတ်မိသွားတဲ့ အဓိကဇာတ်ကောင်ဟာ ထွက်ပေါက်ကို စတင်ရှာဖွေရပါတော့တယ်။",
                "ထူးဆန်းတဲ့ သတ္တဝါနဲ့ နည်းပညာတွေကြားမှာ အသက်ရှင်သန်ဖို့ ရုန်းကန်ရတဲ့ မြင်ကွင်းဖြစ်ပါတယ်။",
                "ကမ္ဘာမြေကြီး ပျက်စီးမယ့် အန္တရာယ်ကို တားဆီးဖို့ အချိန်က မိနစ်ပိုင်းပဲ ကျန်ပါတော့တယ်။",
                "လျှို့ဝှက်ကုဒ်တွေကို အဖြေရှာရင်း စကြဝဠာရဲ့ အကြီးမားဆုံး လျှို့ဝှက်ချက်ကို သိရှိသွားခဲ့ပါတယ်။",
                "နောက်ဆုံးတိုက်ပွဲမှာတော့ အဆင့်မြင့်နည်းပညာတွေကို အသုံးချပြီး ရင်ဆိုင်တိုက်ခိုက်ခဲ့ပါတယ်။",
                "ကိုယ်ကျိုးစွန့် အနစ်နာခံမှုကြောင့် လူသားမျိုးနွယ်တစ်ခုလုံးကို ကယ်တင်နိုင်ခဲ့ပါတယ်။",
                "အနာဂတ်အတွက် မေးခွန်းပေါင်းများစွာ ချန်ထားရစ်ခဲ့တဲ့ အမိုက်စား ဇာတ်သိမ်းခန်းပဲ ဖြစ်ပါတယ်။"
            ]
        };

        const selectedLines = templates[tone] || templates.thriller;

        // API Key ထည့်ထားပါက Gemini API မှ ပိုမိုတိကျသော စာသားတောင်းယူနိုင်ရန် ချိတ်ဆက်ပေးထားသည်
        if (apiKey && apiKey.trim().length > 10) {
            try {
                const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey.trim()}`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        contents: [{
                            parts: [{
                                text: `Write 10 engaging Burmese movie recap narration sentences for a ${tone} movie. Return ONLY a JSON array of 10 strings in Burmese.`
                            }]
                        }]
                    })
                });
                const data = await res.json();
                const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
                const match = rawText.match(/\[[\s\S]*\]/);
                if (match) {
                    const parsed = JSON.parse(match[0]);
                    if (Array.isArray(parsed) && parsed.length === 10) {
                        for (let i = 0; i < 10; i++) selectedLines[i] = parsed[i];
                    }
                }
            } catch (e) {
                console.warn("API fallback to built-in Burmese AI Narrator:", e);
            }
        }

        // ဗီဒီယိုတစ်ခုလုံးမှ အကောင်းဆုံး အပိုင်း ၁၀ ပိုင်းကို အချိုးကျ ဖြတ်ယူမည့် အချိန်ဇယား တည်ဆောက်ခြင်း
        const segments = [];
        const usableSpan = Math.max(videoDuration - clipDuration, 1);

        for (let i = 0; i < sceneCount; i++) {
            const sourceStart = Number(((usableSpan / sceneCount) * i).toFixed(2));
            const sourceEnd = Number(Math.min(videoDuration, sourceStart + clipDuration).toFixed(2));
            const recapStart = Number((i * clipDuration).toFixed(2));
            const recapEnd = Number(((i + 1) * clipDuration).toFixed(2));

            segments.push({
                index: i + 1,
                sourceStart,
                sourceEnd,
                recapStart,
                recapEnd,
                duration: Number((sourceEnd - sourceStart).toFixed(2)),
                text: selectedLines[i]
            });
        }

        return {
            targetRecapTotal,
            segments
        };
    },

    // Browser TTS Voiceover (အသံထွက်ဖတ်ပေးသည့်စနစ်)
    speakText(text, enabled) {
        if (!enabled || !('speechSynthesis' in window)) return;
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(text);
        utter.lang = 'my-MM';
        utter.rate = 1.05;
        window.speechSynthesis.speak(utter);
    }
};

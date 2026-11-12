
const WORKER_URL = "https://recapmmai.aike-sai-09.workers.dev/";

const fileInput = document.getElementById("videoFile");
const preview = document.getElementById("preview");
const analyzeBtn = document.getElementById("analyzeBtn");
const aiResult = document.getElementById("aiResult");

analyzeBtn.addEventListener("click", async () => {

  const file = fileInput.files[0];

  if (!file) {
    aiResult.textContent = "Please upload a video first.";
    return;
  }

  // Phase 2 prototype limits
  if (file.size > 15 * 1024 * 1024) {
    aiResult.textContent =
      "Test version supports videos up to 15 MB.";
    return;
  }

  if (!Number.isFinite(preview.duration) ||
      preview.duration > 60) {
    aiResult.textContent =
      "For this first test, use a video up to 60 seconds.";
    return;
  }

  analyzeBtn.disabled = true;
  analyzeBtn.textContent = "AI Analyzing...";

  aiResult.textContent =
    "Uploading video to AI... Please wait.";

  try {

    const dataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(
        new Error("Cannot read video")
      );

      reader.readAsDataURL(file);
    });

    const base64 = dataUrl.split(",")[1];

    aiResult.textContent =
      "Gemini is analyzing your video...";

    const response = await fetch(WORKER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        videoBase64: base64,
        mimeType: file.type
      })
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "AI request failed");
    }

    let raw = result.text.trim();

    raw = raw
      .replace(/^```json\s*/i, "")
      .replace(/\s*```$/, "");

    const recap = JSON.parse(raw);

    aiResult.textContent =
      "🎬 TITLE\n" + recap.title +
      "\n\n📖 SUMMARY\n" + recap.summary +
      "\n\n🎙️ MYANMAR SCRIPT\n" + recap.script +
      "\n\n✂️ SELECTED SCENES\n" +
      recap.scenes.map(scene =>
        `${scene.start}s - ${scene.end}s : ${scene.reason}`
      ).join("\n");

  } catch (error) {

    aiResult.textContent =
      "Error: " + error.message;

  } finally {

    analyzeBtn.disabled = false;
    analyzeBtn.textContent = "Generate AI Recap";

  }

});


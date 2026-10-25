import { readChatFile } from "./import.js";
import { parseChat } from "./analysis.js";
self.onmessage = async ({ data }) => {
  try {
    let result = { text: data.text };
    if (data.file) {
      self.postMessage({ stage: "Opening export…" });
      result = await readChatFile(data.file);
    }
    self.postMessage({ stage: "Reading messages…" });
    self.postMessage({ result: { ...result, parsed: parseChat(result.text, data.order) } });
  } catch (error) {
    self.postMessage({ error: error.message || "This export could not be read." });
  }
};

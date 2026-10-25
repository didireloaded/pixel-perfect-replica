export function processImport(input, { signal, onStage = () => {} } = {}) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException("Import cancelled.", "AbortError"));
      return;
    }
    let worker;
    try {
      worker = new Worker(new URL("./import.worker.js", import.meta.url), { type: "module" });
    } catch {
      reject(
        new Error(
          "This browser could not start the import. Try a current Safari, Chrome or Firefox browser.",
        ),
      );
      return;
    }
    const finish = (error, result) => {
      clearTimeout(timer);
      signal?.removeEventListener("abort", cancel);
      worker.terminate();
      error ? reject(error) : resolve(result);
    };
    const cancel = () => finish(new DOMException("Import cancelled.", "AbortError"));
    const timer = setTimeout(
      () =>
        finish(
          new Error("This import took too long. Export without media, or try a smaller text file."),
        ),
      30000,
    );
    signal?.addEventListener("abort", cancel, { once: true });
    worker.onmessage = ({ data }) => {
      if (data.stage) onStage(data.stage);
      else if (data.error) finish(new Error(data.error));
      else finish(null, data.result);
    };
    worker.onerror = () =>
      finish(
        new Error("The export could not be processed. Try exporting the chat again without media."),
      );
    worker.postMessage(input);
  });
}

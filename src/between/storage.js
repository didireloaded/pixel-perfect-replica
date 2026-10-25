const DB = "between-v1";
const STORE = "conversations";
let dbPromise;
function database() {
  if (!dbPromise)
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB, 1);
      request.onupgradeneeded = () => request.result.createObjectStore(STORE, { keyPath: "id" });
      request.onsuccess = () => {
        request.result.onversionchange = () => {
          request.result.close();
          dbPromise = null;
        };
        resolve(request.result);
      };
      request.onerror = () => {
        dbPromise = null;
        reject(new Error("Device storage is unavailable. You can keep using a temporary session."));
      };
      request.onblocked = () => {
        dbPromise = null;
        reject(new Error("Close other Between tabs to update device storage."));
      };
    });
  return dbPromise;
}
export async function listSaved() {
  const db = await database();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const q = tx.objectStore(STORE).getAll();
    q.onsuccess = () => resolve(q.result);
    q.onerror = () => reject(q.error);
  });
}
export async function putSaved(conversation, expected = null) {
  const db = await database();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    const store = tx.objectStore(STORE);
    let problem;
    const q = store.get(conversation.id);
    q.onsuccess = () => {
      if (expected !== null && q.result?.revision !== expected) {
        problem = new Error("This conversation changed in another tab. Reload before saving.");
        tx.abort();
        return;
      }
      store.put(conversation);
    };
    tx.oncomplete = () => resolve();
    tx.onerror = tx.onabort = () =>
      reject(problem || new Error("Could not save the conversation. Device storage may be full."));
  });
}
export async function deleteSaved(id, expected = null) {
  const db = await database();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    let problem;
    const store = tx.objectStore(STORE);
    const q = store.get(id);
    q.onsuccess = () => {
      if (expected !== null && q.result?.revision !== expected) {
        problem = new Error("This conversation changed in another tab. Reload before deleting.");
        tx.abort();
        return;
      }
      store.delete(id);
    };
    tx.oncomplete = () => resolve();
    tx.onerror = tx.onabort = () =>
      reject(problem || new Error("Could not remove the saved conversation."));
  });
}
export async function clearSaved() {
  const db = await database();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).clear();
    tx.oncomplete = () => resolve();
    tx.onerror = tx.onabort = () =>
      reject(new Error("Saved chats could not be cleared. Try again before leaving this browser."));
  });
}

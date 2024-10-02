// src/lib/reloadChannel.js
export const createReloadChannel = () => {
  if (typeof window !== "undefined") {
    const channel = new BroadcastChannel("reload-channel");
    console.log("Reload channel created");
    return channel;
  }
  console.log("Reload channel not created (not in browser environment)");
  return null;
};

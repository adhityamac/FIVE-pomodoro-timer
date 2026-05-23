let intervalId: any = null;
let endTime = 0;

self.onmessage = (e: MessageEvent) => {
  const { action, timeLeft } = e.data;

  if (action === 'start') {
    if (intervalId) {
      clearInterval(intervalId);
    }

    endTime = Date.now() + timeLeft * 1000;

    intervalId = self.setInterval(() => {
      const remaining = Math.max(0, Math.round((endTime - Date.now()) / 1000));
      self.postMessage({ action: 'tick', timeLeft: remaining });

      if (remaining === 0) {
        if (intervalId) {
          clearInterval(intervalId);
          intervalId = null;
        }
      }
    }, 200);
  } else if (action === 'pause' || action === 'stop') {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
    if (action === 'stop') {
      endTime = 0;
    }
  }
};

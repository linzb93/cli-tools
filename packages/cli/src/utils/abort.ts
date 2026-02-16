const controller = new AbortController();
const { signal } = controller;

signal.addEventListener('abort', () => {
    console.log('abort');
});
controller.abort();
signal.aborted; // true

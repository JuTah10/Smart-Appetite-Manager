export function typeIntoChat(setInput, text, charDelay = 10) {
  setInput("");
  let i = 0;
  const interval = setInterval(() => {
    i++;
    setInput(text.slice(0, i));
    if (i >= text.length) clearInterval(interval);
  }, charDelay);
  return () => clearInterval(interval);
}

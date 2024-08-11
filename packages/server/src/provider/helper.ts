import clipboardy from "clipboardy";

export const copy = (text: string) => {
  clipboardy.writeSync(text);
};

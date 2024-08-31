import clipboardy from "clipboardy";
import notifier from "node-notifier";
export const isWin = process.platform !== "darwin";
import logger from "./logger";

export const copy = (text: string) => {
  clipboardy.writeSync(text);
};
export const readCopy = () => {
  return clipboardy.readSync();
};
export const notify = (content: string) => {
  notifier.notify({
    title: "店客多通知",
    message: content,
  });
};

interface HelpDocOptions {
  title: string;
  content: string;
}

export const generateHelpDoc = (options: HelpDocOptions) => {
  logger.box({
    title: `${options.title}命令帮助文档`,
    borderColor: "green",
    padding: 1,
    content: options.content,
  });
};

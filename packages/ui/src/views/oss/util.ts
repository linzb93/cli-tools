interface IFile {
  size: string;
}
export const getSize = (file: IFile) => {
  const { size } = file;
  const units = ["B", "KB", "MB", "GB"];
  let calcSize = Number(size);
  let index = 0;
  while (calcSize >= 1024) {
    index++;
    calcSize = calcSize / 1024;
  }
  return `${calcSize.toFixed(2)}${units[index]}`;
};

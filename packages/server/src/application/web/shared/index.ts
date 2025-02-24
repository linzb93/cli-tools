import { join, basename } from "node:path";
import { tempPath } from "@/common/constant";

export function changeTempUrlToPath(url: string) {
  return join(tempPath, basename(url));
}

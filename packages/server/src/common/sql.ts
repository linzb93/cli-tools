import { join } from "node:path";
import { Low, JSONFile } from "lowdb";
import { cacheRoot } from "./constant";
import { Database } from "../typings/api";

export default async function sql<T>(
  callback: (data: Database) => T
): Promise<T> {
  const dbPath = join(cacheRoot, "app.json");
  const db = new Low(new JSONFile(dbPath));
  await db.read();
  const data = db.data as unknown as Database;
  let result: any;
  if (typeof callback === "function") {
    result = await callback(data);
  }
  await db.write();
  return result;
}

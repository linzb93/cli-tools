import fs from 'fs-extra';
import readPkg from 'read-pkg';
const shouldUseYarn = () => {
  try {
    fs.accessSync('yarn.lock');
  } catch {
    return false;
  }
  return true;
};

export function getVersion(packageName: string): string {
  const match = packageName.match(/@([0-9a-z\.\-]+)@/);
  // @ts-ignore
  return match ? match[1] : '';
}

export default async (name: string) => {
  const dirs = await fs.readdir('node_modules');
  try {
    await import(name);
  } catch (error) {
    return {
      list: [],
      versionList: []
    };
  }
  if (shouldUseYarn()) {
    return {
      list: [name],
      versionList: [
        (
          await readPkg({
            cwd: `node_modules/${name}`
          })
        ).version
      ]
    };
  }
  const matches = dirs.filter((dir) =>
    dir.startsWith(`_${name.startsWith('@') ? name.replace('/', '_') : name}@`)
  );
  if (!matches.length) {
    return {
      list: [name],
      versionList: [
        (
          await readPkg({
            cwd: `node_modules/${name}`
          })
        ).version
      ]
    };
  }
  return {
    list: matches,
    versionList: matches.map((item) => getVersion(item))
  };
};

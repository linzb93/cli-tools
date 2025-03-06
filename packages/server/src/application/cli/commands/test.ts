import { execaCommand as execa } from 'execa';

export default async () => {
    const { stdout } = await execa(`git log origin/dev-chain-2.5.6..dev-chain-2.5.6`, { shell: true });
    console.log(`output:${stdout}`);
};

import Fork from '@/core/fork';

export const forkCommand = (filename: string) => {
    new Fork().main(filename);
};

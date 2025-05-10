import Fork from '@/core/fork';

export default (filename: string) => {
    new Fork().main(filename);
};

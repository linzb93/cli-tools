import BaseCommand from "@/util/BaseCommand";

interface IOptions {
    delete: boolean;
    remote: boolean;
}

class Branch extends BaseCommand {
    constructor(private options: IOptions) {
        super();
    }
    async run() {
        const { options } = this;

    }
}

export default (options: IOptions) => {
    new Branch(options).run();
};

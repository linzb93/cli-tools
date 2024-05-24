import analyse from "./analyse";

export default function(subCommand: string) {
    if (subCommand === 'analyse') {
        analyse();
    }
}
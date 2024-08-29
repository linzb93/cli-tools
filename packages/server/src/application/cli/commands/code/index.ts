import analyse from "./analyse";

export default function(subCommand: string, rest:string[]) {
    if (subCommand === 'analyse') {
        analyse(rest);
    }
}
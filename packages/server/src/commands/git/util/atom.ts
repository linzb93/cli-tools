import { CommandItem } from "@/util/promiseFn";
interface GitAtomMap {
    [key:string]: (...params:any[]) => string | CommandItem
}
const gitAtom:GitAtomMap = {
    commit(message: string) {
        const msg = message ? `feat:${message}` : `feat:update`;
        return `git commit -m ${msg}`
    },
    push() {
        return {
            message: 'git push',
            onError: () => {}
        }
    }
}
export default gitAtom;
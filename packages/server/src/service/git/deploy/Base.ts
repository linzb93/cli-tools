export default abstract class Base {
    abstract condition(remoteUrl: string): boolean;
    abstract main(): Promise<void>;
}

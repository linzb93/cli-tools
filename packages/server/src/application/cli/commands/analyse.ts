import Code from "@/service/analyse/code";
import Cli from '@/service/analyse/cli';
export default function (prefix: string) {
  if (prefix === 'cli') {
    new Cli().main();
    return;
  }
  new Code().main();
}

import { render } from 'ink';
import { App } from '../ui/App';
export default async (opt: any) => {
    render(<App name={opt.name} />);
};

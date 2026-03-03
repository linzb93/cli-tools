import { useState } from 'react';
import { Text, Box, useApp } from 'ink';

type Props = {
    name: string | undefined;
};

export function App({ name = 'Stranger' }: Props) {
    const [counter, setCounter] = useState(0);
    const { exit } = useApp();
    setTimeout(() => {
        setCounter(20);
    }, 2000);
    setTimeout(() => {
        exit();
    }, 3000);
    return (
        <Box height={6} flexDirection="column">
            <Box height="50%">
                <Text>Conter: {counter}</Text>
            </Box>
            <Text>{name}</Text>
        </Box>
    );
}

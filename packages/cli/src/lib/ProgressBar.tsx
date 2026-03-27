import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { Text } from 'ink';

interface BarProps {
    columns?: number;
    percent?: number;
    left?: number;
    right?: number;
    character?: string;
    rightPad?: boolean;
    [key: string]: unknown;
}

function Bar({ columns = 0, percent = 1, left = 0, right = 0, character = '█', rightPad = false, ...rest }: BarProps) {
    const content = useMemo(() => {
        const screen = columns || process.stdout.columns || 80;
        const space = screen - right - left;
        const max = Math.min(Math.floor(space * percent), space);
        const chars = character.repeat(max);
        return rightPad ? chars + ' '.repeat(space - max) : chars;
    }, [columns, left, percent, right, character, rightPad]);

    return <Text {...rest}>{content}</Text>;
}

Bar.propTypes = {
    columns: PropTypes.number,
    percent: PropTypes.number,
    left: PropTypes.number,
    right: PropTypes.number,
    character: PropTypes.string,
    rightPad: PropTypes.bool,
};

export default Bar;

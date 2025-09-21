/**
 * HorizontalSelector.test.js
 *
 * What This Test File Covers:
 *
 * 1. Renders items
 *    - Ensures all labels from `data` are visible and optional icon renderer is used.
 *
 * 2. Selection styles (text only)
 *    - Selected item text uses theme.buttonPrimaryText & fontWeight '600'.
 *    - Unselected item text uses theme.text & fontWeight '500'.
 *
 * 3. onSelect callback
 *    - Pressing a label calls `onSelect` with the correct item.
 *
 * 4. Snapshot
 *    - Captures stable output for regression checks.
 *
 * Notes:
 * - No component changes (no testIDs). Queries rely on visible text.
 */

import React from 'react';
import { Text } from 'react-native'; // ✅ needed for renderIcon
import { render, fireEvent } from '@testing-library/react-native';
import HorizontalSelector from 'src/components/HorizontalSelector';

const theme = {
  primary: '#0044ff',
  surface: '#eeeeee',
  border: '#cccccc',
  text: '#111111',
  buttonPrimaryText: '#ffffff',
};

const data = [
  { id: 1, label: 'One' },
  { id: 2, label: 'Two' },
  { id: 3, label: 'Three' },
];

describe('HorizontalSelector', () => {
  it('renders all items and optional icons', () => {
    const { getByText } = render(
      <HorizontalSelector
        data={data}
        selected={data[2]}
        onSelect={() => {}}
        theme={theme}
        itemKey={(it) => it.id}
        renderIcon={(it, isSelected) => <Text>{isSelected ? '★' : '☆'}</Text>}
      />
    );

    expect(getByText('One')).toBeTruthy();
    expect(getByText('Two')).toBeTruthy();
    expect(getByText('Three')).toBeTruthy();
    expect(getByText('★')).toBeTruthy(); // selected icon
  });

  it('applies text color and fontWeight based on selection', () => {
    const { getByText } = render(
      <HorizontalSelector
        data={data}
        selected={data[1]} // "Two" selected
        onSelect={() => {}}
        theme={theme}
        itemKey={(it) => it.id}
      />
    );

    const selectedText = getByText('Two');
    const unselectedText = getByText('One');

    expect(selectedText.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ color: theme.buttonPrimaryText }),
        expect.objectContaining({ fontWeight: '600' }),
      ])
    );

    expect(unselectedText.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ color: theme.text }),
        expect.objectContaining({ fontWeight: '500' }),
      ])
    );
  });

  it('calls onSelect with the pressed item', () => {
    const onSelect = jest.fn();
    const { getByText } = render(
      <HorizontalSelector
        data={data}
        selected={data[0]}
        onSelect={onSelect}
        theme={theme}
        itemKey={(it) => it.id}
      />
    );

    fireEvent.press(getByText('Three'));
    expect(onSelect).toHaveBeenCalledWith(data[2]);
  });

  it('matches snapshot', () => {
    const tree = render(
      <HorizontalSelector
        data={data}
        selected={data[0]}
        onSelect={() => {}}
        theme={theme}
        itemKey={(it) => it.id}
      />
    ).toJSON();
    expect(tree).toMatchSnapshot();
  });
});
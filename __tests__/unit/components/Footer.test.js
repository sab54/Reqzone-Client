/**
 * Footer.test.js
 *
 * What This Test File Covers:
 *
 * 1. Renders Footer text
 *    - Confirms that "Designed with ❤️ by Su" appears in the output.
 *
 * 2. Applies theme colors (without relying on testID or fragile parent traversal)
 *    - Asserts the Text color comes from the provided theme via query.
 *    - Asserts the root View backgroundColor comes from the theme via toJSON().
 *
 * 3. Snapshot
 *    - Captures stable render output for regression testing.
 *
 * Notes:
 * - Uses @testing-library/react-native for render and queries.
 * - Does NOT require any changes to the Footer component.
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import Footer from 'src/components/Footer';

const mockTheme = {
  footerBackground: '#123456',
  text: '#abcdef',
};

describe('Footer', () => {
  it('renders the footer text correctly', () => {
    const { getByText } = render(<Footer theme={mockTheme} />);
    expect(getByText('Designed with ❤️ by Su')).toBeTruthy();
  });

  it('applies theme background and text colors (robust root inspection)', () => {
    const { getByText, toJSON } = render(<Footer theme={mockTheme} />);

    // Assert Text color using query result (handles style arrays)
    const textNode = getByText('Designed with ❤️ by Su');
    expect(textNode.props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ color: mockTheme.text })])
    );

    // Assert container background using the rendered JSON tree (root is the View)
    const root = toJSON(); // ReactTestRendererJSON | ReactTestRendererJSON[] | null
    expect(root).toBeTruthy();

    // Handle potential array (shouldn't be for this component, but keep it safe)
    const rootNode = Array.isArray(root) ? root[0] : root;
    expect(rootNode.type).toBe('View');

    const containerStyle = rootNode.props.style;
    if (Array.isArray(containerStyle)) {
      expect(containerStyle).toEqual(
        expect.arrayContaining([expect.objectContaining({ backgroundColor: mockTheme.footerBackground })])
      );
    } else {
      expect(containerStyle).toEqual(
        expect.objectContaining({ backgroundColor: mockTheme.footerBackground })
      );
    }
  });

  it('matches snapshot', () => {
    const tree = render(<Footer theme={mockTheme} />).toJSON();
    expect(tree).toMatchSnapshot();
  });
});

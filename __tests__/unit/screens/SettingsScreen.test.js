// __tests__/unit/screens/SettingsScreen.test.js
/**
 * SettingsScreen.test.js
 *
 * What This Test File Covers:
 *
 * 1) Initial Load
 *    - Reads AsyncStorage keys on mount and populates state.
 *
 * 2) Form Input
 *    - Updates contactName, contactNumber, and countryCode fields as user types.
 *
 * 3) Default Emergency Number
 *    - Displays the correct number based on countryCode (with fallback).
 *
 * 4) Save Action
 *    - Persists values to AsyncStorage and calls Alert.alert.
 */

import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import SettingsScreen from '../../../src/screens/SettingsScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

jest.spyOn(Alert, 'alert').mockImplementation(() => {});

const theme = {
  background: '#fff',
  title: '#000',
  text: '#111',
};

describe('SettingsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('loads saved settings from AsyncStorage on mount', async () => {
    AsyncStorage.getItem
      .mockResolvedValueOnce('Jane Doe') // contactName
      .mockResolvedValueOnce('+123456789') // contactNumber
      .mockResolvedValueOnce('UK'); // countryCode

    const { findByDisplayValue } = render(<SettingsScreen theme={theme} />);

    expect(await findByDisplayValue('Jane Doe')).toBeTruthy();
    expect(await findByDisplayValue('+123456789')).toBeTruthy();
    expect(await findByDisplayValue('UK')).toBeTruthy();
  });

  it('updates form inputs when typed', () => {
    const { getByPlaceholderText } = render(<SettingsScreen theme={theme} />);

    const nameInput = getByPlaceholderText('e.g., Mom');
    const numberInput = getByPlaceholderText('e.g., +1234567890');
    const countryInput = getByPlaceholderText('e.g., US');

    fireEvent.changeText(nameInput, 'Dad');
    fireEvent.changeText(numberInput, '+987654321');
    fireEvent.changeText(countryInput, 'IN');

    expect(nameInput.props.value).toBe('Dad');
    expect(numberInput.props.value).toBe('+987654321');
    expect(countryInput.props.value).toBe('IN');
  });

  it('shows correct default emergency number based on countryCode', () => {
    const { getByPlaceholderText, getByText } = render(
      <SettingsScreen theme={theme} />
    );

    const countryInput = getByPlaceholderText('e.g., US');
    fireEvent.changeText(countryInput, 'AU');

    expect(getByText(/Default Emergency Number: 000/)).toBeTruthy();

    fireEvent.changeText(countryInput, 'ZZ');
    expect(getByText(/Default Emergency Number: 911/)).toBeTruthy(); // fallback
  });

  it('saves settings to AsyncStorage and shows alert', async () => {
    const { getByPlaceholderText, getByText } = render(
      <SettingsScreen theme={theme} />
    );

    fireEvent.changeText(getByPlaceholderText('e.g., Mom'), 'Alice');
    fireEvent.changeText(getByPlaceholderText('e.g., +1234567890'), '+12345');
    fireEvent.changeText(getByPlaceholderText('e.g., US'), 'FR');

    await act(async () => {
      fireEvent.press(getByText('Save Settings'));
    });

    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      'emergencyContactName',
      'Alice'
    );
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      'emergencyContactNumber',
      '+12345'
    );
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      'emergencyCountry',
      'FR'
    );
    expect(Alert.alert).toHaveBeenCalledWith(
      'Saved',
      'Emergency settings saved successfully.'
    );
  });
});

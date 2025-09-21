/**
 * react-native-swiper.js (Mock)
 *
 * Provides a minimal Jest mock for `react-native-swiper`, replacing it with
 * a simple `View` container that renders its children. This allows components
 * depending on `Swiper` to be tested without requiring native swiper behavior.
 *
 * Features:
 * - Maintains children rendering.
 * - Exports both default and CommonJS module style for compatibility.
 *
 * Author: Sunidhi Abhange
 */

const React = require('react');
const { View } = require('react-native');

function Swiper({ children, ...rest }) {
  return React.createElement(View, rest, children);
}

module.exports = Swiper;
module.exports.default = Swiper;

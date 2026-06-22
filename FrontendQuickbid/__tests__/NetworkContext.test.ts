import { shouldShowCellularSessionAlert } from '../src/context/NetworkContext';

describe('cellular session notice', () => {
  test('shows once on cellular and never on wifi', () => {
    expect(shouldShowCellularSessionAlert('wifi', false)).toBe(false);
    expect(shouldShowCellularSessionAlert('cellular', false)).toBe(true);
    expect(shouldShowCellularSessionAlert('cellular', true)).toBe(false);
  });
});

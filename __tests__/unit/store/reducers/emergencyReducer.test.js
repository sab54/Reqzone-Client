/**
 * emergencyReducer.test.js
 *
 * What These Tests Cover (4):
 *
 * 1) Initial State & Local Setters
 *    - Unknown actions ignored; setters update country/custom fields and bulk settings.
 *
 * 2) fetchEmergencyContacts flow
 *    - pending sets loading; fulfilled replaces contacts; rejected sets error and clears loading.
 *
 * 3) addEmergencyContact & deleteEmergencyContact
 *    - add unshifts newest-first; delete removes by id.
 *
 * 4) Manual contacts mutations & loading/error helpers
 *    - setContacts replaces; addContact/removeContact mutate; setContactsLoading/setContactsError toggle flags.
 */

import reducer, {
  setCountryCode,
  setCustomName,
  setCustomNumber,
  setEmergencySettings,
  setContacts,
  addContact,
  removeContact,
  setContactsLoading,
  setContactsError,
} from '../../../../src/store/reducers/emergencyReducer';

import {
  fetchEmergencyContacts,
  addEmergencyContact,
  deleteEmergencyContact,
} from '../../../../src/store/actions/emergencyActions';

const initial = {
  countryCode: 'US',
  customName: '',
  customNumber: '',
  contacts: [],
  loading: false,
  error: null,
};

describe('emergency reducer', () => {
  it('1) initial state & local setters', () => {
    const s0 = reducer(undefined, { type: '@@INIT' });
    expect(s0).toEqual(initial);

    // Unknown action does nothing (immutability)
    const frozen = Object.freeze({ ...s0 });
    const s1 = reducer(frozen, { type: 'emergency/NOT_A_REAL_ACTION' });
    expect(s1).toEqual(frozen);

    // Individual setters
    let s2 = reducer(s0, setCountryCode('GB'));
    s2 = reducer(s2, setCustomName('Dad'));
    s2 = reducer(s2, setCustomNumber('+44 7000 000000'));
    expect(s2.countryCode).toBe('GB');
    expect(s2.customName).toBe('Dad');
    expect(s2.customNumber).toBe('+44 7000 000000');

    // Bulk settings
    const s3 = reducer(
      s2,
      setEmergencySettings({
        countryCode: 'IN',
        customName: 'Mom',
        customNumber: '+91 90000 00000',
      })
    );
    expect(s3.countryCode).toBe('IN');
    expect(s3.customName).toBe('Mom');
    expect(s3.customNumber).toBe('+91 90000 00000');
  });

  it('2) fetchEmergencyContacts: pending → fulfilled → rejected', () => {
    // pending
    let state = reducer(undefined, { type: fetchEmergencyContacts.pending.type });
    expect(state.loading).toBe(true);
    expect(state.error).toBeNull();

    // fulfilled replaces contacts
    const payload = [
      { id: '1', name: 'Police', number: '100' },
      { id: '2', name: 'Fire', number: '101' },
    ];
    state = reducer(state, { type: fetchEmergencyContacts.fulfilled.type, payload });
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();
    expect(state.contacts).toEqual(payload);

    // rejected sets error and clears loading
    state = reducer(state, { type: fetchEmergencyContacts.rejected.type, payload: 'network' });
    expect(state.loading).toBe(false);
    expect(state.error).toBe('network');
  });

  it('3) addEmergencyContact unshifts; deleteEmergencyContact removes by id', () => {
    let state = {
      ...initial,
      contacts: [{ id: 'a', name: 'A', number: '111' }],
    };

    // add → unshift newest-first
    state = reducer(state, {
      type: addEmergencyContact.fulfilled.type,
      payload: { id: 'b', name: 'B', number: '222' },
    });
    expect(state.contacts.map(c => c.id)).toEqual(['b', 'a']);

    // add another for order check
    state = reducer(state, {
      type: addEmergencyContact.fulfilled.type,
      payload: { id: 'c', name: 'C', number: '333' },
    });
    expect(state.contacts.map(c => c.id)).toEqual(['c', 'b', 'a']);

    // delete by id
    state = reducer(state, { type: deleteEmergencyContact.fulfilled.type, payload: 'b' });
    expect(state.contacts.map(c => c.id)).toEqual(['c', 'a']);
  });

  it('4) manual contacts edits & loading/error helpers', () => {
    let state = reducer(undefined, { type: '@@INIT' });

    // setContactsLoading then setContactsError
    state = reducer(state, setContactsLoading());
    expect(state.loading).toBe(true);
    expect(state.error).toBeNull();

    state = reducer(state, setContactsError('oops'));
    expect(state.loading).toBe(false);
    expect(state.error).toBe('oops');

    // Replace contacts
    const base = [
      { id: 'x', name: 'X', number: '123' },
      { id: 'y', name: 'Y', number: '456' },
    ];
    state = reducer(state, setContacts(base));
    expect(state.contacts).toEqual(base);

    // Local addContact (push at end)
    state = reducer(state, addContact({ id: 'z', name: 'Z', number: '789' }));
    expect(state.contacts.map(c => c.id)).toEqual(['x', 'y', 'z']);

    // Local removeContact by id
    state = reducer(state, removeContact('y'));
    expect(state.contacts.map(c => c.id)).toEqual(['x', 'z']);
  });
});

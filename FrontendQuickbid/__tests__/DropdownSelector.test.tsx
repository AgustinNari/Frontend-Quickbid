import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { DropdownSelector } from '../src/components/DropdownSelector';

describe('DropdownSelector', () => {
  test('abre, cambia la seleccion y se cierra', () => {
    const onSelect = jest.fn();
    let tree: TestRenderer.ReactTestRenderer;
    act(() => {
      tree = TestRenderer.create(
        <DropdownSelector
          testID="test-dropdown"
          options={[
            { id: 1, label: 'Principal' },
            { id: 2, label: 'Alternativa' },
          ]}
          selectedId={1}
          onSelect={onSelect}
        />,
      );
    });

    expect(tree!.root.findAllByProps({ testID: 'test-dropdown-options' })).toHaveLength(0);
    act(() => tree!.root.findByProps({ testID: 'test-dropdown-trigger' }).props.onPress());
    expect(
      tree!.root.findAllByProps({ testID: 'test-dropdown-options' }).length,
    ).toBeGreaterThan(0);
    act(() => tree!.root.findByProps({ testID: 'test-dropdown-option-2' }).props.onPress());
    expect(onSelect).toHaveBeenCalledWith(2);
    expect(tree!.root.findAllByProps({ testID: 'test-dropdown-options' })).toHaveLength(0);
  });

  test('una unica opcion queda compacta y no despliega una lista', () => {
    let tree: TestRenderer.ReactTestRenderer;
    act(() => {
      tree = TestRenderer.create(
        <DropdownSelector
          testID="single-dropdown"
          options={[{ id: 'only', label: 'Unica opcion' }]}
          selectedId="only"
          onSelect={jest.fn()}
        />,
      );
    });
    expect(
      tree!.root.findByProps({ testID: 'single-dropdown-trigger' }).props
        .accessibilityState.disabled,
    ).toBe(true);
    expect(tree!.root.findAllByProps({ testID: 'single-dropdown-options' })).toHaveLength(0);
  });
});

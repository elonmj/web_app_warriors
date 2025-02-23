import '@testing-library/jest-dom';
import { RenderResult } from '@testing-library/react';
import { ReactElement } from 'react';

declare global {
  namespace jest {
    interface Matchers<R> extends jest.Matchers<R> {
      toBeInTheDocument(): R;
      toHaveTextContent(text: string | RegExp): R;
      toBeVisible(): R;
      toBeEnabled(): R;
      toBeDisabled(): R;
      toHaveClass(className: string): R;
      toHaveStyle(css: { [key: string]: any }): R;
      toHaveAttribute(attr: string, value?: string): R;
      toContainElement(element: HTMLElement | null): R;
      toBeEmpty(): R;
      toHaveLength(length: number): R;
      toHaveValue(value: string | string[] | number): R;
      toBeChecked(): R;
      toHaveFocus(): R;
      toBeValid(): R;
      toBeInvalid(): R;
      toBeRequired(): R;
      toBePartiallyChecked(): R;
      toHaveDisplayValue(value: string | RegExp | Array<string | RegExp>): R;
      toHaveDescription(text: string | RegExp): R;
      toHaveErrorMessage(text: string | RegExp): R;
      toHaveFormValues(values: { [key: string]: any }): R;
      toContainHTML(html: string): R;
      // Performance test matchers
      toHavePerformanceUnder(threshold: number): R;
      toRenderWithinTime(milliseconds: number): R;
    }
  }
}

declare module '@testing-library/react' {
  export interface RenderResult {
    container: HTMLElement;
    baseElement: HTMLElement;
    debug: (baseElement?: HTMLElement | DocumentFragment) => void;
    rerender: (ui: ReactElement) => void;
    unmount: () => void;
    asFragment: () => DocumentFragment;
    findByTestId: (id: string) => Promise<HTMLElement>;
    findByText: (text: string | RegExp) => Promise<HTMLElement>;
    findByRole: (role: string) => Promise<HTMLElement>;
    getAllByTestId: (id: string) => HTMLElement[];
    queryByTestId: (id: string) => HTMLElement | null;
    getByRole: (role: string, options?: object) => HTMLElement;
  }

  export interface CustomRenderOptions {
    route?: string;
    initialState?: object;
    mockData?: object;
  }

  export interface CustomRenderResult extends RenderResult {
    mockData?: object;
  }

  export function customRender(
    ui: ReactElement,
    options?: CustomRenderOptions
  ): CustomRenderResult;
}

// React component type with displayName
declare module 'react' {
  interface FunctionComponent<P = {}> {
    displayName?: string;
  }
}

export {};
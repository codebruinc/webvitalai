import '@testing-library/jest-dom';

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeInTheDocument(): R;
      toHaveAttribute(attr: string, value?: string): R;
      toHaveTextContent(text: string | RegExp): R;
      toHaveValue(value: string | string[] | number | null): R;
      toBeDisabled(): R;
      toBeEnabled(): R;
      toBeVisible(): R;
      toBeChecked(): R;
      toBePartiallyChecked(): R;
      toHaveClass(...classNames: string[]): R;
      toHaveFocus(): R;
      toHaveStyle(css: string | Record<string, any>): R;
      toContainElement(element: HTMLElement | null): R;
      toContainHTML(htmlText: string): R;
      toBeEmpty(): R;
      toBeInvalid(): R;
      toBeValid(): R;
      toBeRequired(): R;
    }
  }
}
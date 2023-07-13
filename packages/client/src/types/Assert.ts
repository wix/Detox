import { NativeElement } from './NativeElement';

export interface Assert<R = Promise<void>> {
  exists(element: NativeElement): R;
  hasId(element: NativeElement, id: string): R;
  hasLabel(element: NativeElement, label: string): R;
  hasSliderPosition(element: NativeElement, position: number, tolerance?: number): R;
  hasText(element: NativeElement, text: string): R;
  hasToggleValue(element: NativeElement, value: boolean): R;
  hasValue(element: NativeElement, value: string): R;
  isFocused(element: NativeElement): R;
  isVisible(element: NativeElement, percent?: number): R;

  readonly not: Omit<this, 'not'>;
}

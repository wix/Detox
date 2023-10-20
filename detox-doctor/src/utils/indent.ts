export function indent(text: string, indentation: string): string {
  return indentation + text.replace(/\n/g, '\n' + indentation);
}

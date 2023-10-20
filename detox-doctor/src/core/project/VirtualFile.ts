export class VirtualFile {
  public content: string | undefined;

  constructor(public readonly path: string, public readonly originalContent?: string) {
    this.path = path;
    this.content = originalContent;
  }

  get modified() {
    return this.content !== this.originalContent;
  }
}

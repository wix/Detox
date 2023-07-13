export class By {
  id(id) {
    return new Matcher().id(id);
  }

  type(type) {
    return new Matcher().type(type);
  }

  text(text) {
    return new Matcher().text(text);
  }

  label(label) {
    return new Matcher().label(label);
  }

  accessibilityLabel(label) {
    return new Matcher().accessibilityLabel(label);
  }

  traits(traits) {
    return new Matcher().traits(traits);
  }

  value(value) {
    return new Matcher().value(value);
  }
}

class Matcher {
  protected predicate?: Predicate;

  accessibilityLabel(label) {
    return this.label(label);
  }

  label(label) {
    if (typeof label !== 'string') throw new Error('label should be a string or regex, but got ' + (label + (' (' + (typeof label + ')'))));
    this.predicate = { type: 'label', value: label.toString(), isRegex: false };
    return this;
  }

  id(id) {
    if (typeof id !== 'string') throw new Error('id should be a string or regex, but got ' + (id + (' (' + (typeof id + ')'))));
    this.predicate = { type: 'id', value: id.toString(), isRegex: false };
    return this;
  }

  type(type) {
    if (typeof type !== 'string') throw new Error('type should be a string, but got ' + (type + (' (' + (typeof type + ')'))));
    this.predicate = { type: 'type', value: type };
    return this;
  }

  traits(traits) {
    if (!Array.isArray(traits)) throw new Error('traits must be an array, got ' + typeof traits);
    this.predicate = { type: 'traits', value: traits };
    return this;
  }

  value(value) {
    if (typeof value !== 'string') throw new Error('value should be a string, but got ' + (value + (' (' + (typeof value + ')'))));
    this.predicate = { type: 'value', value: value };
    return this;
  }

  text(text) {
    if (typeof text !== 'string') throw new Error(`text should be a string, but got ` + (text + (' (' + (typeof text + ')'))));
    this.predicate = { type: 'text', value: text.toString(), isRegex: false };
    return this;
  }
}

type Predicate = {
  type: 'id' | 'type' | 'label' | 'traits' | 'value' | 'text';
  value: string | string[] | Predicate[];
  isRegex?: boolean;
};

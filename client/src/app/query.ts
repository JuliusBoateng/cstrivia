// Constructor function that produces a DOM element.
type ElementConstructor<T extends Element> = {
  new (...args: any[]): T;
};

// Uses the constructor for both runtime instanceof checks and compile-time type inference.
function queryRequired<T extends Element>(root: ParentNode, selector: string, elementType: ElementConstructor<T>): T {
  const element = root.querySelector(selector);
  if (!(element instanceof elementType)) throw new Error(`Missing expected element: ${selector}`);

  return element;
}

export { queryRequired };

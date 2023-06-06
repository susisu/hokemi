import type { Component } from ".";
import { impl, mixer } from ".";

type FooComponent = Component<"foo", { getFoo: () => number }>;
type BarComponent = Component<"bar", { getBar: () => string }>;
type BazComponent = Component<"baz", { getBaz: () => boolean }>;

describe("impl", () => {
  it("creates a factory object that implements a component", () => {
    const foo = impl<FooComponent, [BarComponent]>("foo", app => ({
      getFoo: () => app.bar.getBar().length,
    }));
    expect(foo.name).toBe("foo");
    const instance = foo.func({
      bar: {
        getBar: () => "Hello",
      },
    });
    expect(instance.getFoo()).toBe(5);
  });
});

describe("mixer", () => {
  const foo = impl<FooComponent, [BarComponent, BazComponent]>("foo", deps => ({
    getFoo: () => (deps.baz.getBaz() ? deps.bar.getBar().length : 42),
  }));
  const bar = impl<BarComponent, [BazComponent]>("bar", deps => ({
    getBar: () => (deps.baz.getBaz() ? "Hello" : "Bye"),
  }));
  const baz = impl<BazComponent>("baz", () => ({
    getBaz: () => true,
  }));

  it("mixes components and makes a mixed instance", () => {
    const app = mixer(foo, bar, baz).make();
    expect(app.foo.getFoo()).toBe(5);
  });

  it("can override previous mixed components", () => {
    const baz2 = impl<BazComponent, []>("baz", () => ({
      getBaz: () => false,
    }));
    const app = mixer(foo, bar).mix(baz2).make();
    expect(app.foo.getFoo()).toBe(42);
  });
});

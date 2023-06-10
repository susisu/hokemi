import type { Component } from "./component";
import { impl } from "./provider";

describe("impl", () => {
  it("creates a provider that implements a component", () => {
    type FooComponent = Component<"foo", { getFoo: () => number }>;
    type BarComponent = Component<"bar", { getBar: () => string }>;

    const foo = impl<FooComponent, [BarComponent]>("foo", app => ({
      getFoo: () => app.bar.getBar().length,
    }));

    expect(foo.name).toBe("foo");
    const instance = foo.factory({
      bar: {
        getBar: () => "Hello",
      },
    });
    expect(instance.getFoo()).toBe(5);
  });
});

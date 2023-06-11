import type { Equals } from "./__tests__/types";
import { assertType } from "./__tests__/types";
import type { Component, MixedInstance } from "./component";
import type { Mixer, incompatibleDependenciesError, missingDependenciesError } from "./mixer";
import { mixer } from "./mixer";
import type { Impl } from "./provider";
import { impl } from "./provider";

describe("Mixer", () => {
  describe("make", () => {
    type Foo = { getFoo: () => number };
    type Bar = { getBar: () => string };
    type Baz = { getBaz: () => boolean };

    type FooComponent = Component<"foo", Foo>;
    type BarComponent = Component<"bar", Bar>;
    type BazComponent = Component<"baz", Baz>;

    type FooImpl = Impl<FooComponent, [BarComponent, BazComponent]>;
    type BarImpl = Impl<BarComponent, [BazComponent]>;
    type BazImpl = Impl<BazComponent, []>;

    it("creates an instance if there is no error", () => {
      type M = Mixer<[FooImpl, BarImpl, BazImpl]>;
      assertType<
        Equals<M["make"], () => MixedInstance<[FooComponent, BarComponent, BazComponent]>>
      >();
    });

    it("can report missing dependencies errors", () => {
      type M = Mixer<[FooImpl, BarImpl]>;
      assertType<
        Equals<
          M["make"],
          | {
              [missingDependenciesError]: {
                reason: "provider has missing dependencies";
                providerName: "foo";
                dependencies: [
                  {
                    name: "baz";
                    expectedType: Baz;
                  }
                ];
              };
            }
          | {
              [missingDependenciesError]: {
                reason: "provider has missing dependencies";
                providerName: "bar";
                dependencies: [
                  {
                    name: "baz";
                    expectedType: Baz;
                  }
                ];
              };
            }
        >
      >();
    });

    it("can report incompatible dependencies error", () => {
      type Bar2 = { getBar2: () => string };
      type Bar2Component = Component<"bar", Bar2>;
      type Bar2Impl = Impl<Bar2Component, [BazComponent]>;

      type M = Mixer<[FooImpl, BarImpl, BazImpl, Bar2Impl]>;
      assertType<
        Equals<
          M["make"],
          {
            [incompatibleDependenciesError]: {
              reason: "provider has incompatible dependencies";
              providerName: "foo";
              dependencies: [
                {
                  name: "bar";
                  expectedType: Bar;
                  actualType: Bar2;
                }
              ];
            };
          }
        >
      >();
    });
  });
});

describe("mixer", () => {
  type FooComponent = Component<"foo", { getFoo: () => number }>;
  type BarComponent = Component<"bar", { getBar: () => string }>;
  type BazComponent = Component<"baz", { getBaz: () => boolean }>;

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

  it("overrides previous mixed components", () => {
    const baz2 = impl<BazComponent, []>("baz", () => ({
      getBaz: () => false,
    }));
    const app = mixer(foo, bar, baz).mix(baz2).make();
    expect(app.foo.getFoo()).toBe(42);
  });

  it("throws if dependencies are used during initialization", () => {
    const bar2 = impl<BarComponent, [BazComponent]>("bar", deps => {
      const x = deps.baz.getBaz();
      return {
        getBar: () => (x ? "Hello" : "Bye"),
      };
    });
    expect(() => {
      mixer(foo, bar2, baz).make();
    }).toThrow("you cannot use 'baz' during initialization");
  });
});

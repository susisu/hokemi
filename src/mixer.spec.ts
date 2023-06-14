import type { Equals } from "./__tests__/types";
import { assertType } from "./__tests__/types";
import type { Component, Mixed } from "./component";
import type { Mixer, incompatibleDependenciesError, missingDependenciesError } from "./mixer";
import { mixer } from "./mixer";
import type { Impl } from "./provider";
import { impl } from "./provider";

describe("Mixer", () => {
  describe("new", () => {
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
      assertType<Equals<M["new"], () => Mixed<[FooComponent, BarComponent, BazComponent]>>>();
    });

    it("can report missing dependencies errors", () => {
      type M = Mixer<[FooImpl, BarImpl]>;
      assertType<
        Equals<
          M["new"],
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
          M["new"],
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
  type Foo = { getFoo: () => number };
  type Bar = { getBar: () => string };
  type Baz = { getBaz: () => boolean };

  type FooComponent = Component<"foo", Foo>;
  type BarComponent = Component<"bar", Bar>;
  type BazComponent = Component<"baz", Baz>;

  it("mixes components and creates a mixed instance", () => {
    const foo = impl<FooComponent, [BarComponent, BazComponent]>("foo", ({ bar, baz }) => ({
      getFoo: () => (baz.getBaz() ? bar.getBar().length : 42),
    }));
    const bar = impl<BarComponent, [BazComponent]>("bar", ({ baz }) => ({
      getBar: () => (baz.getBaz() ? "Hello" : "Bye"),
    }));
    const baz = impl<BazComponent>("baz", () => ({
      getBaz: () => true,
    }));

    const mixed = mixer(foo, bar, baz).new();
    expect(mixed.foo.getFoo()).toBe(5);
  });

  it("overrides previous mixed components", () => {
    const foo = impl<FooComponent, [BarComponent, BazComponent]>("foo", ({ bar, baz }) => ({
      getFoo: () => (baz.getBaz() ? bar.getBar().length : 42),
    }));
    const bar = impl<BarComponent, [BazComponent]>("bar", ({ baz }) => ({
      getBar: () => (baz.getBaz() ? "Hello" : "Bye"),
    }));
    const baz = impl<BazComponent>("baz", () => ({
      getBaz: () => true,
    }));
    const baz2 = impl<BazComponent>("baz", () => ({
      getBaz: () => false,
    }));

    const mixed = mixer(foo, bar, baz).with(baz2).new();
    expect(mixed.foo.getFoo()).toBe(42);
  });

  it("throws if a component is referenced during its initialization", () => {
    // foo and bar reference each other during initialization
    const foo = impl<FooComponent, [BarComponent]>("foo", ({ bar }) => ({
      getFoo: () => bar.getBar().length,
    }));
    const bar = impl<BarComponent, [FooComponent]>("bar", ({ foo }) => ({
      getBar: () => foo.getFoo().toString(),
    }));

    expect(() => {
      mixer(foo, bar).new();
    }).toThrow("'foo' is referenced during its initialization");
  });

  it("does not throw if a component is referenced after its initialization, even if there is a circular dependency", () => {
    // foo references bar during its initialization, while bar defers referencing foo until it is actually used
    // (this is not a good example though; it loops forever if you call foo.getFoo() or bar.getBar())
    const foo = impl<FooComponent, [BarComponent]>("foo", ({ bar }) => ({
      getFoo: () => bar.getBar().length,
    }));
    const bar = impl<BarComponent, [FooComponent]>("bar", deps => ({
      getBar: () => deps.foo.getFoo().toString(),
    }));

    expect(() => {
      mixer(foo, bar).new();
    }).not.toThrow();
  });

  it("accepts classes as compoent factories", () => {
    const foo = impl<FooComponent, [BarComponent, BazComponent]>(
      "foo",
      class FooImpl {
        private bar: Bar;
        private baz: Baz;

        constructor({ bar, baz }: Mixed<[BarComponent, BazComponent]>) {
          this.bar = bar;
          this.baz = baz;
        }

        getFoo(): number {
          return this.baz.getBaz() ? this.bar.getBar().length : 42;
        }
      }
    );
    const bar = impl<BarComponent, [BazComponent]>(
      "bar",
      class BarImpl {
        private baz: Baz;

        constructor({ baz }: Mixed<[BazComponent]>) {
          this.baz = baz;
        }

        getBar(): string {
          return this.baz.getBaz() ? "Hello" : "Bye";
        }
      }
    );
    const baz = impl<BazComponent>(
      "baz",
      class BazImpl {
        getBaz(): boolean {
          return true;
        }
      }
    );

    const mixed = mixer(foo, bar, baz).new();
    expect(mixed.foo.getFoo()).toBe(5);
  });
});

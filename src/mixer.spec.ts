import { describe, it, assertType, expect } from "vitest";
import type { Equals } from "./__tests__/types.js";
import type { Component, Mixed } from "./component.js";
import type { Mixer } from "./mixer.js";
import { mixer } from "./mixer.js";
import type { Impl } from "./provider.js";
import { impl } from "./provider.js";

describe("Mixer", () => {
  describe("new", () => {
    /* eslint-disable @typescript-eslint/naming-convention */

    type Foo = { getFoo: () => number };
    type Bar = { getBar: () => string };
    type Baz = { getBaz: () => boolean };

    type FooComponent = Component<"foo", Foo>;
    type BarComponent = Component<"bar", Bar>;
    type BazComponent = Component<"baz", Baz>;

    it("creates an instance if there is no error", () => {
      type FooImpl = Impl<FooComponent, [BarComponent, BazComponent]>;
      type BarImpl = Impl<BarComponent, [BazComponent]>;
      type BazImpl = Impl<BazComponent>;

      type M = Mixer<[FooImpl, BarImpl, BazImpl]>;
      assertType<Equals<M["new"], () => Mixed<[FooComponent, BarComponent, BazComponent]>>>(true);
    });

    it("reports missing dependencies if some dependencies are missing", () => {
      type FooImpl = Impl<FooComponent, [BarComponent, BazComponent]>;
      type BarImpl = Impl<BarComponent, [BazComponent]>;

      type M = Mixer<[FooImpl, BarImpl]>;
      assertType<
        Equals<
          M["new"],
          | {
              __missingDependenciesError?: {
                reason: "some dependencies are missing";
                providerName: "foo";
                dependencies: [
                  {
                    name: "baz";
                    expectedType: Baz;
                  },
                ];
              };
            }
          | {
              __missingDependenciesError?: {
                reason: "some dependencies are missing";
                providerName: "bar";
                dependencies: [
                  {
                    name: "baz";
                    expectedType: Baz;
                  },
                ];
              };
            }
        >
      >(true);
    });

    it("reports incompatible dependencies if some dependencies are incompatible", () => {
      type FooImpl = Impl<FooComponent, [BarComponent, BazComponent]>;
      type BarImpl = Impl<BarComponent, [BazComponent]>;
      type BazImpl = Impl<BazComponent>;

      type Bar2 = { getBar2: () => string };
      type Bar2Component = Component<"bar", Bar2>;
      type Bar2Impl = Impl<Bar2Component, [BazComponent]>;

      type M = Mixer<[FooImpl, BarImpl, BazImpl, Bar2Impl]>;
      assertType<
        Equals<
          M["new"],
          {
            __incompatibleDependenciesError?: {
              reason: "some dependencies are incompatible";
              providerName: "foo";
              dependencies: [
                {
                  name: "bar";
                  expectedType: Bar;
                  actualType: Bar2;
                },
              ];
            };
          }
        >
      >(true);
    });

    it("reports missing dependencies if some dependencies are possibly missing", () => {
      type FooImpl = Impl<FooComponent, [BarComponent]>;
      type BarImpl = Impl<BarComponent>;
      type BarBazImpl = Impl<BarComponent | BazComponent>;

      type M1 = Mixer<[FooImpl, BarBazImpl]>;
      assertType<
        Equals<
          M1["new"],
          {
            __missingDependenciesError?: {
              reason: "some dependencies are missing";
              providerName: "foo";
              dependencies: [
                {
                  name: "bar";
                  expectedType: Bar;
                },
              ];
            };
          }
        >
      >(true);

      type M2 = Mixer<[FooImpl, BarBazImpl, BarImpl]>;
      assertType<
        Equals<M2["new"], () => Mixed<[FooComponent, BarComponent | BazComponent, BarComponent]>>
      >(true);
    });

    it("allows creating an instance if any possible combination of dependencies is provided", () => {
      type FooImpl = Impl<FooComponent, [BarComponent] | [BazComponent]>;
      type BarImpl = Impl<BarComponent>;
      type BazImpl = Impl<BazComponent>;

      type M1 = Mixer<[FooImpl]>;
      assertType<
        Equals<
          M1["new"],
          {
            __missingDependenciesError?: {
              reason: "some dependencies are missing";
              providerName: "foo";
              dependencies:
                | [
                    {
                      name: "bar";
                      expectedType: Bar;
                    },
                  ]
                | [
                    {
                      name: "baz";
                      expectedType: Baz;
                    },
                  ];
            };
          }
        >
      >(true);

      type M2 = Mixer<[FooImpl, BarImpl]>;
      assertType<Equals<M2["new"], () => Mixed<[FooComponent, BarComponent]>>>(true);

      type M3 = Mixer<[FooImpl, BazImpl]>;
      assertType<Equals<M3["new"], () => Mixed<[FooComponent, BazComponent]>>>(true);
    });

    it("reports missing dependencies unless all possible dependencies are provided", () => {
      type FooImpl = Impl<FooComponent, [BarComponent]> | Impl<FooComponent, [BazComponent]>;
      type BarImpl = Impl<BarComponent>;
      type BazImpl = Impl<BazComponent>;

      type M1 = Mixer<[FooImpl]>;
      assertType<
        Equals<
          M1["new"],
          {
            __missingDependenciesError?: {
              reason: "some dependencies are missing";
              providerName: "foo";
              dependencies: [
                | {
                    name: "bar";
                    expectedType: Bar;
                  }
                | {
                    name: "baz";
                    expectedType: Baz;
                  },
              ];
            };
          }
        >
      >(true);

      type M2 = Mixer<[FooImpl, BarImpl]>;
      assertType<
        Equals<
          M2["new"],
          {
            __missingDependenciesError?: {
              reason: "some dependencies are missing";
              providerName: "foo";
              dependencies: [
                {
                  name: "baz";
                  expectedType: Baz;
                },
              ];
            };
          }
        >
      >(true);

      type M3 = Mixer<[FooImpl, BazImpl]>;
      assertType<
        Equals<
          M3["new"],
          {
            __missingDependenciesError?: {
              reason: "some dependencies are missing";
              providerName: "foo";
              dependencies: [
                {
                  name: "bar";
                  expectedType: Bar;
                },
              ];
            };
          }
        >
      >(true);

      type M4 = Mixer<[FooImpl, BarImpl, BazImpl]>;
      assertType<Equals<M4["new"], () => Mixed<[FooComponent, BarComponent, BazComponent]>>>(true);
    });

    /* eslint-enable @typescript-eslint/naming-convention */
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

    const m = mixer(foo, bar, baz);
    assertType<Equals<typeof m, Mixer<[typeof foo, typeof bar, typeof baz]>>>(true);

    const mixed = m.new();
    assertType<Equals<typeof mixed, Mixed<[FooComponent, BarComponent, BazComponent]>>>(true);
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

    const m = mixer(foo, bar, baz).with(baz2);
    assertType<Equals<typeof m, Mixer<[typeof foo, typeof bar, typeof baz, typeof baz2]>>>(true);

    const mixed = m.new();
    assertType<Equals<typeof mixed, Mixed<[FooComponent, BarComponent, BazComponent]>>>(true);
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
    const bar = impl<BarComponent, [FooComponent]>("bar", (deps) => ({
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
      },
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
      },
    );
    const baz = impl<BazComponent>(
      "baz",
      class BazImpl {
        getBaz(): boolean {
          return true;
        }
      },
    );

    const m = mixer(foo, bar, baz);
    assertType<Equals<typeof m, Mixer<[typeof foo, typeof bar, typeof baz]>>>(true);

    const mixed = m.new();
    assertType<Equals<typeof mixed, Mixed<[FooComponent, BarComponent, BazComponent]>>>(true);
    expect(mixed.foo.getFoo()).toBe(5);
  });
});

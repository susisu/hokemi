import type { Equals } from "./__tests__/types";
import { assertType } from "./__tests__/types";
import type { Component } from "./component";
import type {
  Factory,
  Impl,
  ImplArgs,
  MixedProvidedInstance,
  Provider,
  ProviderDependencies,
  ProviderName,
  ReconstructComponent,
} from "./provider";
import { impl, execFactory } from "./provider";

describe("execFactory", () => {
  it("calls the factory if it is a function", () => {
    type Foo = { getFoo: () => number };
    const factory = (foo: number): Foo => ({ getFoo: () => foo });
    const value = execFactory(factory, 42);
    expect(value.getFoo()).toBe(42);
  });

  it("constructs an instance of the factory if it is a class", () => {
    const factory = class Foo {
      private foo: number;

      constructor(foo: number) {
        this.foo = foo;
      }

      getFoo(): number {
        return this.foo;
      }
    };
    const value = execFactory(factory, 42);
    expect(value.getFoo()).toBe(42);
  });
});

describe("ProviderName", () => {
  it("returns the name of the provider", () => {
    type FooProvider = Provider<"foo", { getFoo: () => number }, { bar: { getBar: () => string } }>;
    assertType<Equals<ProviderName<FooProvider>, "foo">>();
  });

  it("distributes over union members", () => {
    type FooProvider = Provider<"foo", { getFoo: () => number }, { bar: { getBar: () => string } }>;
    type BarProvider = Provider<"bar", { getBar: () => string }, {}>;
    assertType<Equals<ProviderName<FooProvider | BarProvider>, "foo" | "bar">>();
  });
});

describe("ProviderDependencies", () => {
  it("returns the dependencies of the provider", () => {
    type FooProvider = Provider<"foo", { getFoo: () => number }, { bar: { getBar: () => string } }>;
    assertType<Equals<ProviderDependencies<FooProvider>, { bar: { getBar: () => string } }>>();
  });

  it("distributes over union members", () => {
    type FooProvider = Provider<"foo", { getFoo: () => number }, { bar: { getBar: () => string } }>;
    type BarProvider = Provider<"bar", { getBar: () => string }, {}>;
    assertType<
      Equals<
        ProviderDependencies<FooProvider | BarProvider>,
        { bar: { getBar: () => string } } | {}
      >
    >();
  });
});

describe("ReconstructComponent", () => {
  it("reconstructs a component type from the provider type", () => {
    type FooProvider = Provider<"foo", { getFoo: () => number }, { bar: { getBar: () => string } }>;
    assertType<
      Equals<ReconstructComponent<FooProvider>, Component<"foo", { getFoo: () => number }>>
    >();
  });

  it("distributes over union members", () => {
    type FooProvider = Provider<"foo", { getFoo: () => number }, { bar: { getBar: () => string } }>;
    type BarProvider = Provider<"bar", { getBar: () => string }, {}>;
    assertType<
      Equals<
        ReconstructComponent<FooProvider | BarProvider>,
        Component<"foo", { getFoo: () => number }> | Component<"bar", { getBar: () => string }>
      >
    >();
  });
});

describe("MixedProvidedInstance", () => {
  it("returns a mixed instance type of the providers", () => {
    assertType<Equals<MixedProvidedInstance<[]>, {}>>();

    type FooProvider = Provider<"foo", { getFoo: () => number }, { bar: { getBar: () => string } }>;
    type BarProvider = Provider<"bar", { getBar: () => string }, {}>;
    type BazProvider = Provider<"baz", { getBaz: () => boolean }, {}>;
    assertType<
      Equals<
        MixedProvidedInstance<[FooProvider, BarProvider, BazProvider]>,
        Readonly<{
          foo: { getFoo: () => number };
          bar: { getBar: () => string };
          baz: { getBaz: () => boolean };
        }>
      >
    >();

    type Bar2Provider = Provider<"bar", { getBar2: () => string }, {}>;
    assertType<
      Equals<
        MixedProvidedInstance<[FooProvider, BarProvider, BazProvider, Bar2Provider]>,
        Readonly<{
          foo: { getFoo: () => number };
          bar: { getBar2: () => string };
          baz: { getBaz: () => boolean };
        }>
      >
    >();
  });

  it("distibutes over union members", () => {
    type FooProvider = Provider<"foo", { getFoo: () => number }, { bar: { getBar: () => string } }>;
    type BarProvider = Provider<"bar", { getBar: () => string }, {}>;
    type BazProvider = Provider<"baz", { getBaz: () => boolean }, {}>;
    assertType<
      Equals<
        MixedProvidedInstance<[FooProvider, BarProvider] | [BazProvider]>,
        | Readonly<{
            foo: { getFoo: () => number };
            bar: { getBar: () => string };
          }>
        | Readonly<{
            baz: { getBaz: () => boolean };
          }>
      >
    >();
  });
});

describe("Impl", () => {
  it("returns a provider type that implements the component", () => {
    type FooComponent = Component<"foo", { getFoo: () => number }>;
    type BarComponent = Component<"bar", { getBar: () => string }>;
    type BazComponent = Component<"baz", { getBaz: () => boolean }>;
    assertType<
      Equals<
        Impl<FooComponent, [BarComponent, BazComponent]>,
        Provider<
          "foo",
          { getFoo: () => number },
          Readonly<{
            bar: { getBar: () => string };
            baz: { getBaz: () => boolean };
          }>
        >
      >
    >();
  });

  it("distributes over union members", () => {
    type FooComponent = Component<"foo", { getFoo: () => number }>;
    type BarComponent = Component<"bar", { getBar: () => string }>;
    type BazComponent = Component<"baz", { getBaz: () => boolean }>;
    assertType<
      Equals<
        Impl<FooComponent | BarComponent, [BazComponent]>,
        | Provider<"foo", { getFoo: () => number }, Readonly<{ baz: { getBaz: () => boolean } }>>
        | Provider<"bar", { getBar: () => string }, Readonly<{ baz: { getBaz: () => boolean } }>>
      >
    >();
  });
});

describe("ImplArgs", () => {
  it("returns a tuple that has the same shape of the provider that implements the component", () => {
    type FooComponent = Component<"foo", { getFoo: () => number }>;
    type BarComponent = Component<"bar", { getBar: () => string }>;
    type BazComponent = Component<"baz", { getBaz: () => boolean }>;
    assertType<
      Equals<
        ImplArgs<FooComponent, [BarComponent, BazComponent]>,
        [
          "foo",
          Factory<
            { getFoo: () => number },
            Readonly<{
              bar: { getBar: () => string };
              baz: { getBaz: () => boolean };
            }>
          >
        ]
      >
    >();
  });

  it("distributes over union members", () => {
    type FooComponent = Component<"foo", { getFoo: () => number }>;
    type BarComponent = Component<"bar", { getBar: () => string }>;
    type BazComponent = Component<"baz", { getBaz: () => boolean }>;
    assertType<
      Equals<
        ImplArgs<FooComponent | BarComponent, [BazComponent]>,
        | ["foo", Factory<{ getFoo: () => number }, Readonly<{ baz: { getBaz: () => boolean } }>>]
        | ["bar", Factory<{ getBar: () => string }, Readonly<{ baz: { getBaz: () => boolean } }>>]
      >
    >();
  });
});

describe("impl", () => {
  it("creates a provider that implements a component", () => {
    type FooComponent = Component<"foo", { getFoo: () => number }>;
    type BarComponent = Component<"bar", { getBar: () => string }>;

    const foo = impl<FooComponent, [BarComponent]>("foo", ({ bar }) => ({
      getFoo: () => bar.getBar().length,
    }));

    assertType<Equals<typeof foo, Impl<FooComponent, [BarComponent]>>>();
    expect(foo.name).toBe("foo");
    const value = execFactory(foo.factory, {
      bar: {
        getBar: () => "Hello",
      },
    });
    expect(value.getFoo()).toBe(5);
  });
});

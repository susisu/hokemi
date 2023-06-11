import type { Compat } from "./__tests__/types";
import { assertType } from "./__tests__/types";
import type { Component, Instance, MixedInstance } from "./component";

describe("Instance", () => {
  it("returns an object type with a property whose name is the component name and whose type is the component type", () => {
    type FooComponent = Component<"foo", { getFoo: () => number }>;
    assertType<Compat<Instance<FooComponent>, Readonly<{ foo: { getFoo: () => number } }>>>();
  });

  it("returns an empty object type if the component name is not a singleton string", () => {
    type Xxx1Component = Component<never, { getXxx: () => number }>;
    assertType<Compat<Instance<Xxx1Component>, {}>>();

    type Xxx2Component = Component<"xxx" | "yyy", { getXxx: () => number }>;
    assertType<Compat<Instance<Xxx2Component>, {}>>();

    type Xxx3Component = Component<string, { getXxx: () => number }>;
    assertType<Compat<Instance<Xxx3Component>, {}>>();

    type Xxx4Component = Component<`x-${string}`, { getXxx: () => number }>;
    assertType<Compat<Instance<Xxx4Component>, {}>>();
  });

  it("distributes over union members", () => {
    type FooComponent = Component<"foo", { getFoo: () => number }>;
    type BarComponent = Component<"bar", { getBar: () => string }>;
    assertType<
      Compat<
        Instance<FooComponent | BarComponent>,
        Readonly<{ foo: { getFoo: () => number } }> | Readonly<{ bar: { getBar: () => string } }>
      >
    >();
  });
});

describe("MixedInstance", () => {
  it("returns a mixed instance type of the components", () => {
    type FooComponent = Component<"foo", { getFoo: () => number }>;
    type BarComponent = Component<"bar", { getBar: () => string }>;
    type BazComponent = Component<"baz", { getBaz: () => boolean }>;
    assertType<
      Compat<
        MixedInstance<[FooComponent, BarComponent, BazComponent]>,
        Readonly<{
          foo: { getFoo: () => number };
          bar: { getBar: () => string };
          baz: { getBaz: () => boolean };
        }>
      >
    >();

    type Bar2Component = Component<"bar", { getBar2: () => bigint }>;
    assertType<
      Compat<
        MixedInstance<[FooComponent, BarComponent, BazComponent, Bar2Component]>,
        Readonly<{
          foo: { getFoo: () => number };
          bar: { getBar2: () => bigint };
          baz: { getBaz: () => boolean };
        }>
      >
    >();
  });

  it("distibutes over union members", () => {
    type FooComponent = Component<"foo", { getFoo: () => number }>;
    type BarComponent = Component<"bar", { getBar: () => string }>;
    type BazComponent = Component<"baz", { getBaz: () => boolean }>;
    assertType<
      Compat<
        MixedInstance<[FooComponent, BarComponent] | [BazComponent]>,
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
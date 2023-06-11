import type { Equals } from "./__tests__/types";
import { assertType } from "./__tests__/types";
import type { Component, Instance, MixedInstance } from "./component";

describe("Instance", () => {
  it("returns an object type with a property whose name is the component name and whose type is the component type", () => {
    type FooComponent = Component<"foo", { getFoo: () => number }>;
    assertType<Equals<Instance<FooComponent>, Readonly<{ foo: { getFoo: () => number } }>>>();
  });

  it("returns an empty object type if the component name is not a singleton string", () => {
    type Xxx1Component = Component<never, { getXxx: () => number }>;
    assertType<Equals<Instance<Xxx1Component>, {}>>();

    type Xxx2Component = Component<"xxx" | "yyy", { getXxx: () => number }>;
    assertType<Equals<Instance<Xxx2Component>, {}>>();

    type Xxx3Component = Component<string, { getXxx: () => number }>;
    assertType<Equals<Instance<Xxx3Component>, {}>>();

    type Xxx4Component = Component<`x-${string}`, { getXxx: () => number }>;
    assertType<Equals<Instance<Xxx4Component>, {}>>();
  });

  it("distributes over union members", () => {
    type FooComponent = Component<"foo", { getFoo: () => number }>;
    type BarComponent = Component<"bar", { getBar: () => string }>;
    assertType<
      Equals<
        Instance<FooComponent | BarComponent>,
        Readonly<{ foo: { getFoo: () => number } }> | Readonly<{ bar: { getBar: () => string } }>
      >
    >();
  });
});

describe("MixedInstance", () => {
  it("returns a mixed instance type of the components", () => {
    assertType<Equals<MixedInstance<[]>, {}>>();

    type FooComponent = Component<"foo", { getFoo: () => number }>;
    type BarComponent = Component<"bar", { getBar: () => string }>;
    type BazComponent = Component<"baz", { getBaz: () => boolean }>;
    assertType<
      Equals<
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
      Equals<
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
      Equals<
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

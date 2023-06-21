import type { Equals } from "./__tests__/types";
import { assertType } from "./__tests__/types";
import type { Component, Instance, Mixed } from "./component";

describe("Instance", () => {
  it("returns an object type with a property whose name is the component name and whose type is the component type", () => {
    type FooComponent = Component<"foo", { getFoo: () => number }>;
    assertType<Equals<Instance<FooComponent>, Readonly<{ foo: { getFoo: () => number } }>>>();
  });

  it("returns the union type of object types if the component name is a union string", () => {
    type XxxComponent = Component<never, { getXxx: () => number }>;
    assertType<Equals<Instance<XxxComponent>, never>>();

    type FooComponent = Component<"foo1" | "foo2", { getFoo: () => number }>;
    assertType<
      Equals<
        Instance<FooComponent>,
        Readonly<{ foo1: { getFoo: () => number } }> | Readonly<{ foo2: { getFoo: () => number } }>
      >
    >();
  });

  it("returns an object type with an optional index signature if the component name is not of a finite string type", () => {
    type XxxComponent = Component<string, { getXxx: () => number }>;
    assertType<
      Equals<
        Instance<XxxComponent>,
        Readonly<{ [key: string]: { getXxx: () => number } | undefined }>
      >
    >();

    type YyyComponent = Component<`x-${string}`, { getYyy: () => number }>;
    assertType<
      Equals<
        Instance<YyyComponent>,
        Readonly<{ [key: `x-${string}`]: { getYyy: () => number } | undefined }>
      >
    >();
  });

  it("distributes over union members", () => {
    assertType<Equals<Instance<never>, never>>();

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

describe("Mixed", () => {
  it("returns a mixed instance type of the components", () => {
    assertType<Equals<Mixed<[]>, {}>>();

    type FooComponent = Component<"foo", { getFoo: () => number }>;
    type BarComponent = Component<"bar", { getBar: () => string }>;
    type BazComponent = Component<"baz", { getBaz: () => boolean }>;
    assertType<
      Equals<
        Mixed<[FooComponent, BarComponent, BazComponent]>,
        Readonly<{
          foo: { getFoo: () => number };
          bar: { getBar: () => string };
          baz: { getBaz: () => boolean };
        }>
      >
    >();
  });

  it("overrides previously declared component instances", () => {
    type FooComponent = Component<"foo", { getFoo: () => number }>;
    type BarComponent = Component<"bar", { getBar: () => string }>;
    type BazComponent = Component<"baz", { getBaz: () => boolean }>;
    type Bar2Component = Component<"bar", { getBar2: () => bigint }>;
    assertType<
      Equals<
        Mixed<[FooComponent, BarComponent, BazComponent, Bar2Component]>,
        Readonly<{
          foo: { getFoo: () => number };
          bar: { getBar2: () => bigint };
          baz: { getBaz: () => boolean };
        }>
      >
    >();
  });

  it("erases all matching component instances before a component with an infinite name", () => {
    type FooComponent = Component<"foo", { getFoo: () => number }>;
    type BarComponent = Component<"bar", { getBar: () => string }>;
    type BazComponent = Component<"x-baz", { getBaz: () => boolean }>;
    type QuxComponent = Component<"qux", { getQux: () => bigint }>;
    type XxxComponent = Component<string, { getXxx: () => number }>;
    type YyyComponent = Component<`x-${string}`, { getYyy: () => number }>;
    assertType<
      Equals<
        Mixed<[FooComponent, XxxComponent, BarComponent, BazComponent, YyyComponent, QuxComponent]>,
        Readonly<{
          bar: { getBar: () => string };
          qux: { getQux: () => bigint };
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
        Mixed<[FooComponent, BarComponent] | [BazComponent]>,
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

import type { Equals } from "./__tests__/types";
import { assertType } from "./__tests__/types";
import type { Prod, Merge, IsFiniteString, OrElse, Wrap } from "./utils";

describe("IsFiniteString", () => {
  it("returns true if and only if the type has a finite number of inhabitants", () => {
    assertType<Equals<IsFiniteString<never>, true>>();

    assertType<Equals<IsFiniteString<"foo">, true>>();
    assertType<Equals<IsFiniteString<"foo" | "bar">, true>>();

    assertType<Equals<IsFiniteString<string>, false>>();

    assertType<Equals<IsFiniteString<`x-${string}`>, false>>();
    assertType<Equals<IsFiniteString<`x-${number}`>, false>>();
    assertType<Equals<IsFiniteString<`x-${bigint}`>, false>>();
    assertType<Equals<IsFiniteString<`x-${boolean}`>, true>>();

    assertType<Equals<IsFiniteString<"foo" | `x-${string}`>, false>>();
    assertType<Equals<IsFiniteString<"foo" | `x-${number}`>, false>>();
    assertType<Equals<IsFiniteString<"foo" | `x-${bigint}`>, false>>();
    assertType<Equals<IsFiniteString<"foo" | `x-${boolean}`>, true>>();
  });
});

describe("Prod", () => {
  it("returns the product type of the given tuple type", () => {
    assertType<Equals<Prod<[]>, unknown>>();
    assertType<Equals<Prod<[{ foo: "foo" }, { bar: "bar" }]>, { foo: "foo" } & { bar: "bar" }>>();
    assertType<
      Equals<
        Prod<[{ foo: "foo" } | { bar: "bar" }, { baz: "baz" }]>,
        ({ foo: "foo" } | { bar: "bar" }) & { baz: "baz" }
      >
    >();
    assertType<
      Equals<
        Prod<[{ foo: "foo" }, { bar: "bar" } | { baz: "baz" }]>,
        { foo: "foo" } & ({ bar: "bar" } | { baz: "baz" })
      >
    >();
  });

  it("distributes over union members", () => {
    assertType<Equals<Prod<never>, never>>();
    assertType<
      Equals<
        Prod<[{ foo: "foo" }, { bar: "bar" }] | [{ baz: "baz" }, { qux: "qux" }]>,
        ({ foo: "foo" } & { bar: "bar" }) | ({ baz: "baz" } & { qux: "qux" })
      >
    >();
  });
});

describe("Merge", () => {
  it("merges an intersection type into a sinlge type", () => {
    assertType<Equals<Merge<{}>, {}>>();
    assertType<Equals<Merge<{ foo: "foo" } & { bar: "bar" }>, { foo: "foo"; bar: "bar" }>>();
  });

  it("keeps the original property modifiers", () => {
    assertType<
      Equals<Merge<{ readonly foo: "foo" } & { bar?: "bar" }>, { readonly foo: "foo"; bar?: "bar" }>
    >();
  });

  it("distributes over union members", () => {
    assertType<Equals<Merge<never>, never>>();
    assertType<
      Equals<
        Merge<({ foo: "foo" } & { bar: "bar" }) | ({ baz: "baz" } & { qux: "qux" })>,
        { foo: "foo"; bar: "bar" } | { baz: "baz"; qux: "qux" }
      >
    >();
  });
});

describe("OrElse", () => {
  it("returns the first type if it is not `never`; otherwise, returns the second type", () => {
    assertType<Equals<OrElse<never, "xxx">, "xxx">>();
    assertType<Equals<OrElse<"foo", "xxx">, "foo">>();
    assertType<Equals<OrElse<"foo" | "bar", "xxx">, "foo" | "bar">>();
  });
});

describe("Wrap", () => {
  it("returns the type wrapped in a tupple if it is not `never`; otherwise, returns `never`", () => {
    assertType<Equals<Wrap<never>, never>>();
    assertType<Equals<Wrap<"foo">, ["foo"]>>();
    assertType<Equals<Wrap<"foo" | "bar">, ["foo" | "bar"]>>();
  });
});

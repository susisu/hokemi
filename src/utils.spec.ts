import { describe, it, assertType } from "vitest";
import type { Equals } from "./__tests__/types";
import type { AsString, IsFiniteString, Merge, OrElse, Prod, Wrap } from "./utils";

describe("IsFiniteString", () => {
  it("returns true if and only if the type has a finite number of inhabitants", () => {
    assertType<Equals<IsFiniteString<never>, true>>(true);

    assertType<Equals<IsFiniteString<"foo">, true>>(true);
    assertType<Equals<IsFiniteString<"foo" | "bar">, true>>(true);

    assertType<Equals<IsFiniteString<string>, false>>(true);

    assertType<Equals<IsFiniteString<`x-${string}`>, false>>(true);
    assertType<Equals<IsFiniteString<`x-${number}`>, false>>(true);
    assertType<Equals<IsFiniteString<`x-${bigint}`>, false>>(true);
    assertType<Equals<IsFiniteString<`x-${boolean}`>, true>>(true);

    assertType<Equals<IsFiniteString<"foo" | `x-${string}`>, false>>(true);
    assertType<Equals<IsFiniteString<"foo" | `x-${number}`>, false>>(true);
    assertType<Equals<IsFiniteString<"foo" | `x-${bigint}`>, false>>(true);
    assertType<Equals<IsFiniteString<"foo" | `x-${boolean}`>, true>>(true);
  });
});

describe("AsString", () => {
  it("removes non-string components of a type", () => {
    assertType<Equals<AsString<never>, never>>(true);
    assertType<Equals<AsString<string | number>, string>>(true);
    assertType<Equals<AsString<"foo" | "bar" | 42>, "foo" | "bar">>(true);
  });
});

describe("Prod", () => {
  it("returns the product type of the given tuple type", () => {
    assertType<Equals<Prod<[]>, unknown>>(true);
    assertType<Equals<Prod<[{ foo: "foo" }, { bar: "bar" }]>, { foo: "foo" } & { bar: "bar" }>>(
      true
    );
    assertType<
      Equals<
        Prod<[{ foo: "foo" } | { bar: "bar" }, { baz: "baz" }]>,
        ({ foo: "foo" } | { bar: "bar" }) & { baz: "baz" }
      >
    >(true);
    assertType<
      Equals<
        Prod<[{ foo: "foo" }, { bar: "bar" } | { baz: "baz" }]>,
        { foo: "foo" } & ({ bar: "bar" } | { baz: "baz" })
      >
    >(true);
  });

  it("distributes over union members", () => {
    assertType<Equals<Prod<never>, never>>(true);
    assertType<
      Equals<
        Prod<[{ foo: "foo" }, { bar: "bar" }] | [{ baz: "baz" }, { qux: "qux" }]>,
        ({ foo: "foo" } & { bar: "bar" }) | ({ baz: "baz" } & { qux: "qux" })
      >
    >(true);
  });
});

describe("Merge", () => {
  it("merges an intersection type into a sinlge type", () => {
    assertType<Equals<Merge<{}>, {}>>(true);
    assertType<Equals<Merge<{ foo: "foo" } & { bar: "bar" }>, { foo: "foo"; bar: "bar" }>>(true);
  });

  it("keeps the original property modifiers", () => {
    assertType<
      Equals<Merge<{ readonly foo: "foo" } & { bar?: "bar" }>, { readonly foo: "foo"; bar?: "bar" }>
    >(true);
  });

  it("distributes over union members", () => {
    assertType<Equals<Merge<never>, never>>(true);
    assertType<
      Equals<
        Merge<({ foo: "foo" } & { bar: "bar" }) | ({ baz: "baz" } & { qux: "qux" })>,
        { foo: "foo"; bar: "bar" } | { baz: "baz"; qux: "qux" }
      >
    >(true);
  });
});

describe("OrElse", () => {
  it("returns the first type if it is not `never`; otherwise, returns the second type", () => {
    assertType<Equals<OrElse<never, "xxx">, "xxx">>(true);
    assertType<Equals<OrElse<"foo", "xxx">, "foo">>(true);
    assertType<Equals<OrElse<"foo" | "bar", "xxx">, "foo" | "bar">>(true);
  });
});

describe("Wrap", () => {
  it("returns the type wrapped in a tupple if it is not `never`; otherwise, returns `never`", () => {
    assertType<Equals<Wrap<never>, never>>(true);
    assertType<Equals<Wrap<"foo">, ["foo"]>>(true);
    assertType<Equals<Wrap<"foo" | "bar">, ["foo" | "bar"]>>(true);
  });
});

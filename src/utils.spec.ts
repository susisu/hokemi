import type { Equals } from "./__tests__/types";
import { assertType } from "./__tests__/types";
import type { Extend, IsFiniteString, IsSingleton, OrElse, Wrap } from "./utils";

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

describe("IsSingleton", () => {
  it("returns true if and only if the type has only one union member", () => {
    assertType<Equals<IsSingleton<never>, false>>();

    assertType<Equals<IsSingleton<"foo">, true>>();
    assertType<Equals<IsSingleton<"foo" | "bar">, false>>();

    assertType<Equals<IsSingleton<string>, true>>();

    assertType<Equals<IsSingleton<`x-${boolean}`>, false>>();
  });
});

describe("Extend", () => {
  it("returns a merged object type of the two object types; common members are overrided by the latter", () => {
    assertType<Equals<Extend<{}, {}>, {}>>();
    assertType<Equals<Extend<{ foo: "foo" }, { bar: "bar" }>, { foo: "foo"; bar: "bar" }>>();
    assertType<
      Equals<
        Extend<{ foo: "foo"; xxx: "xxx-1" }, { bar: "bar"; xxx: "xxx-2" }>,
        { foo: "foo"; bar: "bar"; xxx: "xxx-2" }
      >
    >();
  });

  it("keeps the original property modifiers", () => {
    assertType<
      Equals<Extend<{ readonly foo: "foo" }, { bar?: "bar" }>, { readonly foo: "foo"; bar?: "bar" }>
    >();
  });

  it("distributes over union members", () => {
    assertType<
      Equals<
        Extend<
          { foo: "foo"; xxx: "xxx-1" } | { bar: "bar"; xxx: "xxx-2" },
          { baz: "baz"; xxx: "xxx-3" }
        >,
        { foo: "foo"; baz: "baz"; xxx: "xxx-3" } | { bar: "bar"; baz: "baz"; xxx: "xxx-3" }
      >
    >();
    assertType<
      Equals<
        Extend<
          { foo: "foo"; xxx: "xxx-1" },
          { bar: "bar"; xxx: "xxx-2" } | { baz: "baz"; xxx: "xxx-3" }
        >,
        { foo: "foo"; bar: "bar"; xxx: "xxx-2" } | { foo: "foo"; baz: "baz"; xxx: "xxx-3" }
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

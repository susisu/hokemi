export type IsFiniteString<S extends string> = _IsFiniteString<S> extends true ? true : false;
// prettier-ignore
type _IsFiniteString<S extends string> =
    string extends S ? false
  : S extends "" ? true
  : S extends `${infer H}${infer R}` ? (
      string extends H ? false
    : `${number}` extends H ? false
    : `${bigint}` extends H ? false
    : _IsFiniteString<R>
  )
  : never;

export type AsString<T> = T extends string ? T : never;

export type Prod<Xs extends unknown[]> = Xs extends unknown
  ? { [K in keyof Xs]: (x: Xs[K]) => unknown }[number] extends (x: infer P) => unknown
    ? P
    : never
  : never;

export type Merge<T> = { [K in keyof T]: T[K] };

export type OrElse<T, E> = [T] extends [never] ? E : T;

export type Wrap<T> = [T] extends [never] ? never : [T];

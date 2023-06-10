// prettier-ignore
export type IsFiniteString<S extends string> =
    string extends S ? false
  : S extends "" ? true
  : S extends `${infer H}${infer R}` ? (
      string extends H ? false
    : `${number}` extends H ? false
    : `${bigint}` extends H ? false
    : IsFiniteString<R>
  )
  : never;

export type IsSingleton<T> = _IsSingleton<T, T>;
type _IsSingleton<T, U> = T extends unknown ? ([U] extends [T] ? true : false) : false;

export type OrElse<T, E> = [T] extends [never] ? E : T;

export type Wrap<T> = [T] extends [never] ? never : [T];

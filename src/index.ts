const componentType = Symbol("hokemi.type.Component");

export type Component<N extends string, T extends unknown> = {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  __type: typeof componentType;
  name: N;
  type: T;
};

type AbstractComponent = Component<string, unknown>;

type Instance<C extends AbstractComponent> = C extends Component<infer N, infer T>
  ? _Instance<N, T>
  : never;
type _Instance<N extends string, T extends unknown> = IsFiniteString<N> extends true
  ? IsSingleton<N> extends true
    ? { readonly [N0 in N]: T }
    : {}
  : {};
// prettier-ignore
type IsFiniteString<S extends string> =
    string extends S ? false
  : S extends "" ? true
  : S extends `${infer H}${infer R}` ? (
      string extends H ? false
    : `${number}` extends H ? false
    : `${bigint}` extends H ? false
    : IsFiniteString<R>
  )
  : never;
type IsSingleton<T> = _IsSingleton<T, T>;
type _IsSingleton<T, U> = T extends unknown ? ([U] extends [T] ? true : false) : false;

type ComposedInstance<Cs extends AbstractComponent[]> = Cs extends unknown
  ? {
      [K in keyof Cs]: (x: Instance<Cs[K]>) => unknown;
    }[number] extends (x: infer A) => unknown
    ? A
    : never
  : never;

const providerType = Symbol("hokemi.type.Provider");

type Provider<N extends string, T extends unknown, D extends unknown> = Readonly<{
  // eslint-disable-next-line @typescript-eslint/naming-convention
  __type: typeof providerType;
  name: N;
  factory: (deps: D) => T;
}>;

type AbstractProvider = Provider<string, unknown, never>;

export type Impl<
  C extends AbstractComponent,
  Ds extends AbstractComponent[] = []
> = C extends Component<infer N, infer T> ? Provider<N, T, ComposedInstance<Ds>> : never;

type ImplArgs<C extends AbstractComponent, Ds extends AbstractComponent[] = []> = _ImplArgs<
  Impl<C, Ds>
>;
type _ImplArgs<P extends AbstractProvider> = P extends Provider<infer N, infer T, infer D>
  ? [name: N, factory: (deps: D) => T]
  : never;

export function impl<C extends AbstractComponent, Ds extends AbstractComponent[] = []>(
  ...[name, factory]: ImplArgs<C, Ds>
): Impl<C, Ds> {
  const provider: AbstractProvider = {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    __type: providerType,
    name,
    factory,
  };
  // ImplArgs<C, Ds> and Impl<C, Ds> always have the same shape, so it's safe to cast.
  // eslint-disable-next-line @susisu/safe-typescript/no-type-assertion
  return provider as Impl<C, Ds>;
}

export type Mixer<Ps extends AbstractProvider[]> = Readonly<{
  mix: MixFunction<Ps>;
  make: MakeFunction<Ps>;
}>;

type MixFunction<Ps extends AbstractProvider[]> = <Gs extends AbstractProvider[]>(
  ...factories: Gs
) => Mixer<[...Ps, ...Gs]>;

type MakeFunction<Ps extends AbstractProvider[]> = MakeError<Ps> extends never
  ? () => MixedInstance<Ps>
  : MakeError<Ps>;

type MixedInstance<Ps extends AbstractProvider[]> = ComposedInstance<{
  [K in keyof Ps]: ReconstructComponent<Ps[K]>;
}>;
type ReconstructComponent<P extends AbstractProvider> = P extends Provider<infer N, infer T, never>
  ? Component<N, T>
  : never;

type MakeError<Ps extends AbstractProvider[]> = {
  [K in keyof Ps]: DependencyError<Ps[K], Ps>;
}[number];

const dependencyError = Symbol("hokemi.error.dependencyError");

type DependencyError<
  P extends AbstractProvider,
  Ps extends AbstractProvider[]
> = MixedInstance<Ps> extends Dependencies<P>
  ? never
  : {
      [dependencyError]: {
        reason: "missing dependencies";
        requiredBy: P["name"];
        dependencyNames: MissingDependencyNames<Dependencies<P>, MixedInstance<Ps>>;
      };
    };
type Dependencies<P extends AbstractProvider> = P extends Provider<string, unknown, infer D>
  ? D
  : never;
type MissingDependencyNames<D extends unknown, T extends unknown> = D extends unknown
  ? [Exclude<keyof D, keyof T>]
  : never;

export function mixer<Ps extends AbstractProvider[]>(...providers: Ps): Mixer<Ps> {
  const mix: MixFunction<Ps> = (...args) => mixer(...providers, ...args);

  // eslint-disable-next-line @susisu/safe-typescript/no-type-assertion
  const make: MakeFunction<Ps> = (() => {
    const app = {};
    const components: Array<Readonly<{ name: string; value: unknown }>> = [];
    for (const provider of providers) {
      components.push({
        name: provider.name,
        // eslint-disable-next-line @susisu/safe-typescript/no-type-assertion
        value: provider.factory(app as never),
      });
    }
    for (const component of components) {
      Object.defineProperty(app, component.name, {
        value: component.value,
        configurable: true,
        enumerable: true,
        writable: true,
      });
    }
    return app;
  }) as MakeFunction<Ps>;

  return { mix, make };
}

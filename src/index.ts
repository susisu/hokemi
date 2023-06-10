const componentType = Symbol("hokemi.type.Component");

export type Component<N extends string, T extends unknown> = {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  __type: typeof componentType;
  name: N;
  type: T;
};

export type AbstractComponent = Component<string, unknown>;

export type Instance<C extends AbstractComponent> = C extends Component<infer N, infer T>
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

export type MixedInstance<Cs extends AbstractComponent[]> = Cs extends unknown
  ? {
      [K in keyof Cs]: (x: Instance<Cs[K]>) => unknown;
    }[number] extends (x: infer A) => unknown
    ? A
    : never
  : never;

const providerType = Symbol("hokemi.type.Provider");

export type Provider<N extends string, T extends unknown, D extends unknown> = Readonly<{
  // eslint-disable-next-line @typescript-eslint/naming-convention
  __type: typeof providerType;
  name: N;
  factory: (deps: D) => T;
}>;

export type AbstractProvider = Provider<string, unknown, never>;

export type MixedProvidedInstance<Ps extends AbstractProvider[]> = MixedInstance<{
  [K in keyof Ps]: ReconstructComponent<Ps[K]>;
}>;
type ReconstructComponent<P extends AbstractProvider> = P extends Provider<infer N, infer T, never>
  ? Component<N, T>
  : never;

type Dependencies<P extends AbstractProvider> = P extends Provider<string, unknown, infer D>
  ? D
  : never;

export type Impl<
  C extends AbstractComponent,
  Ds extends AbstractComponent[] = []
> = C extends Component<infer N, infer T> ? Provider<N, T, MixedInstance<Ds>> : never;

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
  mix: MixerMix<Ps>;
  make: MixerMake<Ps>;
}>;

type MixerMix<Ps extends AbstractProvider[]> = <Gs extends AbstractProvider[]>(
  ...factories: Gs
) => Mixer<[...Ps, ...Gs]>;

type MixerMake<Ps extends AbstractProvider[]> = MixerError<Ps> extends never
  ? () => MixedProvidedInstance<Ps>
  : MixerError<Ps>;

type MixerError<Ps extends AbstractProvider[]> = {
  [K in keyof Ps]: PerProviderError<Ps[K], Ps>;
}[number];

const unknownError = Symbol("hokemi.error.Unknown");
type UnknownError<E extends unknown> = {
  [unknownError]: E;
};

type PerProviderError<
  P extends AbstractProvider,
  Ps extends AbstractProvider[]
> = MixedProvidedInstance<Ps> extends Dependencies<P>
  ? never
  : OrElse<
      MissingDependenciesError<P, Ps> | IncompatibleDependenciesError<P, Ps>,
      UnknownError<{
        reason: "dependency error (details unknown; please report an issue)";
        providerName: P["name"];
      }>
    >;
type OrElse<T, E> = [T] extends [never] ? E : T;

const missingDependenciesError = Symbol("hokemi.error.MissingDependencies");
type MissingDependenciesError<
  P extends AbstractProvider,
  Ps extends AbstractProvider[]
> = MissingDependencyNames<P, Ps> extends never
  ? never
  : {
      [missingDependenciesError]: {
        reason: "some dependencies are missing";
        providerName: P["name"];
        dependencyNames: MissingDependencyNames<P, Ps>;
      };
    };
type MissingDependencyNames<
  P extends AbstractProvider,
  Ps extends AbstractProvider[]
> = _MissingDependencyNames<Dependencies<P>, MixedProvidedInstance<Ps>>;
type _MissingDependencyNames<D extends unknown, I extends unknown> = D extends unknown
  ? Wrap<Exclude<keyof D, keyof I>>
  : never;

const incompatibleDependenciesError = Symbol("hokemi.error.IncompatibleDependencies");
type IncompatibleDependenciesError<
  P extends AbstractProvider,
  Ps extends AbstractProvider[]
> = IncompatibleDependencyNames<P, Ps> extends never
  ? never
  : {
      [incompatibleDependenciesError]: {
        reason: "some dependencies are incompatible";
        providerName: P["name"];
        dependencyNames: IncompatibleDependencyNames<P, Ps>;
      };
    };
type IncompatibleDependencyNames<
  P extends AbstractProvider,
  Ps extends AbstractProvider[]
> = _IncompatibleDependencyNames<Dependencies<P>, MixedProvidedInstance<Ps>>;
type _IncompatibleDependencyNames<D extends unknown, I extends unknown> = D extends unknown
  ? Wrap<{ [K in keyof D & keyof I]: I[K] extends D[K] ? never : K }[keyof D & keyof I]>
  : never;

type Wrap<T> = [T] extends [never] ? never : [T];

export function mixer<Ps extends AbstractProvider[]>(...providers: Ps): Mixer<Ps> {
  const mix: MixerMix<Ps> = (...args) => mixer(...providers, ...args);

  // eslint-disable-next-line @susisu/safe-typescript/no-type-assertion
  const make: MixerMake<Ps> = (() => {
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
  }) as MixerMake<Ps>;

  return { mix, make };
}

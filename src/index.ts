const componentKind = Symbol("hokemi.kind.Component");

export type Component<N extends string, T extends unknown> = {
  kind: typeof componentKind;
  name: N;
  type: T;
};

type AbstractComponent = Component<string, unknown>;

type Instance<C extends AbstractComponent> = C extends Component<infer N, infer T>
  ? _Instance<N, T>
  : never;
type _Instance<N extends string, T extends unknown> = IsFiniteString<N> extends true
  ? N extends unknown
    ? { readonly [N0 in N]: T }
    : never
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

type ComposedInstance<Cs extends AbstractComponent[]> = Cs extends unknown
  ? {
      [K in keyof Cs]: (x: Instance<Cs[K]>) => unknown;
    }[number] extends (x: infer A) => unknown
    ? A
    : never
  : never;

const factoryType = Symbol("hokemi.type.Factory");

type Factory<N extends string, T extends unknown, D extends unknown> = Readonly<{
  type: typeof factoryType;
  name: N;
  func: (deps: D) => T;
}>;

type AbstractFactory = Factory<string, unknown, never>;

export type Impl<C extends AbstractComponent, Ds extends AbstractComponent[]> = C extends Component<
  infer N,
  infer T
>
  ? Factory<N, T, ComposedInstance<Ds>>
  : never;

type ImplArgs<C extends AbstractComponent, Ds extends AbstractComponent[]> = _ImplArgs<Impl<C, Ds>>;
type _ImplArgs<F extends AbstractFactory> = F extends Factory<infer N, infer T, infer D>
  ? [name: N, func: (deps: D) => T]
  : never;

export function impl<C extends AbstractComponent, Ds extends AbstractComponent[]>(
  ...[name, func]: ImplArgs<C, Ds>
): Impl<C, Ds> {
  const factory: AbstractFactory = {
    type: factoryType,
    name,
    func,
  };
  // ImplArgs<C, Ds> and Impl<C, Ds> always have the same shape, so it's safe to cast.
  // eslint-disable-next-line @susisu/safe-typescript/no-type-assertion
  return factory as Impl<C, Ds>;
}

export type Mixer<Fs extends AbstractFactory[]> = Readonly<{
  mix: MixFunction<Fs>;
  make: MakeFunction<Fs>;
}>;

type MixFunction<Fs extends AbstractFactory[]> = <Gs extends AbstractFactory[]>(
  ...args: Gs
) => Mixer<[...Fs, ...Gs]>;

type MakeFunction<Fs extends AbstractFactory[]> = MakeError<Fs> extends never
  ? () => MixedInstance<Fs>
  : MakeError<Fs>;

type MixedInstance<Fs extends AbstractFactory[]> = ComposedInstance<{
  [K in keyof Fs]: ReconstructComponent<Fs[K]>;
}>;
type ReconstructComponent<F extends AbstractFactory> = F extends Factory<infer N, infer T, never>
  ? Component<N, T>
  : never;

type MakeError<Fs extends AbstractFactory[]> = {
  [K in keyof Fs]: DependencyError<Fs[K], Fs>;
}[number];

const dependencyError = Symbol("hokemi.error.dependencyError");

type DependencyError<
  F extends AbstractFactory,
  Fs extends AbstractFactory[]
> = MixedInstance<Fs> extends Dependencies<F>
  ? never
  : {
      [dependencyError]: {
        reason: `missing dependencies`;
        requiredBy: F["name"];
        dependencyNames: MissingDependencyNames<Dependencies<F>, MixedInstance<Fs>>;
      };
    };
type Dependencies<F extends AbstractFactory> = F extends Factory<string, unknown, infer D>
  ? D
  : never;
type MissingDependencyNames<D extends unknown, T extends unknown> = D extends unknown
  ? [Exclude<keyof D, keyof T>]
  : never;

export function mixer<Fs extends AbstractFactory[]>(...factories: Fs): Mixer<Fs> {
  const mix: MixFunction<Fs> = (...args) => mixer(...factories, ...args);

  // eslint-disable-next-line @susisu/safe-typescript/no-type-assertion
  const make: MakeFunction<Fs> = (() => {
    const app = {};
    const components: Array<Readonly<{ name: string; value: unknown }>> = [];
    for (const factory of factories) {
      components.push({
        name: factory.name,
        // eslint-disable-next-line @susisu/safe-typescript/no-type-assertion
        value: factory.func(app as never),
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
  }) as MakeFunction<Fs>;

  return { mix, make };
}

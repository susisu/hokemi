import type {
  AbstractProvider,
  ProviderDependencies,
  ProviderName,
  MixedProvidedInstance,
} from "./provider";
import { invokecFactory } from "./provider";
import type { OrElse, Wrap } from "./utils";

/**
 * `Mixer<Ps>` represents a mixer object.
 * @param Ps A list of providers to be mixed.
 */
export type Mixer<Ps extends AbstractProvider[]> = Readonly<{
  /**
   * Extends the mixer with more providers.
   * @params providers Additional providers to be mixed.
   * @returns An extended mixer object.
   */
  with: MixerMethodWith<Ps>;
  /**
   * Creates a new mixed instance.
   * @returns A mixed instance.
   */
  new: MixerMethodNew<Ps>;
}>;

type MixerMethodWith<Ps extends AbstractProvider[]> = <Qs extends AbstractProvider[]>(
  ...providers: Qs
) => Mixer<[...Ps, ...Qs]>;

type MixerMethodNew<Ps extends AbstractProvider[]> = MixerError<Ps> extends never
  ? () => MixedProvidedInstance<Ps>
  : MixerError<Ps>;

type MixerError<Ps extends AbstractProvider[]> = {
  [K in keyof Ps]: PerProviderError<Ps[K], Ps>;
}[number];

type PerProviderError<
  P extends AbstractProvider,
  Ps extends AbstractProvider[],
> = MixedProvidedInstance<Ps> extends ProviderDependencies<P>
  ? never
  : OrElse<
      MissingDependenciesError<P, Ps> | IncompatibleDependenciesError<P, Ps>,
      UnknownError<{
        reason: "unknown dependency error (this is likely a bug; please file an issue)";
        providerName: ProviderName<P>;
      }>
    >;

type UnknownError<E extends unknown> = {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  __unknownError?: E;
};

type MissingDependenciesError<
  P extends AbstractProvider,
  Ps extends AbstractProvider[],
> = MissingDependencies<P, Ps> extends never
  ? never
  : {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      __missingDependenciesError?: {
        reason: "some dependencies are missing";
        providerName: ProviderName<P>;
        dependencies: MissingDependencies<P, Ps>;
      };
    };
type MissingDependencies<
  P extends AbstractProvider,
  Ps extends AbstractProvider[],
> = _MissingDependencies<ProviderDependencies<P>, MixedProvidedInstance<Ps>>;
type _MissingDependencies<D extends unknown, I extends unknown> = D extends unknown
  ? Wrap<
      {
        [N in keyof D]: N extends keyof I
          ? never
          : {
              name: N;
              expectedType: D[N];
            };
      }[keyof D]
    >
  : never;

type IncompatibleDependenciesError<
  P extends AbstractProvider,
  Ps extends AbstractProvider[],
> = IncompatibleDependencies<P, Ps> extends never
  ? never
  : {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      __incompatibleDependenciesError?: {
        reason: "some dependencies are incompatible";
        providerName: ProviderName<P>;
        dependencies: IncompatibleDependencies<P, Ps>;
      };
    };
type IncompatibleDependencies<
  P extends AbstractProvider,
  Ps extends AbstractProvider[],
> = _IncompatibleDependencies<ProviderDependencies<P>, MixedProvidedInstance<Ps>>;
type _IncompatibleDependencies<D extends unknown, I extends unknown> = D extends unknown
  ? Wrap<
      {
        [N in keyof D & keyof I]: I[N] extends D[N]
          ? never
          : {
              name: N;
              expectedType: D[N];
              actualType: I[N];
            };
      }[keyof D & keyof I]
    >
  : never;

/**
 * Creates a new mixer object.
 * @param providers Providers to be mixed.
 * @returns A mixer object.
 */
export function mixer<Ps extends AbstractProvider[]>(...providers: Ps): Mixer<Ps> {
  return {
    with: (...otherProviders) => mixer(...providers, ...otherProviders),
    // eslint-disable-next-line @susisu/safe-typescript/no-type-assertion
    new: (() => {
      const mixed = {};

      const instances = new Map<string, unknown>();
      const getters = new Map<string, () => unknown>();
      const lock = new Set<string>();

      for (const { name, factory } of providers) {
        const getter = (): unknown => {
          if (instances.has(name)) {
            return instances.get(name);
          }
          if (lock.has(name)) {
            throw new Error(`'${name}' is referenced during its initialization`);
          }
          lock.add(name);
          // eslint-disable-next-line @susisu/safe-typescript/no-type-assertion
          const value = invokecFactory(factory, mixed as never);
          lock.delete(name);
          instances.set(name, value);
          return value;
        };
        getters.set(name, getter);
        Object.defineProperty(mixed, name, {
          get: getter,
          configurable: true,
          enumerable: true,
        });
      }

      // instantiate all the components
      for (const getter of getters.values()) {
        getter();
      }

      return mixed;
    }) as MixerMethodNew<Ps>,
  };
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function assertType<_T extends true>(): void {}

export type Equals<T, U> = (<X>() => X extends T ? 1 : 2) extends <X>() => X extends U ? 1 : 2
  ? true
  : false;

export type Compat<T, U> = [T] extends [U] ? ([U] extends [T] ? true : false) : false;

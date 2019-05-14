import { of, timer } from 'rxjs';
import { delay, takeUntil, tap } from 'rxjs/operators';

// datasource observable
const data$ = of('foo').pipe(
  tap(() => console.log(`request started`)),
  delay(500),
  tap(() => console.log(`request finished`))
);

// stop observable
const stop$ = timer(250);

// subscription #1
data$.subscribe({
  complete: () => console.log(`subscription #1 completed`)
});

// subscription #2
data$.pipe(takeUntil(stop$)).subscribe({
  complete: () => console.log(`subscription #2 completed`)
});

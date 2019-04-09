import { of } from 'rxjs';
import { delay, takeUntil, tap } from 'rxjs/operators';

// datasource observable
const data$ = of('foo').pipe(
  tap(() => console.log(`request started`)),
  delay(500),
  tap(() => console.log(`request finished`))
);

// stop observable
const stop$ = of(true).pipe(delay(250));

// subscription #1
data$.subscribe();

// subscription #2
data$.pipe(takeUntil(stop$)).subscribe();

import { from, of, throwError, timer } from 'rxjs';
import { delayWhen, flatMap, retryWhen, tap } from 'rxjs/operators';

// observable
const range$ = from([0, 1, 2, 'foo']).pipe(
  flatMap(value =>
    typeof value !== 'number'
      ? throwError(`Value "${value}" is not a valid number.`)
      : of(value)
  )
);

// subscription
range$
  .pipe(
    retryWhen(error =>
      error.pipe(
        tap(error => console.error(`${error}. Retrying in 3s...`)),
        delayWhen(() => timer(3000))
      )
    )
  )
  .subscribe();

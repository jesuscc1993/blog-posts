import { from, of, throwError } from 'rxjs';
import { catchError, flatMap, retry, tap } from 'rxjs/operators';

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
    retry(3),
    tap(
      val => console.log(val),
      () => console.debug(`Ran out of retry attempts.`)
    ),
    catchError(error => of(console.error(error)))
  )
  .subscribe();

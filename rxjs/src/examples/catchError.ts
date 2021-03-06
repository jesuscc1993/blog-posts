import { of, throwError } from 'rxjs';
import { catchError, flatMap, tap } from 'rxjs/operators';

// observable
const data$ = of([0, 1, 2, 3, undefined, 5]).pipe(
  flatMap(value =>
    typeof value.includes(undefined)
      ? throwError(`Items cannot be empty.`)
      : of(value)
  )
);

// subscription
data$
  .pipe(
    catchError(error => {
      console.error(error);
      return of([]); // [] is here the fallback value
    }),
    tap(val => console.log(val))
  )
  .subscribe();

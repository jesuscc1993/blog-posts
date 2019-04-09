import { from, of } from 'rxjs';
import { concatMap, debounceTime, delay, distinctUntilChanged, filter, tap } from 'rxjs/operators';

const search = 'Lorem ipsum dolor sit amet';
const searches = [];
for (let i = 0; i <= search.length; i++) {
  searches.push(search.substr(0, i));
}

// observable
const search$ = from(searches).pipe(
  concatMap(search => of(search).pipe(delay(Math.random() * 500)))
);

// subscription
search$
  .pipe(
    debounceTime(500),
    distinctUntilChanged(),
    filter(search => search.length >= 3),
    tap(search => console.log(search))
  )
  .subscribe();

import { range } from 'rxjs';
import { filter, map, reduce, tap } from 'rxjs/operators';

// observable
const range$ = range(1, 10);

// subscription
range$
  .pipe(
    map(item => item * 10),
    filter(item => item % 20 === 0),
    reduce((accumulator, item) => accumulator + item),
    tap(sum => console.log(sum))
  )
  .subscribe();

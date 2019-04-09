import { of } from 'rxjs';
import { shareReplay, tap } from 'rxjs/operators';

// observable
const data$ = of('foo').pipe(
  tap(() => console.log(`data requested`)),
  shareReplay()
);

// subscription #1
data$
  .pipe(tap(item => console.log(`retrieved ${item} on subscription #1`)))
  .subscribe();

// subscription #2
data$
  .pipe(tap(item => console.log(`retrieved ${item} on subscription #2`)))
  .subscribe();

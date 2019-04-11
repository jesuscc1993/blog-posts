import { of } from 'rxjs';
import { flatMap, map, tap } from 'rxjs/operators';

// user observable
const user$ = of({
  id: 0,
  name: 'User #1',
  listIds: [0, 1]
});

// lists observable
const lists$ = of([
  {
    id: 0,
    name: 'List #1',
    itemIds: [0, 1]
  },
  {
    id: 1,
    name: 'List #2',
    itemIds: [2, 3]
  },
  {
    id: 3,
    name: 'List #3',
    itemIds: [5]
  }
]);

// items observable
const items$ = of([
  {
    id: 0,
    name: 'Item #1'
  },
  {
    id: 1,
    name: 'Item #2'
  },
  {
    id: 2,
    name: 'Item #3'
  },
  {
    id: 3,
    name: 'Item #4'
  },
  {
    id: 4,
    name: 'Item #5'
  }
]);

// subscription

// get current user
user$
  .pipe(
    flatMap(user =>
      // retrieve all lists
      lists$.pipe(
        // rebuild user, adding those lists they own
        map(lists => ({
          ...user,
          lists: lists.filter(list => user.listIds.includes(list.id))
        }))
      )
    ),
    flatMap(user =>
      // retrieve all items
      items$.pipe(
        // rebuild user, adding to each one of their lists those items they include
        map(items => ({
          ...user,
          lists: user.lists.map(list => ({
            ...list,
            items: items.filter(item => list.itemIds.includes(item.id))
          }))
        }))
      )
    ),
    tap(value => console.log(value))
  )
  .subscribe();

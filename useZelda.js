import { useReducer, useRef } from 'react'

export default function useZelda(_class) {
  const {current: entity} = useRef(typeof _class ? new _class() : _class);
  const [reducer, dispatch] = useReducer(function (prevState, action) {
    if (action.payload) {
      return action.payload;
    }
    return prevState;
  }, entity.state);

  const proxy = new Proxy(entity, {
    get (target, p, receiver) {
      if (p === 'state') {
        return new Proxy(target.state, {
          get (target, p, receiver) {
            return target[p];
          },
          set() {
            return false;
          }
        });
      }

      const source = target[p];
      if (typeof source === 'function') {
        return function(...args) {
          const result = source.apply(target, args);
          if (result === undefined) {
            return;
          }

          if (result && typeof result === 'object' && typeof result.then === 'function') {
            return result;
          }

          entity.state = result;
          dispatch({ payload: result });
        }
      }
    },
    set (target, p, value, receiver) {
      console.log('set', target, p, value, receiver);
      if (p === 'state') {
        return false;
      }

      target[p] = value;
      return true;
    }
  });

  return proxy;
}

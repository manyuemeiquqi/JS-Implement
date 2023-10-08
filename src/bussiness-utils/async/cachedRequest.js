// https://github.com/OBKoro1/web-basics/blob/main/src/scene/cacheApi.js
// 上锁 + 缓存
function cacheApi(fn) {
  const cachedMap = {};
  return function (...args) {
    const that = this;
    const uniqueKey = JSON.stringify(args);
    const cache = cachedMap[uniqueKey];
    if (cache) {
      if (cache.data) {
        if (cache.lock === false) {
          cache.lock = true;
          cache.p = fn.apply(that, args).then((res) => {
            cache.lock = false;
            cache.data = res;
          });
        }
        return cache.data;
      } else {
        return cache.p;
      }
    } else {
      cachedMap[uniqueKey] = {
        p: fn.apply(that, args),
        lock: true,
        data: null,
      };
      const cache = cachedMap[uniqueKey];
      cache.p.then((res) => {
        cache.lock = false;
        cache.data = res;
        return res;
      });
      return cache.p;
    }
  };
}

/**
 * mock api
 */
const mockApi = (() => {
  let id = 0;
  return async (req) => {
    await new Promise((r) => setTimeout(r, 1000));
    return {
      req,
      id: id++,
    };
  };
})();

/**
 * 缓存的接口
 */
const cachedApi = cacheApi(mockApi);

(async () => {
  console.log(
    "111",
    await Promise.all([cachedApi("a"), cachedApi("b"), cachedApi("a")]),
  );
  // 一秒钟后输出 [ { req: "a", id: 0 }, { req: "b", id: 1 }, { req: "a", id: 0 } ]

  console.log(
    await Promise.all([cachedApi("a"), cachedApi("b"), cachedApi("a")]),
  );
  // 马上输出 [ { req: "a", id: 0 }, { req: "b", id: 1 }, { req: "a", id: 0 } ]

  await new Promise((r) => setTimeout(r, 1000));
  console.log(
    await Promise.all([cachedApi("a"), cachedApi("b"), cachedApi("a")]),
  );
  // 马上输出 [ { req: "a", id: 2 }, { req: "b", id: 3 }, { req: "a", id: 2 } ]
})();

// 答案慎看

/**
 * 缓存异步接口
 * - 第一次请求缓存接口的时候，和调用原异步接口效果一样
 * - 缓存接口根据入参缓存原异步接口返回值
 * - 有缓存值的时候，马上返回缓存值，并发起请求更新缓存值
 * - 对于同样的入参，缓存接口同一时刻，最多只会发起一个请求
 * @param fn 原异步接口
 * @returns 缓存接口
 */
// function cacheApi(...args) {
//     // 补充代码实现
//     let map = {}
//     let list = []
//     let fn = args[0]
//     return async function help(key) {
//         // 同时只有一个接口，判断锁
//         if (map[key] && map[key].lock === true) {
//             // 接口已经有过值了 直接返回接口
//             if (map[key].data) {
//                 return map[key].data
//             } else {
//                 // 接口正在进行第一次请求
//                 return await map[key].promise
//             }
//         }
//         // 初始化
//         if (!map[key]) {
//             map[key] = {}
//             // 缓存同一个promise 同一个参数等待他完成
//             map[key].promise = fn(key)
//             map[key].lock = true
//             map[key].data = null
//         }

//         // 返回缓存值
//         if (map[key].data) {
//             map[key].lock = true
//             map[key].promise = fn(key)
//             // 下次异步更改数据
//             map[key].promise.then(res => {
//                 map[key].data = res
//                 map[key].lock = false
//             })
//             return map[key].data
//         } else {
//             // 第一次请求
//             let res = await map[key].promise
//             map[key].data = res
//             map[key].lock = false
//             return res
//         }
//     }
// }

import React, {
  Dispatch,
  RefObject,
  SetStateAction,
  UIEventHandler,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";

export interface VirtualListInfo {
  state: {
    useVirtual: boolean;
    estimateScrollHeight: number;
    visibleKeys: Set<React.Key>;
    cachedTranslateY: {
      // @ts-ignore
      [key: React.Key]: number;
    }
  };
  methods: {
    setUseVirtual: Dispatch<SetStateAction<boolean>>;
    updateCachedHeight: (key: React.Key, height: number) => void;
    handleScroll: UIEventHandler<HTMLDivElement>;
    recalcRender: Function;
    handleResize: Function;
  }
}

export interface UseVirtualListOption {
  defaultCachedHeight?: {
    // @ts-ignore
    [key: React.Key]: number;
  };
  scroller: RefObject<HTMLDivElement>;
  estimateHeight: number;
  keyArray: React.Key[];
  placeholderNum: number;
  defaultUseVirtual?: boolean;
}

export default function useVirtualList(option: UseVirtualListOption): VirtualListInfo {
  const {
    defaultCachedHeight = {},
    estimateHeight,
    keyArray,
    scroller,
    placeholderNum,
    defaultUseVirtual = false
  } = option;
  const [, render] = useState<unknown>(0);
  /**
   * 不要在useVirtualList内部使用 setUseVirtual 方法，该方法应由宿主环境调用已开关虚拟列表能力
   *
   * useVirtual变量目前在内部不会用到，可用于优化visibleData的更新
   */
  const [useVirtual, setUseVirtual] = useState(defaultUseVirtual);

  const [cachedHeight, setCachedHeight] = useState(defaultCachedHeight);
  const cachedTranslateY = useRef<{[key: React.Key]: number}>({});

  const anchorItem = useRef({index: 0, offset: 0});
  const lastScrollTop = useRef(0);
  const lastRenderPos = useRef({start: -1, end: -1});
  const offsetY = useRef(0);
  const visibleKeySet = useRef<Array<React.Key>>([]);

  // 正在修正滚动条
  const inRevising = useRef<boolean>(false);

  const recalcRender = () => {
    anchorItem.current = {index: 0, offset: 0};
    lastScrollTop.current = 0;
    lastRenderPos.current = {start: -1, end: -1};
    visibleKeySet.current = [];
    scroller.current!.scrollTop = 0;
    updateAnchorItem();
  }

  function forceUpdate() {
    render(c => c + 1);
  }


  const updateVisibleData = () => {
    if (!scroller.current) {
      return;
    }
    const clientHeight = scroller.current.getBoundingClientRect().height;

    let {index, offset} = anchorItem.current;
    let end = index;
    let blank = 0;
    while (
      end < keyArray.length &&
      blank <= clientHeight
      ) {
      const currHeight = cachedHeight[keyArray[end]] ?? estimateHeight;
      blank += ++end === index ? -1 * offset : currHeight;
    }
    index = Math.max(0, index - placeholderNum);
    end = Math.min(keyArray.length, end + placeholderNum);
    const newKeyArr = keyArray.slice(index, end);
    if (
      newKeyArr.length === visibleKeySet.current.length &&
      newKeyArr.every((k, i) => visibleKeySet.current[i] === k)
    ) {
      return false;
    }

    lastRenderPos.current = {
      start: index,
      end
    };
    visibleKeySet.current = newKeyArr;
    return true;
  };

  const updateCachedTranslateY = (): boolean => {
    const scrollTop = offsetY.current;
    let {
      index,
      offset
    } = anchorItem.current;

    let translateY = scrollTop - offset;
    let idx = index;

    const newCachedTranslateY = {...cachedTranslateY.current}
    while (idx >= 0) {
      const key = keyArray[idx];
      if (!visibleKeySet.current.includes(key)) {
        break;
      }
      if (idx-- !== index) {
        let currHeight = cachedHeight[key] ?? estimateHeight;
        translateY -= currHeight
      }

      newCachedTranslateY[key] = translateY
    }

    idx = index;

    while (idx < keyArray.length) {
      const item = keyArray[idx]
      if (!visibleKeySet.current.includes(item)) {
        break;
      }
      let currHeight = cachedHeight[item] ?? estimateHeight;
      if (idx++ === index) {
        translateY = scrollTop + currHeight - offset;
        continue;
      }

      newCachedTranslateY[item] = translateY;
      translateY += currHeight
    }

    const hasChanged = Object.keys(newCachedTranslateY).some(key => newCachedTranslateY[key] !== cachedTranslateY.current[key]);
    if (!hasChanged) {
      return false;
    }
    cachedTranslateY.current = newCachedTranslateY;
    return true;
  }
  const updateAnchorItem = () => {
    if (inRevising.current || !useVirtual) {
      return;
    }
    requestAnimationFrame(function () {
      if (!scroller.current) {
        return;
      }
      const scrollTop = scroller.current.scrollTop;
      offsetY.current = scrollTop;
      const {
        index: lastIndex,
        offset: lastOffset
      } = anchorItem.current;
      let delta = scrollTop - lastScrollTop.current + lastOffset;
      lastScrollTop.current = scrollTop;

      let i = lastIndex;

      let newAnchorItem;
      if (delta >= 0) {
        while (i < keyArray.length) {
          let currHeight = cachedHeight[keyArray[i]] ?? estimateHeight;
          if (delta <= currHeight) {
            break;
          }
          delta -= currHeight;
          i++;
        }
        if (i >= keyArray.length) {
          newAnchorItem = {
            index: keyArray.length - 1,
            offset: 0
          };
        } else {
          newAnchorItem = {
            index: i,
            offset: delta
          };
        }
      } else {
        while (delta < 0 && i > 0) {
          let currHeight = cachedHeight[keyArray[i - 1]] ?? estimateHeight;
          delta += currHeight;
          i--;
        }

        if (i < 0) {
          newAnchorItem = {
            index: 0,
            offset: 0
          };
        } else {
          if (i === 0 && delta < 0) {
            delta = 0;
          }
          newAnchorItem = {
            index: i,
            offset: delta
          };
        }
      }
      anchorItem.current = newAnchorItem;
      const visibleChanged = updateVisibleData();

      /**
       * 开始处理快速滑动到顶端滑动距离不够的问题
       */
      if (cachedTranslateY.current[visibleKeySet.current[0]] <= -1) {
        inRevising.current = true;
        const actualScrollTop = keyArray.slice(0, newAnchorItem.index).reduce<number>((height, key) => {
          let currHeight = cachedHeight[key] ?? estimateHeight;
          return height + currHeight;
        }, 0) + newAnchorItem.offset;
        if (actualScrollTop === 0) {
          newAnchorItem = {
            index: 0,
            offset: 0
          };
          anchorItem.current = newAnchorItem;
        }
        updateCachedTranslateY();
        inRevising.current = false;
        offsetY.current = actualScrollTop;
        scroller.current.scrollTop = actualScrollTop;
        lastScrollTop.current = actualScrollTop;
        return;
      }

      const translateYChanged = updateCachedTranslateY();
      if (visibleChanged || translateYChanged) {
        forceUpdate();
      }
    });
  }

  useEffect(() => {
    updateAnchorItem();
  }, [cachedHeight, keyArray]);

  function handleResize() {
    forceUpdate();
  }

  // 处理由于滑动过快，导致中间元素未渲染，最后一个元素划不到底的bug
  const calculatedScrollHeight = keyArray.reduce<number>((result, key) => {
    return result + (cachedHeight[key] ?? estimateHeight);
  }, 0);

  const maxCachedScrollHeight = Math.max.apply(Math, Object.keys(cachedTranslateY.current).map(key => {
    if (!keyArray.includes(key)) {
      return 0;
    }
    return cachedTranslateY.current[key] + (cachedHeight[key] ?? estimateHeight);
  }));

  let estimateScrollHeight = visibleKeySet.current.includes(keyArray[keyArray.length - 1]) ? maxCachedScrollHeight : Math.max(calculatedScrollHeight, maxCachedScrollHeight);


  return {
    state: {
      useVirtual,
      estimateScrollHeight,
      visibleKeys: new Set(visibleKeySet.current),
      cachedTranslateY: { ...cachedTranslateY.current }
    },
    methods: {
      setUseVirtual,
      recalcRender,
      updateCachedHeight(key, height) {
        if (cachedHeight[key] === height || !height) {
          return;
        }
        setCachedHeight(info => {
          return {
            ...info,
            [key]: height
          }
        })
      },
      handleScroll: updateAnchorItem,
      handleResize
    }
  }
};

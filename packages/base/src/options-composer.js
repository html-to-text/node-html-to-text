import { deepmergeCustom } from 'deepmerge-ts';


const mergeArraysOverwrite = (values) => {
  const lastValue = values[values.length - 1];
  return (Array.isArray(lastValue)) ? [...lastValue] : [];
};

const deepMergeWithOverwriteArrays = deepmergeCustom({
  filterValues: false,
  mergeArrays: mergeArraysOverwrite
});

const deepMergeWithOptionsComposeRules = deepmergeCustom({
  filterValues: false,
  mergeArrays: (values, utils, meta) => {
    const keyPath = (meta?.keyPath) ? meta.keyPath : [];
    const isRootSelectors = (keyPath.length === 1 && keyPath[0] === 'selectors');
    return isRootSelectors
      ? values.flatMap((value) => value)
      : mergeArraysOverwrite(values);
  },
  metaDataUpdater: (previousMeta, metaMeta) => {
    if (previousMeta === undefined) {
      return (metaMeta.key === undefined)
        ? { keyPath: [] }
        : { keyPath: [metaMeta.key] };
    }
    if (metaMeta.key === undefined) {
      return previousMeta;
    }
    return { keyPath: [...previousMeta.keyPath, metaMeta.key] };
  }
});

/**
 * Deduplicate an array by a given key callback.
 * Item properties are merged recursively and with the preference for last defined values.
 * Of items with the same key, merged item takes the place of the last item,
 * others are omitted.
 *
 * @param { any[] } items An array to deduplicate.
 * @param { (x: any) => string } getKey Callback to get a value that distinguishes unique items.
 * @returns { any[] }
 */
function mergeDuplicatesPreferLast (items, getKey) {
  const map = new Map();
  for (let i = items.length; i-- > 0;) {
    const item = items[i];
    const key = getKey(item);
    map.set(
      key,
      (map.has(key))
        ? deepMergeWithOverwriteArrays(item, map.get(key))
        : item
    );
  }
  return [...map.values()].reverse();
}

/**
 * Merge default and user options, merge formatters and deduplicate selectors.
 *
 * @param { object } params Options preprocessing parameters.
 * @param { Options } params.defaultOptions Package default options.
 * @param { Options } [params.userOptions] User-provided options.
 * @param { object } params.genericFormatters Generic formatters.
 * @param { object } params.packageFormatters Package-specific formatters.
 * @param { (options: Options) => void } [params.handleMergedOptions]
 * Hook to mutate merged options after formatter/selector preprocessing.
 * @returns { Options }
 */
function composeOptions ({
  defaultOptions,
  userOptions = {},
  genericFormatters,
  packageFormatters,
  handleMergedOptions
}) {
  const options = deepMergeWithOptionsComposeRules(defaultOptions, userOptions);
  options.formatters = Object.assign({}, genericFormatters, packageFormatters, options.formatters);
  options.selectors = mergeDuplicatesPreferLast(options.selectors, (s => s.selector));

  if (handleMergedOptions) {
    handleMergedOptions(options);
  }

  return options;
}

/**
 * Merge partial option objects coming from CLI args, presets and/or JSON files,
 * deduplicate selectors, ignore (remove) formatters.
 *
 * @param { object } acc Accumulated options.
 * @param { object } next Next partial options to merge.
 * @returns { object }
 */
function composeCliOptions (acc = {}, next = {}) {
  const merged = deepMergeWithOptionsComposeRules(acc, next);

  if (Array.isArray(merged.selectors)) {
    merged.selectors = mergeDuplicatesPreferLast(merged.selectors, (s) => s.selector);
  }

  if ('formatters' in merged) {
    delete merged.formatters;
  }

  return merged;
}

export {
  composeOptions,
  composeCliOptions,
  mergeDuplicatesPreferLast,
};

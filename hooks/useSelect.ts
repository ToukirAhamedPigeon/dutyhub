import { useEffect, useState } from "react";
import api from "@/lib/axios";
import { useDebounce } from "@/hooks/useDebounce";

type OptionType = {
  value: string;
  label: string;
  [key: string]: any;
};

type UseSelectParams = {
  apiUrl?: string;
  collection?: string;
  search: string;
  filter?: Record<string, any>;
  limit?: number;
  multiple?: boolean;
  optionValueKey?: string;
  optionLabelKeys?: string[];
  optionLabelSeparator?: string;
  initialValue?: string | string[];
};

export function useSelect({
  apiUrl,
  collection, 
  search,
  filter = {},
  limit = 50,
  multiple = false,
  optionValueKey = "_id",
  optionLabelKeys = ["name"],
  optionLabelSeparator = " ",
  initialValue,
}: UseSelectParams) {
  const [options, setOptions] = useState<OptionType[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<string[] | string | null>(
    multiple ? [] : null
  );
  const debouncedSearch = useDebounce(search, 300);
  const token = typeof window !== "undefined"
    ? (() => {
        try {
          return JSON.parse(localStorage.getItem("authUser") || "{}")?.token || null;
        } catch {
          return null;
        }
      })()
    : null;

  const getOptionLabel = (item: Record<string, any>) =>
    optionLabelKeys
      .map((key) => item?.[key])
      .filter(Boolean)
      .join(optionLabelSeparator);

  const mapOption = (item: Record<string, any>): OptionType => ({
    ...item,
    value: item[optionValueKey],
    label: getOptionLabel(item),
  });

  // Fetch options based on search/filter
  useEffect(() => {
    if (!apiUrl) return;

    const fetchOptions = async () => {
      setLoading(true);
      try {
        const res = await api.post(apiUrl, {
        collection, // <-- Add this
        labelFields: optionLabelKeys,
        valueFields: [optionValueKey],
        label_con_str: optionLabelSeparator,
        where: debouncedSearch
          ? {
              $or: optionLabelKeys.map((key) => ({
                [key]: { $regex: debouncedSearch, $options: "i" },
              })),
              ...filter,
            }
          : filter,
        limit,
        skip: 0,
        sortBy: optionLabelKeys[0],
        sortOrder: "asc",
      }, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
        // console.log('res.data',res.data);
        // const mapped = (res.data || []).map(mapOption);
        // console.log('mapped',mapped);
        setOptions(res.data || []);
      } catch (err) {
        console.error("useSelect: Failed to fetch options", err);
      } finally {
        setLoading(false);
      }
    };

    fetchOptions();
  }, [debouncedSearch, JSON.stringify(filter), apiUrl]);

  // Load initial values
  useEffect(() => {
    if (!apiUrl || !initialValue) return;

    const loadInitial = async () => {
      const ids = multiple && Array.isArray(initialValue) ? initialValue : [initialValue];

      setSelected(initialValue);

      const missing = ids.filter((id) => !options.some((opt) => opt.value === id));
      if (missing.length === 0) return;

      try {
        const res = await api.post(apiUrl, {
          labelFields: optionLabelKeys,
          valueFields: [optionValueKey],
          label_con_str: optionLabelSeparator,
          where: { [optionValueKey]: { $in: missing } },
          limit: missing.length,
        }, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });

        const fetched = (res.data || []).map(mapOption);
        setOptions((prev) => [...prev, ...fetched]);
      } catch (err) {
        console.error("useSelect: Failed to fetch initial values", err);
      }

    };

    loadInitial();
  }, [initialValue, options.length]);

  return {
    options,
    loading,
    selected,
    setSelected,
    getOptionLabel,
    setOptions,
  };
}

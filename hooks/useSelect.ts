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

  const getToken = () => {
    if (typeof window === "undefined") return null;
    try {
      const authUser = localStorage.getItem("authUser");
      return JSON.parse(authUser || "{}").token || null;
    } catch {
      return null;
    }
  };

  const token = getToken();

  const getOptionLabel = (option: Record<string, any>): string => {
    return optionLabelKeys
      .map((key) => option?.[key])
      .filter(Boolean)
      .join(optionLabelSeparator);
  };

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
        const res = await api.get(apiUrl, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          params: { q: debouncedSearch, limit, ...filter },
        });

        const mapped = (res.data || []).map(mapOption);
        setOptions(mapped);
      } catch (err) {
        console.error("Failed to fetch select options", err);
      } finally {
        setLoading(false);
      }
    };

    fetchOptions();
  }, [debouncedSearch, JSON.stringify(filter), limit, apiUrl]);

  // Load initial value(s)
  useEffect(() => {
    if (!apiUrl || !initialValue) return;

    const loadInitial = async () => {
      if (multiple && Array.isArray(initialValue)) {
        setSelected(initialValue);
        const missing = initialValue.filter(
          (id) => !options.some((opt) => opt.value === id)
        );
        if (missing.length > 0) {
          try {
            const res = await Promise.all(
              missing.map((id) =>
                api.get(`${apiUrl}/${id}`, {
                  headers: token ? { Authorization: `Bearer ${token}` } : undefined,
                })
              )
            );
            const fetched = res.map((r) => mapOption(r.data));
            setOptions((prev) => [...prev, ...fetched]);
          } catch (err) {
            console.error("Failed to fetch initial multiple options", err);
          }
        }
      } else if (!multiple && typeof initialValue === "string") {
        setSelected(initialValue);
        const exists = options.some((opt) => opt.value === initialValue);
        if (!exists) {
          try {
            const res = await api.get(`${apiUrl}/${initialValue}`, {
              headers: token ? { Authorization: `Bearer ${token}` } : undefined,
            });
            const fetched = mapOption(res.data);
            setOptions((prev) => [...prev, fetched]);
          } catch (err) {
            console.error("Failed to fetch initial option", err);
          }
        }
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

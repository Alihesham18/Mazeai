"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { Locale } from "@/i18n/routing";
import { callingCodeCountries, defaultCallingCode, type CallingCodeCountry } from "@/lib/phone/countries";
import { normalizePhoneNumber, splitInternationalPhone } from "@/lib/phone/normalize";
import styles from "./PhoneInput.module.css";

interface PhoneInputProps {
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  name: string;
  id?: string;
  locale: Locale;
  required?: boolean;
  disabled?: boolean;
  ariaDescribedBy?: string;
  placeholder?: string;
}

const phoneInputCopy: Record<Locale, { search: string; noResults: string }> = {
  en: {
    search: "Search country or code",
    noResults: "No matching countries"
  },
  tr: {
    search: "Ulke veya kod ara",
    noResults: "Eslesen ulke yok"
  },
  ar: {
    search: "ابحث باسم البلد أو الرمز",
    noResults: "لا توجد دول مطابقة"
  },
  fa: {
    search: "جستجوی کشور یا کد",
    noResults: "کشور مطابقی پیدا نشد"
  }
};

function countryLabel(country: CallingCodeCountry, locale: Locale) {
  if (country.iso2 === "TR") return locale === "tr" ? "Türkiye" : "Türkiye";
  if (country.iso2 === "US") return country.name;

  try {
    return new Intl.DisplayNames([locale], { type: "region" }).of(country.iso2) ?? country.name;
  } catch {
    return country.name;
  }
}

function initialState(value?: string) {
  if (!value) {
    return {
      selectedCountry: callingCodeCountries[0],
      localNumber: ""
    };
  }

  const split = splitInternationalPhone(value);
  return {
    selectedCountry: split.country,
    localNumber: split.localNumber
  };
}

export function PhoneInput({
  value,
  defaultValue,
  onChange,
  name,
  id,
  locale,
  required,
  disabled,
  ariaDescribedBy,
  placeholder = "5XX XXX XX XX"
}: PhoneInputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const dropdownId = `${inputId}-country-list`;
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const isControlled = value !== undefined;
  const controlledState = initialState(value);
  const [selectedCountry, setSelectedCountry] = useState<CallingCodeCountry>(
    () => initialState(defaultValue ?? value).selectedCountry
  );
  const [localNumber, setLocalNumber] = useState(() => initialState(defaultValue ?? value).localNumber);
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const activeCountry = isControlled && value ? controlledState.selectedCountry : selectedCountry;
  const activeLocalNumber = isControlled ? controlledState.localNumber : localNumber;
  const submittedValue = normalizePhoneNumber(activeCountry.callingCode, activeLocalNumber);
  const copy = phoneInputCopy[locale];

  const visibleCountries = useMemo(() => {
    const query = search.trim().toLocaleLowerCase(locale);
    if (!query) return callingCodeCountries;

    return callingCodeCountries.filter((country) => {
      const label = countryLabel(country, locale).toLocaleLowerCase(locale);
      return (
        label.includes(query) ||
        country.name.toLocaleLowerCase("en").includes(query) ||
        country.callingCode.includes(query.replace(/\s/g, "")) ||
        (country.iso2 === "TR" && "turkey".includes(query))
      );
    });
  }, [locale, search]);

  useEffect(() => {
    if (!isOpen) return;

    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      searchRef.current?.focus();
    } else {
      setSearch("");
    }
  }, [isOpen]);

  const updateValue = (country: CallingCodeCountry, nextLocalNumber: string) => {
    setSelectedCountry(country);
    if (!isControlled) {
      setLocalNumber(nextLocalNumber);
    }
    onChange?.(normalizePhoneNumber(country.callingCode, nextLocalNumber));
  };

  const selectCountry = (country: CallingCodeCountry) => {
    updateValue(country, activeLocalNumber);
    setIsOpen(false);
  };

  return (
    <div className={styles.root} ref={rootRef}>
      <input type="hidden" name={name} value={submittedValue} />
      <div className={styles.control}>
        <button
          type="button"
          className={styles.selector}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-controls={dropdownId}
          disabled={disabled}
          onClick={() => setIsOpen((current) => !current)}
        >
          <span>{activeCountry.callingCode || defaultCallingCode}</span>
          <span className={styles.chevron} aria-hidden="true">
            ▾
          </span>
        </button>
        <input
          id={inputId}
          className={styles.input}
          value={activeLocalNumber}
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          required={required}
          disabled={disabled}
          aria-describedby={ariaDescribedBy}
          placeholder={placeholder}
          pattern="[0-9()+\\-\\.\\s]*"
          minLength={4}
          maxLength={24}
          onChange={(event) => updateValue(activeCountry, event.target.value)}
        />
      </div>
      {isOpen ? (
        <div className={styles.dropdown}>
          <div className={styles.searchWrap}>
            <input
              ref={searchRef}
              className={styles.search}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Escape") setIsOpen(false);
              }}
              placeholder={copy.search}
              aria-label={copy.search}
            />
          </div>
          <ul id={dropdownId} className={styles.list} role="listbox">
            {visibleCountries.map((country) => (
              <li key={`${country.iso2}-${country.callingCode}`} role="presentation">
                <button
                  type="button"
                  className={styles.option}
                  role="option"
                  aria-selected={country.iso2 === activeCountry.iso2}
                  onClick={() => selectCountry(country)}
                >
                  <span className={styles.country}>{countryLabel(country, locale)}</span>
                  <span className={styles.code}>{country.callingCode}</span>
                </button>
              </li>
            ))}
            {visibleCountries.length === 0 ? (
              <li>
                <p className={styles.empty}>{copy.noResults}</p>
              </li>
            ) : null}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

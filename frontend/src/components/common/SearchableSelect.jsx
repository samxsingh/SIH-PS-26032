import React, { useState, useEffect, useRef, useId } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, Search, Check, X } from 'lucide-react';

export default function SearchableSelect({
  label,
  placeholder,
  searchPlaceholder,
  options = [],
  value = '',
  onChange,
  disabled = false,
  error = '',
  required = false,
  badge = '',
  hint = '',
  id: customId
}) {
  const { t } = useTranslation();
  const defaultPlaceholder = placeholder || t('common.select_option', 'Select an option...');
  const defaultSearchPlaceholder = searchPlaceholder || t('common.search', 'Search...');
  const generatedId = useId();
  const selectId = customId || generatedId;
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const containerRef = useRef(null);
  const searchInputRef = useRef(null);
  const listboxRef = useRef(null);

  // Selected option
  const selectedOption = options.find(
    (opt) =>
      opt.value === value ||
      opt.code === value ||
      opt.stateCode === value ||
      opt.districtCode === value ||
      opt.localityCode === value ||
      opt.label === value ||
      opt.name === value
  );

  // Filtered options based on search query (case-insensitive & Unicode-aware)
  const filteredOptions = options.filter((opt) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.trim().toLowerCase();
    const optLabel = (opt.label || opt.name || opt.stateName || opt.districtName || opt.localityName || '').toLowerCase();
    const optCode = (opt.code || opt.stateCode || opt.districtCode || opt.localityCode || '').toLowerCase();
    const optSubtext = (opt.subtext || '').toLowerCase();
    return optLabel.includes(query) || optCode.includes(query) || optSubtext.includes(query);
  });

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when opened
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  // Keep highlighted index in bounds
  useEffect(() => {
    setHighlightedIndex(0);
  }, [searchQuery, isOpen]);

  // Keyboard navigation handler
  const handleKeyDown = (e) => {
    if (disabled) return;

    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev < filteredOptions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : filteredOptions.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredOptions[highlightedIndex]) {
        handleSelect(filteredOptions[highlightedIndex]);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
      setSearchQuery('');
    }
  };

  const handleSelect = (option) => {
    const chosenVal = option.value || option.stateCode || option.districtCode || option.localityCode || option.label || option.name;
    onChange(chosenVal, option);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange('', null);
    setSearchQuery('');
  };

  const displayLabel = selectedOption
    ? selectedOption.label || selectedOption.name || selectedOption.stateName || selectedOption.districtName || selectedOption.localityName
    : '';

  return (
    <div className="w-full" ref={containerRef}>
      {label && (
        <div className="flex items-center justify-between mb-1.5">
          <label htmlFor={selectId} className="block text-xs font-bold text-gray-800 uppercase tracking-wider">
            {label} {required && <span className="text-red-600">*</span>}
          </label>
          {badge && (
            <span className="text-[11px] font-semibold text-forest-700 bg-forest-50 px-2 py-0.5 border border-forest-300">
              {badge}
            </span>
          )}
        </div>
      )}

      <div className="relative">
        {/* Trigger Button */}
        <button
          type="button"
          id={selectId}
          disabled={disabled}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          onKeyDown={handleKeyDown}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-controls={`${selectId}-listbox`}
          className={`w-full min-h-[48px] px-3.5 py-2.5 text-left bg-white border-2 flex items-center justify-between transition-colors ${
            disabled
              ? 'bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed'
              : error
              ? 'border-red-600 focus:outline-none focus:ring-2 focus:ring-red-500'
              : isOpen
              ? 'border-forest-700 shadow-[3px_3px_0px_#1B4D3E]'
              : 'border-neutral-900 shadow-[2px_2px_0px_#22252A] hover:border-forest-700'
          }`}
        >
          <span className={`block truncate text-sm font-medium ${displayLabel ? 'text-gray-900 font-semibold' : 'text-gray-400'}`}>
            {displayLabel || defaultPlaceholder}
          </span>

          <div className="flex items-center gap-1.5 ml-2 shrink-0">
            {displayLabel && !disabled && (
              <span
                role="button"
                tabIndex={-1}
                onClick={handleClear}
                aria-label={t('common.clear_selection', 'Clear selection')}
                className="p-1 text-gray-400 hover:text-red-600 rounded"
              >
                <X className="w-3.5 h-3.5" />
              </span>
            )}
            <ChevronDown className={`w-4 h-4 text-gray-700 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </div>
        </button>

        {/* Dropdown Popover */}
        {isOpen && (
          <div
            className="absolute z-50 w-full mt-1.5 bg-[#FAF8F5] border-2 border-neutral-900 shadow-[4px_4px_0px_#22252A] overflow-hidden animate-fadeIn"
            style={{ maxHeight: '340px' }}
          >
            {/* Search Input Box */}
            <div className="p-2 border-b-2 border-neutral-900 bg-white">
              <div className="relative flex items-center">
                <Search className="w-4 h-4 text-gray-400 absolute left-2.5 pointer-events-none" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={defaultSearchPlaceholder}
                  className="w-full pl-8 pr-3 py-2 text-xs font-medium border border-gray-300 focus:border-forest-700 focus:outline-none focus:ring-1 focus:ring-forest-700 bg-white"
                />
              </div>
            </div>

            {/* Listbox of Options */}
            <ul
              id={`${selectId}-listbox`}
              role="listbox"
              ref={listboxRef}
              className="overflow-y-auto max-h-56 p-1 divide-y divide-gray-100"
            >
              {filteredOptions.length === 0 ? (
                <li className="px-3 py-4 text-xs text-center text-gray-500 font-medium">
                  {t('common.no_locations_found', { query: searchQuery })}
                </li>
              ) : (
                filteredOptions.map((opt, index) => {
                  const optVal = opt.value || opt.stateCode || opt.districtCode || opt.localityCode || opt.label || opt.name;
                  const isSelected =
                    optVal === value ||
                    opt.code === value ||
                    opt.stateCode === value ||
                    opt.districtCode === value ||
                    opt.localityCode === value ||
                    opt.label === value ||
                    opt.name === value;
                  const isHighlighted = index === highlightedIndex;
                  const optDisplay = opt.label || opt.name || opt.stateName || opt.districtName || opt.localityName;

                  return (
                    <li
                      key={opt.code || opt.stateCode || opt.districtCode || opt.localityCode || optVal || index}
                      id={`${selectId}-option-${index}`}
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => handleSelect(opt)}
                      onMouseEnter={() => setHighlightedIndex(index)}
                      className={`px-3 py-2.5 min-h-[44px] cursor-pointer flex items-center justify-between text-xs transition-colors ${
                        isSelected
                          ? 'bg-forest-100 text-forest-900 font-bold border-l-4 border-forest-700'
                          : isHighlighted
                          ? 'bg-amber-100 text-neutral-950 font-semibold'
                          : 'text-gray-800 hover:bg-gray-100 font-medium'
                      }`}
                    >
                      <div className="flex flex-col">
                        <span className="truncate">{optDisplay}</span>
                        {opt.subtext && <span className="text-[10px] text-gray-500 font-normal">{opt.subtext}</span>}
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-forest-800 shrink-0 ml-2" />}
                    </li>
                  );
                })
              )}
            </ul>
          </div>
        )}
      </div>

      {hint && !error && <p className="mt-1 text-[11px] text-gray-600 font-medium">{hint}</p>}
      {error && <p className="mt-1 text-xs text-red-600 font-bold flex items-center gap-1">✕ {error}</p>}
    </div>
  );
}

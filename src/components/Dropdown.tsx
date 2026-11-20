import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { Icon } from '../icons';

export interface DropdownOption {
  value: string;
  label: string;
  icon?: string;
  badge?: string;
  description?: string;
}

interface DropdownProps {
  label?: string;
  value?: string;
  options: DropdownOption[];
  onChange: (value: string) => void;
  align?: 'left' | 'right';
  className?: string;
  triggerContent?: (selectedOption?: DropdownOption, isOpen?: boolean) => ReactNode;
}

export function Dropdown({
  label,
  value,
  options,
  onChange,
  align = 'left',
  className = '',
  triggerContent
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(opt => opt.value === value) || options[0];

  useEffect(() => {
    if (!isOpen) return;

    const handleOutsideClick = (e: PointerEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('pointerdown', handleOutsideClick);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('pointerdown', handleOutsideClick);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setIsOpen(true);
        setActiveIndex(options.findIndex(opt => opt.value === value));
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(prev => (prev + 1) % options.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(prev => (prev - 1 + options.length) % options.length);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (activeIndex >= 0 && activeIndex < options.length) {
        onChange(options[activeIndex].value);
        setIsOpen(false);
      }
    }
  };

  const selectOption = (optValue: string) => {
    onChange(optValue);
    setIsOpen(false);
  };

  return (
    <div
      ref={containerRef}
      className={`custom-dropdown-container ${className} ${isOpen ? 'is-open' : ''}`}
    >
      <button
        type="button"
        className="custom-dropdown-trigger"
        onClick={() => setIsOpen(open => !open)}
        onKeyDown={handleKeyDown}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        {triggerContent ? (
          triggerContent(selectedOption, isOpen)
        ) : (
          <>
            <div className="trigger-text-block">
              {label && <span className="dropdown-label">{label}</span>}
              <span className="dropdown-current-value">{selectedOption?.label || value}</span>
            </div>
            <span className={`dropdown-chevron ${isOpen ? 'is-open' : ''}`}>
              <Icon name="chevron-down" width="14" height="14" />
            </span>
          </>
        )}
      </button>

      {isOpen && (
        <div
          ref={menuRef}
          className={`custom-dropdown-menu align-${align}`}
          role="listbox"
          tabIndex={-1}
        >
          {options.map((opt, i) => {
            const isSelected = opt.value === value;
            const isHighlighted = i === activeIndex;
            return (
              <button
                key={opt.value}
                type="button"
                className={`dropdown-menu-item ${isSelected ? 'is-selected' : ''} ${
                  isHighlighted ? 'is-highlighted' : ''
                }`}
                onClick={() => selectOption(opt.value)}
                role="option"
                aria-selected={isSelected}
              >
                <div className="item-label-group">
                  {opt.icon && <Icon name={opt.icon} width="14" height="14" className="item-icon" />}
                  <span className="item-title">{opt.label}</span>
                </div>
                {isSelected && (
                  <Icon name="check" width="14" height="14" className="item-check" />
                )}
                {opt.badge && !isSelected && (
                  <span className="item-badge">{opt.badge}</span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Check, X } from 'lucide-react';

export default function MultiSelectDropdown({
    options = [],
    selected = [],
    onChange,
    label = "Items"
}) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const isAllSelected = options.length > 0 && selected.length === options.length;
    const isIndeterminate = selected.length > 0 && selected.length < options.length;

    const handleSelectAll = () => {
        if (isAllSelected) {
            onChange([]);
        } else {
            onChange([...options]);
        }
    };

    const handleOptionToggle = (option) => {
        if (selected.includes(option)) {
            onChange(selected.filter(item => item !== option));
        } else {
            onChange([...selected, option]);
        }
    };

    // Derived Display Text
    const getDisplayText = () => {
        if (selected.length === 0) return `Select ${label}`;
        if (selected.length === options.length) return `All ${label}`;
        if (selected.length === 1) return selected[0];
        return `${selected.length} ${label} Selected`;
    };

    return (
        <div className="relative w-64" ref={containerRef}>
            {/* Trigger Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-bold text-gray-700 flex justify-between items-center group hover:bg-gray-50"
            >
                <span className="truncate">{getDisplayText()}</span>
                <ChevronDown size={14} className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute top-full left-0 mt-2 w-full bg-white border border-gray-100 rounded-xl shadow-xl z-50 max-h-60 overflow-y-auto overflow-x-hidden p-2 flex flex-col gap-1">
                    {/* Select All Option */}
                    <div
                        onClick={handleSelectAll}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-blue-50 cursor-pointer transition-colors"
                    >
                        <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${isAllSelected ? 'bg-blue-500 border-blue-500' : 'border-gray-300 bg-white'}`}>
                            {isAllSelected && <Check size={10} className="text-white" />}
                            {!isAllSelected && isIndeterminate && <div className="w-2 h-2 rounded-sm bg-blue-500" />}
                        </div>
                        <span className="text-xs font-bold text-gray-700">All {label}</span>
                    </div>

                    <div className="h-px bg-gray-100 my-1 mx-2" />

                    {/* Options List */}
                    {options.map(option => {
                        const isSelected = selected.includes(option);
                        return (
                            <div
                                key={option}
                                onClick={() => handleOptionToggle(option)}
                                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                            >
                                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${isSelected ? 'bg-blue-500 border-blue-500' : 'border-gray-300 bg-white'}`}>
                                    {isSelected && <Check size={10} className="text-white" />}
                                </div>
                                <span className="text-xs font-medium text-gray-600 truncate">{option}</span>
                            </div>
                        );
                    })}

                    {options.length === 0 && (
                        <div className="text-center text-xs text-gray-400 py-2">No items found</div>
                    )}
                </div>
            )}
        </div>
    );
}

import { useEffect, useState } from 'react';

/**
 * Light or dark. There is no "system".
 *
 * A third state meant the toggle could not simply flip. Light is the default
 * for everyone: the OS preference is not consulted at all, so every first
 * visit renders the same way and the product is designed against one known
 * ground. Dark is opt-in, and once chosen the stored value is the only
 * authority.
 */
export type Appearance = 'light' | 'dark';

const STORAGE_KEY = 'appearance';

const applyTheme = (appearance: Appearance) => {
    document.documentElement.classList.toggle('dark', appearance === 'dark');
};

/** Anything stored by the previous three-state version resolves to a real mode. */
const readStored = (): Appearance => {
    const stored = localStorage.getItem(STORAGE_KEY);

    if (stored === 'light' || stored === 'dark') {
        return stored;
    }

    return 'light';
};

export function initializeTheme() {
    applyTheme(readStored());
}

export function useAppearance() {
    const [appearance, setAppearance] = useState<Appearance>('light');

    const updateAppearance = (mode: Appearance) => {
        setAppearance(mode);
        localStorage.setItem(STORAGE_KEY, mode);
        applyTheme(mode);
    };

    /**
     * One click flips it.
     *
     * The next mode is derived from the applied class, not from React state.
     * Reading state would use the pre-render value, and putting the DOM write
     * inside a state updater would make the updater impure and batch the class
     * changes. The document is the source of truth and is always current.
     */
    const toggleAppearance = () => {
        updateAppearance(document.documentElement.classList.contains('dark') ? 'light' : 'dark');
    };

    useEffect(() => {
        const current = readStored();
        setAppearance(current);
        applyTheme(current);
    }, []);

    return { appearance, updateAppearance, toggleAppearance };
}

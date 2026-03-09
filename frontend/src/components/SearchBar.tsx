import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchAPI } from '../lib/api';

export default function SearchBar() {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<{ tasks?: any[], projects?: any[] }>({});
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [wrapperRef]);

    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (query.length >= 2) {
                setLoading(true);
                try {
                    const res = await searchAPI.query(query);
                    setResults(res.data);
                } catch (error) {
                    console.error("Search failed", error);
                } finally {
                    setLoading(false);
                }
            } else {
                setResults({});
            }
        }, 300); // 300ms debounce

        return () => clearTimeout(delayDebounceFn);
    }, [query]);

    const handleSelectTask = () => {
        setIsOpen(false);
        setQuery('');
        navigate('/tasks'); // In a real app maybe highlight or open modal
    };

    const handleSelectProject = () => {
        setIsOpen(false);
        setQuery('');
        navigate('/projects');
    };

    return (
        <div className="relative" ref={wrapperRef}>
            <button
                onClick={() => setIsOpen(true)}
                className="p-2 rounded-xl text-gray-500 hover:text-primary-600 hover:bg-white/60 transition-all focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                aria-label="Search"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-3 w-80 md:w-96 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden z-50 animate-slide-down origin-top-right">
                    <div className="p-3 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80">
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                            <input
                                type="text"
                                className="block w-full pl-10 pr-3 py-2 border border-gray-200 dark:border-gray-600 rounded-xl leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition-all"
                                placeholder="Search tasks, projects..."
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                autoFocus
                            />
                            {loading && (
                                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                                    <div className="spinner border-primary-500 h-4 w-4"></div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="max-h-96 overflow-y-auto">
                        {!loading && query.length >= 2 && (!results.tasks?.length && !results.projects?.length) && (
                            <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
                                No results found for "{query}"
                            </div>
                        )}

                        {query.length < 2 && (
                            <div className="p-4 text-center text-xs text-gray-400 dark:text-gray-500">
                                Type at least 2 characters to search
                            </div>
                        )}

                        {results.projects && results.projects.length > 0 && (
                            <div className="py-2">
                                <h3 className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Projects</h3>
                                <ul>
                                    {results.projects.map((p) => (
                                        <li key={`p-${p.id}`}>
                                            <button
                                                onClick={() => handleSelectProject()}
                                                className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center"
                                            >
                                                <div className={`w-2 h-2 rounded-full mr-3 ${p.health === 'red' ? 'bg-red-500' : p.health === 'yellow' ? 'bg-yellow-500' : 'bg-green-500'
                                                    }`}></div>
                                                <div>
                                                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{p.name}</p>
                                                    <p className="text-xs text-gray-500 truncate w-64">{p.description}</p>
                                                </div>
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {results.tasks && results.tasks.length > 0 && (
                            <div className="py-2 border-t border-gray-100 dark:border-gray-700">
                                <h3 className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Tasks</h3>
                                <ul>
                                    {results.tasks.map((t) => (
                                        <li key={`t-${t.id}`}>
                                            <button
                                                onClick={() => handleSelectTask()}
                                                className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700"
                                            >
                                                <div className="flex justify-between items-center mb-1">
                                                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{t.title}</p>
                                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded border border-gray-200 text-gray-500 uppercase">
                                                        {t.status.replace('_', ' ')}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-gray-500 truncate w-72">{t.description}</p>
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

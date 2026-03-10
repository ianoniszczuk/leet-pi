import { useRef, useEffect } from 'react';
import Editor, { type OnMount } from '@monaco-editor/react';
import { Code2, Play, Eraser } from 'lucide-react';

interface CodeEditorProps {
    code: string;
    loading: boolean;
    codeModified: boolean;
    showResults: boolean;
    onCodeChange: (value: string) => void;
    onSubmit: () => void;
    onReset: () => void;
}

export default function CodeEditor({
    code,
    loading,
    codeModified,
    showResults,
    onCodeChange,
    onSubmit,
    onReset,
}: CodeEditorProps) {
    const handleSubmitRef = useRef<() => void>(() => { });

    // Keep ref updated so the Monaco command always calls the latest onSubmit
    handleSubmitRef.current = onSubmit;

    // Monaco onMount: register Ctrl+Enter inside the editor
    const handleEditorMount: OnMount = (editor, monaco) => {
        editor.addCommand(
            monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter,
            () => handleSubmitRef.current(),
        );
    };

    // Keyboard shortcut for submit (Ctrl+Enter) when focus is outside Monaco
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey && e.key === 'Enter') {
                e.preventDefault();
                handleSubmitRef.current();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, []);

    return (
        <div className={`bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden transition-all duration-500 flex flex-col ${showResults ? 'w-full lg:w-1/2' : 'w-full max-w-5xl'
            }`}>

            {/* Editor Header */}
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                        <Code2 className="w-4 h-4 text-gray-600" />
                        <span className="text-sm font-semibold text-gray-700">main.c</span>
                        <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded-full">C</span>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={onReset}
                        disabled={!codeModified}
                        className="border-2 border-gray-300 hover:border-gray-400 text-gray-600 hover:text-gray-800 disabled:border-gray-200 disabled:text-gray-300 disabled:hover:bg-transparent disabled:cursor-not-allowed disabled:transform-none font-semibold py-2 px-4 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 flex items-center gap-2 hover:bg-gray-100 transform hover:-translate-y-0.5"
                    >
                        <Eraser className="w-4 h-4" />
                        <span className="hidden sm:inline">Limpiar</span>
                    </button>
                    <div className="relative group/submit flex items-center">
                        <span className="absolute top-full mt-2 left-1/2 -translate-x-1/2 text-xs text-gray-500 bg-gray-200 px-3 py-1 rounded-full whitespace-nowrap opacity-0 group-hover/submit:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
                            Ctrl+Enter
                        </span>
                        <button
                            onClick={onSubmit}
                            disabled={loading || !code.trim()}
                            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:transform-none"
                        >
                            {loading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    <span className="hidden sm:inline">Evaluando...</span>
                                </>
                            ) : (
                                <>
                                    <Play className="w-4 h-4" />
                                    <span className="hidden sm:inline">Enviar</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Monaco Code Editor */}
            <div className="relative flex-1" style={{ minHeight: '480px' }}>
                <div className="absolute inset-0">
                    <Editor
                        height="100%"
                        defaultLanguage="c"
                        theme="vs-dark"
                        value={code}
                        onChange={(value: string | undefined) => onCodeChange(value ?? '')}
                        onMount={handleEditorMount}
                        loading={
                            <div className="flex items-center justify-center h-full bg-gray-900">
                                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                            </div>
                        }
                        options={{
                            fontSize: 14,
                            fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', Consolas, monospace",
                            fontLigatures: false,
                            minimap: { enabled: false },
                            scrollBeyondLastLine: false,
                            wordWrap: 'on',
                            tabSize: 4,
                            insertSpaces: true,
                            autoIndent: 'full',
                            formatOnPaste: true,
                            formatOnType: true,
                            bracketPairColorization: { enabled: false },
                            guides: { bracketPairs: false },
                            suggestOnTriggerCharacters: true,
                            quickSuggestions: { other: true, comments: false, strings: false },
                            padding: { top: 16, bottom: 16 },
                            renderLineHighlight: 'all',
                            smoothScrolling: true,
                            cursorBlinking: 'smooth',
                            cursorSmoothCaretAnimation: 'on',
                        }}
                    />
                </div>
            </div>
        </div>
    );
}

"use client";

import { useState, useEffect, useCallback } from "react";

interface ClipboardEntry {
  type: string;
  content: string;
}

interface XscpPayload {
  nodes: unknown[];
  styles: unknown[];
}

export default function InspectorPage() {
  const [clipboardEntries, setClipboardEntries] = useState<ClipboardEntry[]>(
    []
  );
  const [clipboardText, setClipboardText] = useState("");
  const [parsed, setParsed] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState("");
  const [listening, setListening] = useState(false);

  const handlePasteEvent = useCallback((e: ClipboardEvent) => {
    e.preventDefault();
    setError("");
    setParsed(null);

    const entries: ClipboardEntry[] = [];
    const dt = e.clipboardData;

    if (!dt) {
      setError("No clipboard data in paste event.");
      return;
    }

    // Read ALL available types from the paste event
    for (const type of dt.types) {
      const content = dt.getData(type);
      entries.push({ type, content });

      // Try to parse JSON and detect XscpData
      try {
        const data = JSON.parse(content);
        if (data.type === "@webflow/XscpData") {
          setParsed(data);
        }
      } catch {
        // Not JSON
      }
    }

    setClipboardEntries(entries);

    if (entries.length === 0) {
      setError("Paste event had no data.");
    }
  }, []);

  useEffect(() => {
    if (listening) {
      document.addEventListener("paste", handlePasteEvent);
      return () => document.removeEventListener("paste", handlePasteEvent);
    }
  }, [listening, handlePasteEvent]);

  const handlePasteText = (text: string) => {
    setClipboardText(text);
    setError("");
    setParsed(null);

    try {
      const data = JSON.parse(text);
      if (data.type === "@webflow/XscpData") {
        setParsed(data);
      } else {
        setError("JSON parsed but not XscpData format.");
        setParsed(data);
      }
    } catch {
      setError("Not valid JSON");
    }
  };

  const payload = parsed?.payload as XscpPayload | undefined;

  return (
    <div className="max-w-4xl mx-auto px-6 py-16">
      <h1 className="text-3xl font-bold mb-2">Clipboard Inspector</h1>
      <p className="text-gray-400 mb-8">
        Copy an element in Webflow Designer, then press Cmd+V on this page to
        see all MIME types Webflow uses.
      </p>

      <div className="flex gap-4 mb-6">
        <button
          onClick={() => {
            setListening(!listening);
            setClipboardEntries([]);
            setError("");
            setParsed(null);
          }}
          className={`font-medium rounded-lg px-4 py-2 transition-colors ${
            listening
              ? "bg-green-600 hover:bg-green-500 text-white"
              : "bg-blue-600 hover:bg-blue-500 text-white"
          }`}
        >
          {listening
            ? "Listening for Cmd+V... (click to stop)"
            : "Start Listening"}
        </button>
        <a
          href="/"
          className="bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium rounded-lg px-4 py-2 transition-colors"
        >
          Back to Translator
        </a>
      </div>

      {listening ? (
        <div className="bg-blue-900/30 border border-blue-800 rounded-lg px-4 py-3 mb-6 text-blue-300 text-sm">
          Ready — copy an element in Webflow Designer, then press <strong>Cmd+V</strong> anywhere on this page.
        </div>
      ) : null}

      {error ? (
        <div className="bg-yellow-900/30 border border-yellow-800 rounded-lg px-4 py-3 mb-6 text-yellow-300 text-sm">
          {error}
        </div>
      ) : null}

      {/* MIME Types Display */}
      {clipboardEntries.length > 0 ? (
        <div className="space-y-4 mb-8">
          <h2 className="text-lg font-semibold text-white">
            Clipboard MIME Types ({clipboardEntries.length} found)
          </h2>
          {clipboardEntries.map((entry, i) => (
            <div
              key={i}
              className="bg-gray-900 border border-gray-700 rounded-lg p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <code className="text-sm font-mono text-blue-400">
                  {entry.type}
                </code>
                <span className="text-xs text-gray-500">
                  {entry.content.length} chars
                </span>
              </div>
              <pre className="text-xs font-mono text-gray-300 overflow-auto max-h-60 whitespace-pre-wrap break-all">
                {entry.content.slice(0, 5000)}
                {entry.content.length > 5000 ? "\n... (truncated)" : ""}
              </pre>
            </div>
          ))}
        </div>
      ) : null}

      {/* Manual paste fallback */}
      <div className="mb-6">
        <label className="block text-sm text-gray-400 mb-1">
          Or paste JSON manually
        </label>
        <textarea
          value={clipboardText}
          onChange={(e) => handlePasteText(e.target.value)}
          placeholder='{"type":"@webflow/XscpData",...}'
          className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-xs font-mono h-40 focus:outline-none focus:border-blue-500"
        />
      </div>

      {/* Parsed XscpData Summary */}
      {parsed ? (
        <div className="space-y-4">
          {payload ? (
            <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 text-sm">
              <h3 className="text-green-400 font-medium mb-2">
                Valid XscpData detected
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-gray-400">Nodes: </span>
                  <span className="text-white font-mono">
                    {payload.nodes.length}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">Styles: </span>
                  <span className="text-white font-mono">
                    {payload.styles.length}
                  </span>
                </div>
              </div>
            </div>
          ) : null}

          <pre className="bg-gray-900 border border-gray-700 rounded-lg p-4 text-xs font-mono overflow-auto max-h-[600px] text-gray-300">
            {JSON.stringify(parsed, null, 2)}
          </pre>
        </div>
      ) : null}
    </div>
  );
}

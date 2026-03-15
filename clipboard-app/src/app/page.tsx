"use client";

import { useState } from "react";

interface TranslateResult {
  xscpData: string;
  buildPlan: unknown;
  nodeCount: number;
  styleCount: number;
}

export default function Home() {
  const [figmaUrl, setFigmaUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TranslateResult | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [showJson, setShowJson] = useState(false);

  const handleTranslate = async () => {
    setLoading(true);
    setError("");
    setResult(null);
    setCopied(false);

    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ figmaUrl }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Translation failed");
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!result) return;

    // Use the copy event to set application/json MIME type
    // (navigator.clipboard.write blocks custom MIME types)
    const handler = (e: ClipboardEvent) => {
      e.preventDefault();
      e.clipboardData?.setData("application/json", result.xscpData);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    };

    document.addEventListener("copy", handler, { once: true });
    document.execCommand("copy");
  };

  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <h1 className="text-3xl font-bold mb-2">Figma → Webflow</h1>
      <p className="text-gray-400 mb-8">
        Paste a Figma URL, translate the design, and copy it as native Webflow
        elements.
      </p>

      {/* Figma URL */}
      <div className="mb-6">
        <label className="block text-sm text-gray-400 mb-1">Figma URL</label>
        <input
          type="text"
          value={figmaUrl}
          onChange={(e) => setFigmaUrl(e.target.value)}
          placeholder="https://figma.com/design/abc123/file?node-id=1:5318"
          className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-blue-500"
        />
        <p className="text-xs text-gray-500 mt-1">
          Select a frame or section in Figma, then copy the URL (it should
          include ?node-id=...)
        </p>
      </div>

      {/* Translate Button */}
      <button
        onClick={handleTranslate}
        disabled={loading || !figmaUrl}
        className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 text-white font-medium rounded-lg px-4 py-3 mb-6 transition-colors"
      >
        {loading ? "Translating..." : "Translate"}
      </button>

      {/* Error */}
      {error ? (
        <div className="bg-red-900/30 border border-red-800 rounded-lg px-4 py-3 mb-6 text-red-300 text-sm">
          {error}
        </div>
      ) : null}

      {/* Result */}
      {result ? (
        <div className="space-y-4">
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm text-gray-400">
                {result.nodeCount} elements, {result.styleCount} styles
              </div>
            </div>

            {/* Copy Button */}
            <button
              onClick={handleCopy}
              className={`w-full font-medium rounded-lg px-4 py-3 transition-colors ${
                copied
                  ? "bg-green-600 text-white"
                  : "bg-white text-gray-900 hover:bg-gray-200"
              }`}
            >
              {copied
                ? "Copied! Now paste in Webflow Designer (Cmd+V)"
                : "Copy for Webflow"}
            </button>
          </div>

          {/* Toggle JSON Preview */}
          <button
            onClick={() => setShowJson(!showJson)}
            className="text-sm text-gray-500 hover:text-gray-300"
          >
            {showJson ? "Hide" : "Show"} JSON preview
          </button>

          {showJson ? (
            <pre className="bg-gray-900 border border-gray-700 rounded-lg p-4 text-xs font-mono overflow-auto max-h-96 text-gray-300">
              {JSON.stringify(JSON.parse(result.xscpData), null, 2)}
            </pre>
          ) : null}
        </div>
      ) : null}

      {/* Test Paste */}
      <div className="mt-8 mb-8">
        <button
          onClick={async () => {
            const res = await fetch("/api/test-paste");
            const data = await res.json();
            const handler = (e: ClipboardEvent) => {
              e.preventDefault();
              e.clipboardData?.setData("application/json", data.xscpData);
            };
            document.addEventListener("copy", handler, { once: true });
            document.execCommand("copy");
            alert("Test data copied! Go to Webflow and Cmd+V. Should show a dark section with a red box and white heading.");
          }}
          className="w-full bg-purple-600 hover:bg-purple-500 text-white font-medium rounded-lg px-4 py-3 transition-colors"
        >
          Copy Test Element (red box + heading)
        </button>
        <p className="text-xs text-gray-500 mt-1">
          Minimal hand-crafted test to verify styles work.
        </p>
      </div>

      {/* Instructions */}
      <div className="mt-12 text-sm text-gray-500 space-y-2">
        <h2 className="text-gray-400 font-medium">How it works</h2>
        <ol className="list-decimal list-inside space-y-1">
          <li>Select a frame or section in Figma and copy the URL</li>
          <li>Paste the URL above and click Translate</li>
          <li>Click &quot;Copy for Webflow&quot;</li>
          <li>
            Open Webflow Designer, click on the canvas, and press Cmd+V (or
            Ctrl+V)
          </li>
          <li>Native Webflow elements appear — fully editable</li>
        </ol>
      </div>
    </div>
  );
}

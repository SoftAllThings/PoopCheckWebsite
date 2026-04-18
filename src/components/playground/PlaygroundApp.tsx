import { useState, useRef, useCallback, useId } from 'react';

interface PredictionResult {
  label: string;
  confidence: number;
}

interface AnalysisResult {
  bristolType: PredictionResult[];
  primaryPrediction: { type: string; confidence: number };
  aiScreening?: {
    general: Record<string, string>;
    conditions: Record<string, string> | null;
  };
  analysis?: string | null;
  screenings?: Record<string, { status: string; recap: string; description: string }> | null;
  actionHeroText?: string | null;
  actionToConsider?: string | null;
  actionDescription?: string | null;
}

interface ProgressEvent {
  stage: string;
  progress: number;
  label: string;
}

const ANALYZE_ENDPOINT = '/api/analyze/';

export default function PlaygroundApp() {
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [progress, setProgress] = useState<ProgressEvent | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dailyLimitHit, setDailyLimitHit] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLLabelElement>(null);
  const inputId = useId();

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file (JPEG or PNG).');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('Image must be under 10MB.');
      return;
    }
    setImage(file);
    setPreview(URL.createObjectURL(file));
    setResult(null);
    setError(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dropRef.current?.classList.remove('border-[var(--color-primary)]');
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    dropRef.current?.classList.add('border-[var(--color-primary)]');
  }, []);

  const handleDragLeave = useCallback(() => {
    dropRef.current?.classList.remove('border-[var(--color-primary)]');
  }, []);

  const analyze = useCallback(async () => {
    if (!image) return;

    setAnalyzing(true);
    setError(null);
    setProgress({ stage: 'uploading', progress: 5, label: 'Uploading image...' });

    try {
      const formData = new FormData();
      formData.append('image', image);

      const response = await fetch(ANALYZE_ENDPOINT, {
        method: 'POST',
        body: formData,
      });

      // Daily-limit: upsell to the app instead of a raw error
      if (response.status === 429) {
        setDailyLimitHit(true);
        setAnalyzing(false);
        setProgress(null);
        return;
      }

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error || `Analysis failed (${response.status})`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) throw new Error('Streaming not supported');

      let buffer = '';
      let currentEventType = '';
      let currentDataLines: string[] = [];

      const processEvent = (type: string, dataStr: string) => {
        try {
          const data = JSON.parse(dataStr);
          if (type === 'progress') {
            setProgress(data as ProgressEvent);
          } else if (type === 'result') {
            setResult(data as AnalysisResult);
            setAnalyzing(false);
            setProgress(null);
          } else if (type === 'error') {
            throw new Error(data.message || 'Analysis failed');
          }
        } catch (parseErr) {
          if (!(parseErr instanceof SyntaxError)) throw parseErr;
        }
      };

      const processLine = (line: string) => {
        if (line.startsWith('event: ')) {
          // Flush any pending event before starting new one
          if (currentEventType && currentDataLines.length > 0) {
            processEvent(currentEventType, currentDataLines.join(''));
          }
          currentEventType = line.slice(7).trim();
          currentDataLines = [];
        } else if (line.startsWith('data: ')) {
          currentDataLines.push(line.slice(6));
        } else if (line === '' && currentEventType && currentDataLines.length > 0) {
          // Empty line = end of SSE event
          processEvent(currentEventType, currentDataLines.join(''));
          currentEventType = '';
          currentDataLines = [];
        }
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          processLine(line);
        }
      }

      // Process any remaining buffer content
      if (buffer.trim()) {
        processLine(buffer);
      }
      // Flush any pending event after stream ends
      if (currentEventType && currentDataLines.length > 0) {
        processEvent(currentEventType, currentDataLines.join(''));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      setAnalyzing(false);
      setProgress(null);
    }
  }, [image]);

  const reset = useCallback(() => {
    setImage(null);
    setPreview(null);
    setResult(null);
    setError(null);
    setProgress(null);
    setAnalyzing(false);
    setDailyLimitHit(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  // Bristol type color coding
  const getBristolColor = (type: string): string => {
    const num = parseInt(type.replace(/\D/g, ''));
    if (num <= 2) return '#DC2626';
    if (num <= 4) return '#A3FFBF';
    return '#D97706';
  };

  const getStatusColor = (status: string): string => {
    if (status === 'green') return '#A3FFBF';
    if (status === 'yellow') return '#D97706';
    return '#DC2626';
  };

  return (
    <div>
      {dailyLimitHit ? (
        /* Daily-limit upsell — the whole point of the 1/day cap */
        <div style={{
          background: 'linear-gradient(135deg, rgba(155,240,255,0.08), rgba(163,255,191,0.08))',
          borderRadius: '16px',
          border: '1px solid var(--color-border)',
          padding: '40px 24px',
          textAlign: 'center',
        }}>
          <div style={{
            width: '72px', height: '72px', margin: '0 auto 20px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, var(--color-accent), var(--color-primary))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-dark)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 6v6l4 2M12 2a10 10 0 100 20 10 10 0 000-20z" />
            </svg>
          </div>
          <h3 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '8px' }}>
            That's your free scan for today
          </h3>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '15px', maxWidth: '420px', margin: '0 auto 24px', lineHeight: 1.5 }}>
            Get unlimited AI stool analysis, daily gut scores, and pattern tracking in the PoopCheck app — free to download.
          </p>
          <a
            href="/download/"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              padding: '14px 28px', borderRadius: '9999px',
              background: 'var(--color-primary)', color: 'var(--color-text-dark)',
              fontWeight: '600', fontSize: '15px', textDecoration: 'none',
            }}
          >
            Get the app — free
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </a>
        </div>
      ) : !result ? (
        /* Upload + analyze state */
        <div>
          {/* Drop zone — label so the native file picker opens without JS */}
          <input
            ref={fileInputRef}
            id={inputId}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            style={{
              position: 'absolute',
              width: '1px',
              height: '1px',
              padding: 0,
              margin: '-1px',
              overflow: 'hidden',
              clip: 'rect(0,0,0,0)',
              whiteSpace: 'nowrap',
              border: 0,
            }}
          />
          <label
            ref={dropRef}
            htmlFor={inputId}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            style={{
              display: 'block',
              border: '2px dashed var(--color-border)',
              borderRadius: '16px',
              padding: preview ? '0' : '48px 24px',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'border-color 0.2s',
              overflow: 'hidden',
              background: 'var(--color-surface)',
            }}
          >

            {preview ? (
              <div style={{ position: 'relative' }}>
                <img
                  src={preview}
                  alt="Upload preview"
                  style={{ width: '100%', maxHeight: '400px', objectFit: 'contain', display: 'block' }}
                />
                {!analyzing && (
                  <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); reset(); }}
                    style={{
                      position: 'absolute', top: '12px', right: '12px',
                      width: '32px', height: '32px', borderRadius: '8px',
                      background: 'rgba(0,0,0,0.7)', border: 'none',
                      color: 'white', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            ) : (
              <>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="1.5" style={{ margin: '0 auto 16px', display: 'block', opacity: 0.5 }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p style={{ fontWeight: '600', marginBottom: '4px' }}>
                  Drop a photo here or click to upload
                </p>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>
                  JPEG, PNG, or WebP — max 10MB
                </p>
              </>
            )}
          </label>

          {/* Progress bar */}
          {analyzing && progress && (
            <div style={{ marginTop: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '14px', fontWeight: '500' }}>{progress.label}</span>
                <span style={{ fontSize: '14px', color: 'var(--color-text-muted)' }}>{progress.progress}%</span>
              </div>
              <div style={{ height: '6px', borderRadius: '3px', background: 'var(--color-elevated)', overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: '3px',
                  background: 'linear-gradient(90deg, var(--color-accent), var(--color-primary))',
                  width: `${progress.progress}%`,
                  transition: 'width 0.3s ease',
                }} />
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={{
              marginTop: '16px', padding: '12px 16px', borderRadius: '12px',
              background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.3)',
              color: '#DC2626', fontSize: '14px',
            }}>
              {error}
            </div>
          )}

          {/* Analyze button */}
          {image && !analyzing && (
            <button
              onClick={analyze}
              style={{
                marginTop: '24px', width: '100%',
                padding: '14px 24px', borderRadius: '9999px',
                background: 'var(--color-primary)', color: 'var(--color-text-dark)',
                fontWeight: '600', fontSize: '16px', border: 'none', cursor: 'pointer',
              }}
            >
              Analyze with AI
            </button>
          )}
        </div>
      ) : (
        /* Results state */
        <div>
          {/* Primary result */}
          <div style={{
            background: 'var(--color-surface)', borderRadius: '16px',
            border: '1px solid var(--color-border)', padding: '24px',
            textAlign: 'center', marginBottom: '16px',
          }}>
            <div style={{
              width: '64px', height: '64px', borderRadius: '16px',
              background: `${getBristolColor(result.primaryPrediction.type)}20`,
              color: getBristolColor(result.primaryPrediction.type),
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px', fontSize: '24px', fontWeight: '700',
            }}>
              {result.primaryPrediction.type.replace('Type ', '')}
            </div>
            <h3 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '4px' }}>
              Bristol {result.primaryPrediction.type}
            </h3>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '14px', marginBottom: '8px' }}>
              {result.primaryPrediction.confidence.toFixed(1)}% confidence
            </p>
            {result.actionHeroText && (
              <p style={{
                display: 'inline-block', padding: '6px 16px', borderRadius: '9999px',
                background: 'var(--color-primary)', color: 'var(--color-text-dark)',
                fontSize: '13px', fontWeight: '600',
              }}>
                {result.actionHeroText}
              </p>
            )}
          </div>

          {/* Screening results */}
          {result.screenings && (
            <div style={{
              background: 'var(--color-surface)', borderRadius: '16px',
              border: '1px solid var(--color-border)', overflow: 'hidden',
              marginBottom: '16px',
            }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)' }}>
                <h4 style={{ fontWeight: '600', fontSize: '14px' }}>Health Screening</h4>
              </div>
              {Object.entries(result.screenings).map(([key, screening]) => (
                <div key={key} style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '12px 20px',
                  borderBottom: '1px solid rgba(51,51,51,0.3)',
                }}>
                  <div style={{
                    width: '10px', height: '10px', borderRadius: '50%',
                    background: getStatusColor(screening.status), flexShrink: 0,
                  }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: '500', fontSize: '14px', textTransform: 'capitalize' }}>
                      {key}
                    </div>
                    <div style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>
                      {screening.recap}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* AI Analysis text */}
          {result.analysis && (
            <div style={{
              background: 'var(--color-surface)', borderRadius: '16px',
              border: '1px solid var(--color-border)', padding: '20px',
              marginBottom: '16px',
            }}>
              <h4 style={{ fontWeight: '600', fontSize: '14px', marginBottom: '8px' }}>AI Analysis</h4>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '14px', lineHeight: '1.6' }}>
                {result.analysis}
              </p>
            </div>
          )}

          {/* Action to consider */}
          {result.actionToConsider && (
            <div style={{
              background: 'linear-gradient(135deg, rgba(155,240,255,0.1), rgba(163,255,191,0.1))',
              borderRadius: '16px', border: '1px solid var(--color-border)',
              padding: '20px', marginBottom: '16px',
            }}>
              <h4 style={{ fontWeight: '600', fontSize: '14px', marginBottom: '4px' }}>
                Action to Consider
              </h4>
              <p style={{ fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
                {result.actionToConsider}
              </p>
              {result.actionDescription && (
                <p style={{ color: 'var(--color-text-muted)', fontSize: '13px', lineHeight: '1.5' }}>
                  {result.actionDescription}
                </p>
              )}
            </div>
          )}

          {/* CTA */}
          <div style={{
            textAlign: 'center', padding: '24px',
            background: 'var(--color-surface)', borderRadius: '16px',
            border: '1px solid var(--color-border)',
          }}>
            <p style={{ fontWeight: '600', marginBottom: '4px' }}>
              Want daily tracking & trends?
            </p>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '14px', marginBottom: '16px' }}>
              Download PoopCheck for full gut health scoring, pattern detection, and health reports.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <a
                href="/download/"
                style={{
                  padding: '10px 24px', borderRadius: '9999px',
                  background: 'var(--color-primary)', color: 'var(--color-text-dark)',
                  fontWeight: '600', fontSize: '14px', textDecoration: 'none',
                }}
              >
                Download App
              </a>
              <button
                onClick={reset}
                style={{
                  padding: '10px 24px', borderRadius: '9999px',
                  background: 'transparent', color: 'var(--color-text)',
                  fontWeight: '600', fontSize: '14px', border: '1px solid var(--color-border)',
                  cursor: 'pointer',
                }}
              >
                Analyze Another
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

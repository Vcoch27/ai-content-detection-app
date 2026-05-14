import React, { useMemo } from 'react';
import { AlertCircle, ChevronLeft, ChevronRight, Info, LocateFixed, Scissors } from 'lucide-react';

const roundToStep = (value, step) => Math.round(value / step) * step;
const roundOneDecimal = (value) => Math.round(value * 10) / 10;

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

export const formatSeconds = (value) => {
  if (!Number.isFinite(value)) return '0.0s';
  return `${roundOneDecimal(value).toFixed(1)}s`;
};

export const normalizeClipRange = ({
  start,
  end,
  duration,
  minClipDuration = 5,
  maxClipDuration = 10,
  step = 0.1,
  changedHandle = 'end',
}) => {
  const safeDuration = Math.max(0, Number(duration) || 0);

  if (safeDuration <= 0) {
    return [0, 0];
  }

  if (safeDuration < minClipDuration) {
    return [0, roundOneDecimal(safeDuration)];
  }

  const effectiveMax = Math.min(maxClipDuration, safeDuration);
  const safeStart = clamp(roundToStep(Number(start) || 0, step), 0, safeDuration);
  const safeEnd = clamp(roundToStep(Number(end) || 0, step), 0, safeDuration);
  let nextStart = safeStart;
  let nextEnd = safeEnd;

  if (changedHandle === 'start') {
    nextStart = clamp(nextStart, 0, Math.max(safeDuration - minClipDuration, 0));
    nextEnd = clamp(nextEnd, nextStart + minClipDuration, nextStart + effectiveMax);
    nextEnd = Math.min(nextEnd, safeDuration);
    if (nextEnd - nextStart > effectiveMax) {
      nextEnd = nextStart + effectiveMax;
    }
  } else {
    nextEnd = clamp(nextEnd, minClipDuration, safeDuration);
    nextStart = clamp(nextStart, Math.max(nextEnd - effectiveMax, 0), nextEnd - minClipDuration);
    if (nextEnd - nextStart < minClipDuration) {
      nextStart = nextEnd - minClipDuration;
    }
  }

  if (nextEnd - nextStart < minClipDuration) {
    if (changedHandle === 'start') {
      nextEnd = Math.min(safeDuration, nextStart + minClipDuration);
    } else {
      nextStart = Math.max(0, nextEnd - minClipDuration);
    }
  }

  if (nextEnd - nextStart > effectiveMax) {
    if (changedHandle === 'start') {
      nextEnd = Math.min(safeDuration, nextStart + effectiveMax);
    } else {
      nextStart = Math.max(0, nextEnd - effectiveMax);
    }
  }

  return [roundOneDecimal(nextStart), roundOneDecimal(nextEnd)];
};

export const getDefaultClipRange = ({
  duration,
  minClipDuration = 5,
  maxClipDuration = 10,
}) => {
  const safeDuration = Math.max(0, Number(duration) || 0);

  if (safeDuration <= 0) return [0, 0];
  if (safeDuration < minClipDuration) return [0, roundOneDecimal(safeDuration)];
  if (safeDuration <= maxClipDuration) return [0, roundOneDecimal(safeDuration)];
  return [0, maxClipDuration];
};

const getClipDuration = (start, end) => Math.max(0, end - start);

const getZoomWindow = ({ start, end, duration, maxClipDuration }) => {
  const safeDuration = Math.max(0, Number(duration) || 0);
  const clipDuration = getClipDuration(start, end);
  const targetWindowSize = Math.max(clipDuration + 10, maxClipDuration + 5);
  const windowSize = Math.min(safeDuration, targetWindowSize);
  const center = start + clipDuration / 2;
  let windowStart = clamp(center - windowSize / 2, 0, Math.max(safeDuration - windowSize, 0));
  let windowEnd = windowStart + windowSize;

  if (windowEnd > safeDuration) {
    windowEnd = safeDuration;
    windowStart = Math.max(0, windowEnd - windowSize);
  }

  return {
    start: roundOneDecimal(windowStart),
    end: roundOneDecimal(windowEnd),
    duration: roundOneDecimal(windowEnd - windowStart),
  };
};

const getTicks = (windowStart, windowEnd) => {
  const windowDuration = Math.max(0, windowEnd - windowStart);
  const interval = windowDuration <= 16 ? 1 : windowDuration <= 32 ? 2 : 5;
  const firstTick = Math.ceil(windowStart / interval) * interval;
  const ticks = [];

  for (let tick = firstTick; tick <= windowEnd + 0.001; tick += interval) {
    ticks.push(roundOneDecimal(tick));
  }

  return ticks;
};

export const VideoClipRangeSelector = ({
  duration,
  value,
  onChange,
  minClipDuration = 5,
  maxClipDuration = 10,
  step = 0.1,
  disabled = false,
}) => {
  const [start, end] = value;
  const safeDuration = Math.max(0, Number(duration) || 0);
  const isTooShort = safeDuration > 0 && safeDuration < minClipDuration;
  const isDisabled = disabled || safeDuration <= 0 || isTooShort;
  const clipDuration = Math.max(0, end - start);

  const overviewPositions = useMemo(() => {
    if (safeDuration <= 0) {
      return { startPercent: 0, endPercent: 0, midPercent: 0, widthPercent: 0 };
    }

    const startPercent = clamp((start / safeDuration) * 100, 0, 100);
    const endPercent = clamp((end / safeDuration) * 100, 0, 100);
    return {
      startPercent,
      endPercent,
      midPercent: (startPercent + endPercent) / 2,
      widthPercent: Math.max(endPercent - startPercent, 0),
    };
  }, [end, safeDuration, start]);

  const zoomWindow = useMemo(
    () => getZoomWindow({ start, end, duration: safeDuration, maxClipDuration }),
    [end, maxClipDuration, safeDuration, start]
  );

  const zoomPositions = useMemo(() => {
    if (zoomWindow.duration <= 0) {
      return { startPercent: 0, endPercent: 0, widthPercent: 0 };
    }

    const startPercent = clamp(((start - zoomWindow.start) / zoomWindow.duration) * 100, 0, 100);
    const endPercent = clamp(((end - zoomWindow.start) / zoomWindow.duration) * 100, 0, 100);

    return {
      startPercent,
      endPercent,
      widthPercent: Math.max(endPercent - startPercent, 0),
    };
  }, [end, start, zoomWindow.duration, zoomWindow.start]);

  const ticks = useMemo(
    () => getTicks(zoomWindow.start, zoomWindow.end),
    [zoomWindow.end, zoomWindow.start]
  );

  const commitChange = (nextValue, changedHandle) => {
    const [nextStart, nextEnd] = normalizeClipRange({
      start: nextValue[0],
      end: nextValue[1],
      duration: safeDuration,
      minClipDuration,
      maxClipDuration,
      step,
      changedHandle,
    });
    onChange([nextStart, nextEnd]);
  };

  const valueFromClientX = (clientX, trackEl, minValue = 0, maxValue = safeDuration) => {
    const rect = trackEl.getBoundingClientRect();
    const percent = clamp((clientX - rect.left) / rect.width, 0, 1);
    return roundToStep(minValue + percent * (maxValue - minValue), step);
  };

  const startDrag = (event, handle) => {
    if (isDisabled) return;
    event.preventDefault();
    event.stopPropagation();

    const trackEl = event.currentTarget.closest('[data-zoom-track]');
    if (!trackEl) return;

    const move = (moveEvent) => {
      const nextValue = valueFromClientX(moveEvent.clientX, trackEl, zoomWindow.start, zoomWindow.end);
      if (handle === 'start') {
        commitChange([nextValue, end], 'start');
      } else {
        commitChange([start, nextValue], 'end');
      }
    };

    const stop = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', stop);
    };

    move(event);
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', stop, { once: true });
  };

  const handleZoomPointerDown = (event) => {
    if (isDisabled) return;
    const nextValue = valueFromClientX(event.clientX, event.currentTarget, zoomWindow.start, zoomWindow.end);
    const handle = Math.abs(nextValue - start) <= Math.abs(nextValue - end) ? 'start' : 'end';
    startDrag(event, handle);
  };

  const moveClip = (deltaSeconds) => {
    if (isDisabled) return;
    const nextStart = clamp(roundToStep(start + deltaSeconds, step), 0, safeDuration - clipDuration);
    const nextEnd = nextStart + clipDuration;
    onChange([roundOneDecimal(nextStart), roundOneDecimal(nextEnd)]);
  };

  const setFirstClip = (seconds) => {
    if (isDisabled) return;
    const targetDuration = Math.min(seconds, safeDuration);
    const [nextStart, nextEnd] = normalizeClipRange({
      start: 0,
      end: targetDuration,
      duration: safeDuration,
      minClipDuration,
      maxClipDuration,
      step,
      changedHandle: 'end',
    });
    onChange([nextStart, nextEnd]);
  };

  const centerOnOverviewPosition = (event) => {
    if (isDisabled) return;
    const targetCenter = valueFromClientX(event.clientX, event.currentTarget);
    const nextStart = clamp(
      roundToStep(targetCenter - clipDuration / 2, step),
      0,
      Math.max(safeDuration - clipDuration, 0)
    );
    onChange([roundOneDecimal(nextStart), roundOneDecimal(nextStart + clipDuration)]);
  };

  const handleKeyDown = (event, handle) => {
    if (isDisabled) return;

    const largerStep = 1;
    let delta = 0;

    if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') delta = -step;
    if (event.key === 'ArrowRight' || event.key === 'ArrowUp') delta = step;
    if (event.key === 'PageDown') delta = -largerStep;
    if (event.key === 'PageUp') delta = largerStep;

    if (event.key === 'Home') {
      event.preventDefault();
      commitChange(handle === 'start' ? [0, end] : [start, minClipDuration], handle);
      return;
    }

    if (event.key === 'End') {
      event.preventDefault();
      commitChange(
        handle === 'start' ? [safeDuration - minClipDuration, end] : [start, safeDuration],
        handle
      );
      return;
    }

    if (delta === 0) return;
    event.preventDefault();

    if (handle === 'start') {
      commitChange([start + delta, end], 'start');
    } else {
      commitChange([start, end + delta], 'end');
    }
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
            <Scissors size={21} />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-950">Clip Selection</h3>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              Choose a {minClipDuration}-{maxClipDuration} second segment for AI
              detection.
            </p>
          </div>
        </div>
        <div className="inline-flex w-fit items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-sm font-bold text-blue-700">
          {formatSeconds(clipDuration)} selected
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-800">
        <div className="flex gap-2">
          <Info size={17} className="mt-0.5 shrink-0" />
          <p>
            Choose a clip between {minClipDuration} and {maxClipDuration} seconds. Only the selected
            clip is sent for AI detection.
          </p>
        </div>
      </div>

      {isTooShort ? (
        <div className="mt-4 flex gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-700">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <p>This video is too short. Please upload a video longer than 5 seconds.</p>
        </div>
      ) : (
        <>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-500">Selected range</p>
              <p className="mt-1 text-lg font-bold text-slate-950">
                {formatSeconds(start)} - {formatSeconds(end)}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-500">Clip duration</p>
              <p className="mt-1 text-lg font-bold text-slate-950">{formatSeconds(clipDuration)}</p>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="mb-8 flex items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-bold text-slate-900">Full Video Overview</h4>
                <p className="mt-1 text-xs text-slate-500">Click the timeline to move the clip.</p>
              </div>
              <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-600 shadow-sm">
                {formatSeconds(safeDuration)} total
              </span>
            </div>

            <div
              data-overview-track
              onPointerDown={centerOnOverviewPosition}
              className="relative h-2 cursor-pointer rounded-full bg-slate-200"
            >
              <div
                className="absolute top-0 h-2 max-w-full rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 shadow-sm transition-all duration-200"
                style={{
                  left: `${overviewPositions.startPercent}%`,
                  width: `max(24px, ${overviewPositions.widthPercent}%)`,
                  maxWidth: `calc(100% - ${overviewPositions.startPercent}%)`,
                }}
              />
              <div
                className="pointer-events-none absolute -top-8 -translate-x-1/2 rounded-full bg-blue-600 px-2.5 py-1 text-xs font-bold text-white shadow-sm"
                style={{
                  left: `clamp(2.25rem, ${overviewPositions.midPercent}%, calc(100% - 2.25rem))`,
                }}
              >
                {formatSeconds(clipDuration)}
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between text-xs font-medium text-slate-500">
              <span>Start: 0s</span>
              <span>End: {formatSeconds(safeDuration)}</span>
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-900">Zoomed Clip Editor</h4>
                <p className="mt-1 text-xs text-slate-500">
                  Editing window: {formatSeconds(zoomWindow.start)} - {formatSeconds(zoomWindow.end)}
                </p>
              </div>
              <span className="w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                Zoom follows selected clip
              </span>
            </div>

            <div className="relative px-3 pb-8 pt-9">
              <div
                data-zoom-track
                onPointerDown={handleZoomPointerDown}
                className="relative h-4 cursor-pointer rounded-full bg-slate-200"
              >
                <div
                  className="absolute top-0 h-4 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 shadow-sm transition-all duration-200"
                  style={{
                    left: `${zoomPositions.startPercent}%`,
                    width: `${zoomPositions.widthPercent}%`,
                  }}
                />

                {ticks.map((tick) => {
                  const left = ((tick - zoomWindow.start) / zoomWindow.duration) * 100;
                  return (
                    <div
                      key={tick}
                      className="pointer-events-none absolute top-6 -translate-x-1/2 text-center"
                      style={{ left: `${clamp(left, 0, 100)}%` }}
                    >
                      <div className="mx-auto h-2 w-px bg-slate-300" />
                      <span className="mt-1 block text-[10px] font-medium text-slate-500">
                        {formatSeconds(tick)}
                      </span>
                    </div>
                  );
                })}

                <div
                  className="pointer-events-none absolute -top-9 -translate-x-1/2 rounded-full bg-slate-950 px-2.5 py-1 text-xs font-bold text-white shadow-sm"
                  style={{ left: `clamp(2.25rem, ${zoomPositions.startPercent}%, calc(100% - 2.25rem))` }}
                >
                  Start: {formatSeconds(start)}
                </div>
                <div
                  className="pointer-events-none absolute -top-9 -translate-x-1/2 rounded-full bg-slate-950 px-2.5 py-1 text-xs font-bold text-white shadow-sm"
                  style={{ left: `clamp(2.25rem, ${zoomPositions.endPercent}%, calc(100% - 2.25rem))` }}
                >
                  End: {formatSeconds(end)}
                </div>

                <button
                  type="button"
                  role="slider"
                  aria-label="Clip start time"
                  aria-valuemin={0}
                  aria-valuemax={Math.max(end - minClipDuration, 0)}
                  aria-valuenow={roundOneDecimal(start)}
                  aria-valuetext={formatSeconds(start)}
                  disabled={isDisabled}
                  onPointerDown={(event) => startDrag(event, 'start')}
                  onKeyDown={(event) => handleKeyDown(event, 'start')}
                  className="absolute -top-3 h-10 w-10 -translate-x-1/2 rounded-full border-4 border-white bg-blue-600 shadow-lg shadow-blue-600/25 transition-all duration-200 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed"
                  style={{ left: `${zoomPositions.startPercent}%` }}
                />
                <button
                  type="button"
                  role="slider"
                  aria-label="Clip end time"
                  aria-valuemin={Math.min(start + minClipDuration, safeDuration)}
                  aria-valuemax={safeDuration}
                  aria-valuenow={roundOneDecimal(end)}
                  aria-valuetext={formatSeconds(end)}
                  disabled={isDisabled}
                  onPointerDown={(event) => startDrag(event, 'end')}
                  onKeyDown={(event) => handleKeyDown(event, 'end')}
                  className="absolute -top-3 h-10 w-10 -translate-x-1/2 rounded-full border-4 border-white bg-indigo-600 shadow-lg shadow-indigo-600/25 transition-all duration-200 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed"
                  style={{ left: `${zoomPositions.endPercent}%` }}
                />
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => moveClip(-1)}
              disabled={isDisabled || start <= 0}
              className="inline-flex h-10 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-200 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ChevronLeft size={16} /> -1s
            </button>
            <button
              type="button"
              onClick={() => moveClip(1)}
              disabled={isDisabled || end >= safeDuration}
              className="inline-flex h-10 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-200 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              +1s <ChevronRight size={16} />
            </button>
            <button
              type="button"
              onClick={() => setFirstClip(minClipDuration)}
              disabled={isDisabled}
              className="inline-flex h-10 items-center rounded-full border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-200 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              First {minClipDuration}s
            </button>
            <button
              type="button"
              onClick={() => setFirstClip(maxClipDuration)}
              disabled={isDisabled}
              className="inline-flex h-10 items-center rounded-full border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-200 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              First {maxClipDuration}s
            </button>
            <span className="inline-flex h-10 items-center gap-1.5 rounded-full bg-blue-50 px-3 text-sm font-semibold text-blue-700">
              <LocateFixed size={16} /> Centered on clip
            </span>
          </div>

          <div className="grid gap-2 text-xs font-medium text-slate-500 sm:grid-cols-2">
            <span className="rounded-full bg-slate-100 px-3 py-2">
              Minimum clip length: {minClipDuration}s
            </span>
            <span className="rounded-full bg-slate-100 px-3 py-2">
              Maximum clip length: {maxClipDuration}s
            </span>
          </div>
        </>
      )}
    </section>
  );
};

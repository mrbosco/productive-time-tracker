import { useEffect } from 'react';

/**
 * Module-level on purpose. The day route and the two entry-form routes each render their own
 * `DayView`, so opening the form unmounts one and mounts another - and a keyed CSS animation
 * replays on the new element every time, which read as the day reloading when nothing had changed.
 * Component state resets with the remount; this does not.
 */
let lastEnteredDay: string | null = null;

/**
 * Whether this day is arriving now rather than already being on screen. The caller picks its own
 * animation; several parts of the day animate together, so each asks during the same render pass
 * and they all get the same answer before any effect runs.
 *
 * `settled` is for the one caller that knows whether the day is really on screen: a skeleton would
 * otherwise spend the entrance, and the rows it stands in for would appear without one. Callers
 * that cannot tell leave it alone and only ask.
 */
export function useDayEntrance(date: string, settled = false): boolean {
	const isNewDay = lastEnteredDay !== date;

	useEffect(() => {
		if (settled) lastEnteredDay = date;
	}, [date, settled]);

	return isNewDay;
}

import { useEffect } from 'react';

/**
 * Module-level on purpose. The day route and the two entry-form routes each render their own
 * `DayView`, so opening the form unmounts one and mounts another - and a keyed CSS animation
 * replays on the new element every time, which read as the day reloading when nothing had changed.
 * Component state resets with the remount; this does not.
 */
let lastEnteredDay: string | null = null;

/**
 * The entrance class for a day, or nothing when this day is already on screen.
 *
 * Several parts of the day animate together, so each asks during the same render pass and they all
 * get the same answer before any effect runs.
 */
export function useDayEntrance(date: string): string {
	const isNewDay = lastEnteredDay !== date;

	useEffect(() => {
		lastEnteredDay = date;
	}, [date]);

	return isNewDay ? 'animate-day-in' : '';
}

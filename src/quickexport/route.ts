export interface BacklogRoute {
  team: string;
  level: string;
}

/** Pulls the team and backlog-level names out of a `.../_backlogs/backlog/{team}/{level}` path. */
export function parseBacklogRoute(pathname: string): BacklogRoute | null {
  const segs = pathname.split('/').filter((s) => s.length > 0);
  const i = segs.indexOf('_backlogs');
  if (i < 0 || segs[i + 1] !== 'backlog') return null;
  const team = segs[i + 2];
  const level = segs[i + 3];
  if (!team || !level) return null;
  return { team: decodeURIComponent(team), level: decodeURIComponent(level) };
}

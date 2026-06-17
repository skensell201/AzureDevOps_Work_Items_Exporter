import { parseBacklogRoute } from '../route';

describe('parseBacklogRoute', () => {
  it('extracts team and level from a standard backlog path', () => {
    const path = '/tfs/DefaultCollection/GIS%20BIOM/_backlogs/backlog/GIS%20BIOM%20LogManagement/Stories/';
    expect(parseBacklogRoute(path)).toEqual({ team: 'GIS BIOM LogManagement', level: 'Stories' });
  });

  it('handles no trailing slash', () => {
    const path = '/Proj/_backlogs/backlog/Team%20A/Epics';
    expect(parseBacklogRoute(path)).toEqual({ team: 'Team A', level: 'Epics' });
  });

  it('returns null when not on a backlog route', () => {
    expect(parseBacklogRoute('/Proj/_boards/board/Team/Stories')).toBeNull();
  });

  it('returns null when the level segment is missing', () => {
    expect(parseBacklogRoute('/Proj/_backlogs/backlog/Team%20A')).toBeNull();
  });
});

import { projects as publicProjects } from '../site/data/projects.mjs';

export const signature = 'Somewhere between code and stars.';

// Keep the full project catalogue in site/data/projects.mjs. Only these two
// IDs receive a large feature; every project remains in the compact list.
export const pinnedProjectIds = ['shinsungin', 'momu'];
export const projects = publicProjects;

if (pinnedProjectIds.length > 2 || new Set(pinnedProjectIds).size !== pinnedProjectIds.length) {
  throw new Error('Choose at most two different pinned projects');
}
export const pinnedProjects = pinnedProjectIds.map(id => {
  const project = projects.find(project => project.id === id);
  if (!project) throw new Error(`Unknown pinned project: ${id}`);
  return project;
});

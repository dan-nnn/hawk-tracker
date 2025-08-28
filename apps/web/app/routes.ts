import { type RouteConfig, index, route } from '@react-router/dev/routes';

export default [
  index('routes/home.tsx'),
  route('profile', 'components/profile/index.tsx'),
  route('projects/:projectId/settings', 'components/projects/[projectId]/settings/page.tsx'),
  route('behavior-monitor', 'routes/behavior-monitor.tsx'),
  {
    path: '/login',
    file: 'routes/login.tsx',
  },
  {
    path: '/register',
    file: 'routes/register.tsx',
  },
] satisfies RouteConfig;

import { MotionConfig } from 'motion/react';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate, RouterProvider, createHashRouter } from 'react-router';
import { Layout } from './components/Layout';
import { RequireData } from './components/RequireData';
import { applyLanguage } from './i18n';
import { Home } from './pages/Home';
import { QuickPlay } from './pages/QuickPlay';
import { QuickSetup } from './pages/QuickSetup';
import { QuickWinner } from './pages/QuickWinner';
import { useData } from './store/data';
import { applyTheme, useSettings } from './store/settings';

// hash URLs (#/quick) work on any static host without server setup
const router = createHashRouter([
  {
    element: <Layout />,
    children: [
      { path: '/', element: <Home /> },
      {
        path: '/quick',
        element: (
          <RequireData>
            <QuickSetup />
          </RequireData>
        ),
      },
      {
        path: '/quick/play',
        element: (
          <RequireData>
            <QuickPlay />
          </RequireData>
        ),
      },
      {
        path: '/quick/winner',
        element: (
          <RequireData>
            <QuickWinner />
          </RequireData>
        ),
      },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
]);

export function App() {
  const { t } = useTranslation();
  const lang = useSettings((s) => s.lang);
  const theme = useSettings((s) => s.theme);

  useEffect(() => {
    applyLanguage(lang);
  }, [lang]);

  useEffect(() => {
    document.title = t('app.title');
  }, [t, lang]);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    void useData.getState().load();
  }, []);

  return (
    <MotionConfig reducedMotion="user">
      <RouterProvider router={router} />
    </MotionConfig>
  );
}

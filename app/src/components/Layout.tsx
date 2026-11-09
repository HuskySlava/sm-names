import { Outlet } from 'react-router';
import { Header } from './Header';
import styles from './Layout.module.css';

export function Layout() {
  return (
    <>
      <Header />
      <main className={styles.main}>
        <Outlet />
      </main>
    </>
  );
}

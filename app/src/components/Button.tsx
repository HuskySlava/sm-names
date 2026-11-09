import type { ButtonHTMLAttributes } from 'react';
import { Link, type LinkProps } from 'react-router';
import styles from './Button.module.css';

type Variant = 'primary' | 'secondary';

const className = (variant: Variant, extra?: string) =>
  [styles.button, styles[variant], extra].filter(Boolean).join(' ');

export function Button({
  variant = 'primary',
  className: extra,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return <button type="button" className={className(variant, extra)} {...props} />;
}

export function ButtonLink({
  variant = 'primary',
  className: extra,
  ...props
}: LinkProps & { variant?: Variant }) {
  return <Link className={className(variant, extra)} {...props} />;
}

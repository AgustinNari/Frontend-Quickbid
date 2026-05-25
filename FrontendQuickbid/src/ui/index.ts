/**
 * Sistema de UI de QuickBid — barrel export.
 *
 * Importar componentes y tipos desde acá:
 *   import { Button, TextField, Card, Icon } from '../ui';
 *   import type { IconName } from '../ui';
 *
 * Los design tokens viven en `../theme`:
 *   import { colors, spacing } from '../theme';
 */

// Typography
export {
  Typography,
  Heading,
  Subheading,
  Body,
  Label,
  Caption,
  Overline,
} from './Typography';

// Controles
export { Button } from './Button';
export { TextField } from './TextField';

// Surfaces
export { Card } from './Card';
export { Badge } from './Badge';

// Layout
export { ScreenContainer } from './ScreenContainer';

// Feedback / estados
export { EmptyState } from './EmptyState';
export { Loader } from './Loader';

// Iconografía
export { Icon } from './Icon';
export type { IconName } from './Icon';

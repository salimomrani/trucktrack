import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

export type EmptyStatePreset =
  | 'trucks'
  | 'trips'
  | 'alerts'
  | 'analytics'
  | 'search'
  | 'users'
  | 'map'
  | 'notifications'
  | 'generic';

interface PresetConfig {
  title: string;
  message: string;
  illustration: string;
}

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './empty-state.component.html',
  styleUrls: ['./empty-state.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EmptyStateComponent {
  /** Preset type for quick configuration */
  readonly preset = input<EmptyStatePreset>('generic');

  /** Custom title (overrides preset) */
  readonly title = input<string | null>(null);

  /** Custom message (overrides preset) */
  readonly message = input<string | null>(null);

  /** Custom icon (overrides preset illustration) */
  readonly icon = input<string | null>(null);

  /** Action button text */
  readonly actionText = input<string | null>(null);

  /** Action button icon */
  readonly actionIcon = input<string>('add');

  /** Size variant */
  readonly size = input<'sm' | 'md' | 'lg'>('md');

  /** Emits when action button is clicked */
  readonly action = output<void>();

  private readonly presets: Record<EmptyStatePreset, PresetConfig> = {
    trucks: {
      title: 'Aucun camion',
      message: 'Aucun camion n\'est disponible pour le moment.',
      illustration: 'truck'
    },
    trips: {
      title: 'Aucun trajet',
      message: 'Aucun trajet n\'a été trouvé pour cette période.',
      illustration: 'trip'
    },
    alerts: {
      title: 'Aucune alerte',
      message: 'Tout est en ordre ! Aucune alerte à signaler.',
      illustration: 'alert'
    },
    analytics: {
      title: 'Aucune donnée',
      message: 'Il n\'y a pas de données analytics pour cette période.',
      illustration: 'analytics'
    },
    search: {
      title: 'Aucun résultat',
      message: 'Aucun résultat ne correspond à votre recherche.',
      illustration: 'search'
    },
    users: {
      title: 'Aucun utilisateur',
      message: 'Aucun utilisateur n\'a été trouvé.',
      illustration: 'users'
    },
    map: {
      title: 'Aucune position',
      message: 'Aucun véhicule n\'est actuellement localisé.',
      illustration: 'map'
    },
    notifications: {
      title: 'Aucune notification',
      message: 'Vous êtes à jour ! Aucune notification.',
      illustration: 'notifications'
    },
    generic: {
      title: 'Aucune donnée',
      message: 'Aucune donnée disponible pour le moment.',
      illustration: 'generic'
    }
  };

  get config(): PresetConfig {
    return this.presets[this.preset()];
  }

  get displayTitle(): string {
    return this.title() ?? this.config.title;
  }

  get displayMessage(): string {
    return this.message() ?? this.config.message;
  }

  get illustrationType(): string {
    return this.icon() ? 'icon' : this.config.illustration;
  }

  get sizeClasses(): { container: string; illustration: string; title: string; message: string } {
    const sizes = {
      sm: {
        container: 'py-6 px-4',
        illustration: 'w-16 h-16 mb-3',
        title: 'text-base',
        message: 'text-sm'
      },
      md: {
        container: 'py-10 px-6',
        illustration: 'w-24 h-24 mb-4',
        title: 'text-lg',
        message: 'text-sm'
      },
      lg: {
        container: 'py-16 px-8',
        illustration: 'w-32 h-32 mb-6',
        title: 'text-xl',
        message: 'text-base'
      }
    };
    return sizes[this.size()];
  }

  onAction(): void {
    this.action.emit();
  }
}

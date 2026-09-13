import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthStore } from '../../core/auth/auth.store';
import { ThemeStore } from '../../core/theme/theme.store';

@Component({
  selector: 'app-top-bar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './top-bar.html',
  styleUrl: './top-bar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TopBar {
  private readonly router = inject(Router);

  protected readonly theme = inject(ThemeStore);
  protected readonly auth = inject(AuthStore);

  protected async signOut(): Promise<void> {
    await this.auth.logout();
    await this.router.navigate(['/login']);
  }
}

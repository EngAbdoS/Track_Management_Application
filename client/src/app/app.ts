import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TopBar } from './layout/top-bar/top-bar';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, TopBar],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {}
